import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createChatRoom,
  listChatRooms,
  getChatRoom,
  type ChatRoom,
  type CreateChatRoomRequest,
  type ListChatRoomsParams,
  type PaginatedResponse,
} from '../../services/comms'
import { queryKeys } from '../query-keys'
import { ApiError } from '../../api'

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to list chat rooms where the current user is a participant
 */
export function useChatRooms(params?: ListChatRoomsParams) {
  return useQuery({
    queryKey: queryKeys.chatRoomsList(params),
    queryFn: () => listChatRooms(params),
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof ApiError && error.status === 401) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to get a specific chat room by ID
 */
export function useChatRoom(roomId: string, options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.chatRoom(roomId),
    queryFn: () => getChatRoom(roomId),
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
 * Hook to create a new chat room
 */
export function useCreateChatRoom(options?: {
  onSuccess?: (data: ChatRoom) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createChatRoom,
    onSuccess: (data) => {
      // Invalidate the chat rooms list
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms() })
      // Set the new chat room data in cache
      queryClient.setQueryData(queryKeys.chatRoom(data.id), data)

      // Show success message for new rooms (status 201)
      // Upsert returns existing room with status 200
      toast.success('Chat room created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('Failed to create chat room:', error)
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error('Chat room already exists. Try enabling upsert option.')
        } else {
          toast.error(error.message || 'Failed to create chat room')
        }
      } else {
        toast.error('Failed to create chat room. Please try again.')
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to create or get existing chat room with upsert
 * Convenience wrapper around useCreateChatRoom with upsert: true
 */
export function useUpsertChatRoom(options?: {
  onSuccess?: (data: ChatRoom, created: boolean) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: Omit<CreateChatRoomRequest, 'upsert'>) =>
      createChatRoom({ ...request, upsert: true }),
    onSuccess: (data, variables) => {
      // Invalidate the chat rooms list
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms() })
      // Set the chat room data in cache
      queryClient.setQueryData(queryKeys.chatRoom(data.id), data)

      // Determine if this was a new room or existing
      // We can check if the room already existed in our cache
      const existingData = queryClient.getQueryData<ChatRoom>(queryKeys.chatRoom(data.id))
      const isNew = !existingData || existingData.createdAt !== data.createdAt

      if (isNew) {
        toast.success('Chat room created successfully!')
      }

      options?.onSuccess?.(data, isNew)
    },
    onError: (error) => {
      console.error('Failed to upsert chat room:', error)
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to create or get chat room')
      } else {
        toast.error('Failed to create or get chat room. Please try again.')
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to prefetch a chat room
 * Useful for hover/focus states to improve perceived performance
 */
export function usePrefetchChatRoom() {
  const queryClient = useQueryClient()

  return (roomId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.chatRoom(roomId),
      queryFn: () => getChatRoom(roomId),
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    })
  }
}

/**
 * Hook to invalidate chat room queries
 * Useful for manual refresh or after external updates
 */
export function useInvalidateChatRooms() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms() })
    },
    invalidateRoom: (roomId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(roomId) })
    },
    invalidateList: (params?: ListChatRoomsParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsList(params) })
    },
  }
}