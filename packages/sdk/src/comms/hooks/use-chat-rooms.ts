/**
 * React Hook for Chat Rooms List Management
 * Provides stateful management of multiple chat rooms
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listChatRooms, createChatRoom } from '../api-client'
import type { components } from '@monobase/api-spec/types'

type ApiChatRoom = components["schemas"]["ChatRoom"]
type ApiCreateChatRoomRequest = components["schemas"]["CreateChatRoomRequest"]

interface UseChatRoomsOptions {
  status?: 'active' | 'archived'
  context?: string
  withParticipant?: string
  hasActiveCall?: boolean
  limit?: number
  offset?: number
  enabled?: boolean
}

interface UseChatRoomsReturn {
  rooms: ApiChatRoom[]
  loading: boolean
  error: Error | null
  total: number
  
  createRoom: (request: ApiCreateChatRoomRequest) => Promise<ApiChatRoom>
  refetch: () => void
}

export function useChatRooms({
  status,
  context,
  withParticipant,
  hasActiveCall,
  limit = 20,
  offset = 0,
  enabled = true
}: UseChatRoomsOptions = {}): UseChatRoomsReturn {
  const queryClient = useQueryClient()

  // Fetch chat rooms list
  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['chatRooms', { status, context, withParticipant, hasActiveCall, limit, offset }],
    queryFn: () => listChatRooms({
      status,
      context,
      withParticipant,
      hasActiveCall,
      limit,
      offset
    }),
    enabled
  })

  // Create new chat room mutation
  const createRoomMutation = useMutation({
    mutationFn: (request: ApiCreateChatRoomRequest) => createChatRoom(request),
    onSuccess: (newRoom) => {
      // Invalidate the rooms list to include the new room
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
      // Pre-populate the cache for the new room
      queryClient.setQueryData(['chatRoom', newRoom.id], newRoom)
    }
  })

  return {
    rooms: data?.data || [],
    loading,
    error: error as Error | null,
    total: data?.pagination?.totalCount || 0,
    
    createRoom: createRoomMutation.mutateAsync,
    refetch: () => void refetch()
  }
}