/**
 * React Hook for Chat Room Management
 * Provides stateful management of chat rooms and messages
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getChatRoom,
  getChatMessages,
  sendTextMessage,
  startVideoCall,
  joinVideoCall,
  endVideoCall,
  leaveVideoCall
} from '../api-client'
import type { components } from '@monobase/api-spec/types'

type ApiChatRoom = components["schemas"]["ChatRoom"]
type ApiChatMessage = components["schemas"]["ChatMessage"]
type ApiCallParticipant = components["schemas"]["CallParticipant"]
type ApiJoinVideoCallRequest = components["schemas"]["JoinVideoCallRequest"]

interface UseChatRoomOptions {
  roomId: string
  enabled?: boolean
}

interface UseChatRoomReturn {
  // Room data
  room: ApiChatRoom | undefined
  roomLoading: boolean
  roomError: Error | null
  
  // Messages
  messages: ApiChatMessage[]
  messagesLoading: boolean
  messagesError: Error | null
  hasMoreMessages: boolean
  loadMoreMessages: () => void
  
  // Actions
  sendMessage: (text: string) => Promise<void>
  startCall: (participants: ApiCallParticipant[]) => Promise<void>
  joinCall: (request: ApiJoinVideoCallRequest) => Promise<void>
  endCall: () => Promise<void>
  leaveCall: () => Promise<void>
  
  // Utilities
  refetchRoom: () => void
  refetchMessages: () => void
}

const MESSAGES_PAGE_SIZE = 50

export function useChatRoom({
  roomId,
  enabled = true
}: UseChatRoomOptions): UseChatRoomReturn {
  const queryClient = useQueryClient()
  const [messageOffset, setMessageOffset] = useState(0)
  const [allMessages, setAllMessages] = useState<ApiChatMessage[]>([])

  // Fetch chat room details
  const {
    data: room,
    isLoading: roomLoading,
    error: roomError,
    refetch: refetchRoom
  } = useQuery({
    queryKey: ['chatRoom', roomId],
    queryFn: () => getChatRoom(roomId),
    enabled: enabled && !!roomId
  })

  // Fetch messages with pagination
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['chatMessages', roomId, messageOffset],
    queryFn: () => getChatMessages(roomId, {
      limit: MESSAGES_PAGE_SIZE,
      offset: messageOffset
    }),
    enabled: enabled && !!roomId
  })

  // Update allMessages when new data arrives
  useEffect(() => {
    if (messagesData?.data) {
      if (messageOffset === 0) {
        setAllMessages(messagesData.data)
      } else {
        setAllMessages(prev => [...prev, ...messagesData.data])
      }
    }
  }, [messagesData, messageOffset])

  // Send text message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => sendTextMessage(roomId, text),
    onSuccess: (newMessage) => {
      // Optimistically add the new message to the list
      setAllMessages(prev => [newMessage, ...prev])
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] })
      queryClient.invalidateQueries({ queryKey: ['chatRoom', roomId] })
    }
  })

  // Start video call mutation
  const startCallMutation = useMutation({
    mutationFn: (participants: ApiCallParticipant[]) => 
      startVideoCall(roomId, participants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] })
      queryClient.invalidateQueries({ queryKey: ['chatRoom', roomId] })
    }
  })

  // Join video call mutation
  const joinCallMutation = useMutation({
    mutationFn: (request: ApiJoinVideoCallRequest) => 
      joinVideoCall(roomId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRoom', roomId] })
    }
  })

  // End video call mutation
  const endCallMutation = useMutation({
    mutationFn: () => endVideoCall(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] })
      queryClient.invalidateQueries({ queryKey: ['chatRoom', roomId] })
    }
  })

  // Leave video call mutation
  const leaveCallMutation = useMutation({
    mutationFn: () => leaveVideoCall(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRoom', roomId] })
    }
  })

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    setMessageOffset(prev => prev + MESSAGES_PAGE_SIZE)
  }, [])

  const hasMoreMessages = messagesData?.pagination?.totalCount 
    ? allMessages.length < messagesData.pagination.totalCount 
    : false

  return {
    // Room data
    room,
    roomLoading,
    roomError: roomError as Error | null,
    
    // Messages
    messages: allMessages,
    messagesLoading,
    messagesError: messagesError as Error | null,
    hasMoreMessages,
    loadMoreMessages,
    
    // Actions
    sendMessage: async (text: string) => {
      await sendMessageMutation.mutateAsync(text)
    },
    startCall: async (participants: ApiCallParticipant[]) => {
      await startCallMutation.mutateAsync(participants)
    },
    joinCall: async (request: ApiJoinVideoCallRequest) => {
      await joinCallMutation.mutateAsync(request)
    },
    endCall: async () => {
      await endCallMutation.mutateAsync()
    },
    leaveCall: async () => {
      await leaveCallMutation.mutateAsync()
    },
    
    // Utilities
    refetchRoom: () => void refetchRoom(),
    refetchMessages: () => void refetchMessages()
  }
}