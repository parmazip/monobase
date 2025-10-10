import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getChatMessages,
  sendChatMessage,
  type ChatMessage,
  type GetChatMessagesParams,
  type SendTextMessageRequest,
  type StartVideoCallRequest,
  type PaginatedResponse,
} from '../../services/comms'
import { queryKeys } from '../query-keys'
import { ApiError } from '../../api'

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get messages from a chat room with pagination
 */
export function useChatMessages(
  roomId: string,
  params?: GetChatMessagesParams,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: queryKeys.chatMessagesList(roomId, params),
    queryFn: () => getChatMessages(roomId, params),
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      // Don't retry on authentication or not found errors
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to get messages with infinite scrolling
 * Useful for chat interfaces that load more messages on scroll
 */
export function useInfiniteChatMessages(
  roomId: string,
  params?: Omit<GetChatMessagesParams, 'offset' | 'limit'> & {
    limit?: number
  }
) {
  const limit = params?.limit ?? 50

  return useInfiniteQuery({
    queryKey: queryKeys.chatMessagesList(roomId, { ...params, limit }),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getChatMessages(roomId, {
        ...params,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedResponse<ChatMessage>, pages: PaginatedResponse<ChatMessage>[]) => {
      const loadedCount = pages.reduce((sum, page) => sum + page.items.length, 0)
      if (loadedCount < lastPage.total) {
        return loadedCount
      }
      return undefined
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication or not found errors
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to send a text message to a chat room
 */
export function useSendMessage(options?: {
  onSuccess?: (data: ChatMessage) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, message }: {
      roomId: string
      message: string
    }) => {
      const request: SendTextMessageRequest = {
        messageType: 'text',
        message,
      }
      return sendChatMessage(roomId, request)
    },
    onSuccess: (data, variables) => {
      // Invalidate the messages list for this room
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages(variables.roomId)
      })

      // Also invalidate the chat room to update lastMessageAt and messageCount
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRoom(variables.roomId)
      })

      // Optionally update the chat rooms list to reflect the new last message
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRooms()
      })

      options?.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to send message')
      } else {
        toast.error('Failed to send message. Please try again.')
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to start a video call in a chat room
 */
export function useStartVideoCall(options?: {
  onSuccess?: (data: ChatMessage) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, participants = [] }: {
      roomId: string
      participants?: Array<{
        user: string
        displayName: string
        audioEnabled: boolean
        videoEnabled: boolean
      }>
    }) => {
      const request: StartVideoCallRequest = {
        messageType: 'video_call',
        videoCallData: {
          status: 'starting',
          participants,
        },
      }
      return sendChatMessage(roomId, request)
    },
    onSuccess: (data, variables) => {
      // Invalidate the messages list for this room
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages(variables.roomId)
      })

      // Also invalidate the chat room to update activeVideoCallMessage
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRoom(variables.roomId)
      })

      toast.success('Video call started!')

      options?.onSuccess?.(data)
    },
    onError: (error, variables) => {
      console.error('Failed to start video call:', error)
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error('A video call is already active in this room')
        } else if (error.status === 403) {
          toast.error('You do not have permission to start a video call')
        } else {
          toast.error(error.message || 'Failed to start video call')
        }
      } else {
        toast.error('Failed to start video call. Please try again.')
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to send a message (generic - can be text or video call)
 */
export function useSendChatMessage(options?: {
  onSuccess?: (data: ChatMessage) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, message }: {
      roomId: string
      message: SendTextMessageRequest | StartVideoCallRequest
    }) => sendChatMessage(roomId, message),
    onSuccess: (data, variables) => {
      // Invalidate the messages list for this room
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages(variables.roomId)
      })

      // Also invalidate the chat room
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRoom(variables.roomId)
      })

      // Optionally update the chat rooms list
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRooms()
      })

      const isVideoCall = variables.message.messageType === 'video_call'
      if (isVideoCall) {
        toast.success('Video call started!')
      }

      options?.onSuccess?.(data)
    },
    onError: (error, variables) => {
      const isVideoCall = variables.message.messageType === 'video_call'
      const errorPrefix = isVideoCall ? 'Failed to start video call' : 'Failed to send message'

      console.error(errorPrefix + ':', error)
      if (error instanceof ApiError) {
        if (error.status === 409 && isVideoCall) {
          toast.error('A video call is already active in this room')
        } else if (error.status === 403) {
          toast.error(`You do not have permission to ${isVideoCall ? 'start a video call' : 'send messages'}`)
        } else {
          toast.error(error.message || errorPrefix)
        }
      } else {
        toast.error(errorPrefix + '. Please try again.')
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to prefetch messages for a chat room
 * Useful for hover/focus states to improve perceived performance
 */
export function usePrefetchChatMessages() {
  const queryClient = useQueryClient()

  return (roomId: string, params?: GetChatMessagesParams) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.chatMessagesList(roomId, params),
      queryFn: () => getChatMessages(roomId, params),
      staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    })
  }
}

/**
 * Hook to invalidate chat message queries
 * Useful for manual refresh or after external updates
 */
export function useInvalidateChatMessages() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: (roomId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(roomId) })
    },
    invalidateList: (roomId: string, params?: GetChatMessagesParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessagesList(roomId, params) })
    },
    invalidateMessage: (roomId: string, messageId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessage(roomId, messageId) })
    },
  }
}

/**
 * Hook for optimistic message updates
 * Adds message to cache immediately for better UX
 */
export function useOptimisticSendMessage(options?: {
  onSuccess?: (data: ChatMessage) => void
  onError?: (error: Error, rollbackMessage: ChatMessage) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, message, tempId, sender }: {
      roomId: string
      message: string
      tempId: string
      sender: string
    }) => {
      const request: SendTextMessageRequest = {
        messageType: 'text',
        message,
      }
      return sendChatMessage(roomId, request)
    },
    onMutate: async ({ roomId, message, tempId, sender }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chatMessages(roomId) })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<PaginatedResponse<ChatMessage>>(
        queryKeys.chatMessagesList(roomId, {})
      )

      // Optimistically update with temporary message
      const tempMessage: ChatMessage = {
        id: tempId,
        chatRoom: roomId,
        sender,
        timestamp: new Date().toISOString(),
        messageType: 'text',
        message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (previousMessages) {
        queryClient.setQueryData<PaginatedResponse<ChatMessage>>(
          queryKeys.chatMessagesList(roomId, {}),
          {
            ...previousMessages,
            items: [tempMessage, ...previousMessages.items],
            total: previousMessages.total + 1,
          }
        )
      }

      // Return a context object with the snapshotted value
      return { previousMessages, tempMessage }
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chatMessagesList(variables.roomId, {}),
          context.previousMessages
        )
      }

      console.error('Failed to send message:', error)
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to send message')
      } else {
        toast.error('Failed to send message. Please try again.')
      }

      if (context?.tempMessage) {
        options?.onError?.(error, context.tempMessage)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages(variables.roomId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRoom(variables.roomId)
      })
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
  })
}