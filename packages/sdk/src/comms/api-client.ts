/**
 * Comms Module API Client
 * Handles REST API calls for chat rooms and video calls
 */

import { apiGet, apiPost, apiPatch } from '../api'
import type { components, operations } from '@monobase/api-spec/types'

// ============================================================================
// API Type Aliases from TypeSpec
// ============================================================================

type ApiChatRoom = components["schemas"]["ChatRoom"]
type ApiChatMessage = components["schemas"]["ChatMessage"]
type ApiVideoCallJoinResponse = components["schemas"]["VideoCallJoinResponse"]
type ApiVideoCallEndResponse = components["schemas"]["VideoCallEndResponse"]
type ApiLeaveVideoCallResponse = components["schemas"]["LeaveVideoCallResponse"]
type ApiCallParticipant = components["schemas"]["CallParticipant"]
type ApiIceServersResponse = components["schemas"]["IceServersResponse"]
type ApiCreateChatRoomRequest = components["schemas"]["CreateChatRoomRequest"]
type ApiSendTextMessageRequest = components["schemas"]["SendTextMessageRequest"]
type ApiStartVideoCallRequest = components["schemas"]["StartVideoCallRequest"]
type ApiJoinVideoCallRequest = components["schemas"]["JoinVideoCallRequest"]
type ApiUpdateParticipantRequest = components["schemas"]["UpdateParticipantRequest"]

// Pagination response types extracted from operations
type ApiPaginatedChatRoom = operations["listChatRooms"]["responses"]["200"]["content"]["application/json"]
type ApiPaginatedChatMessage = operations["getChatMessages"]["responses"]["200"]["content"]["application/json"]

// ============================================================================
// Chat Room APIs
// ============================================================================

/**
 * Create new chat room or return existing if upsert is true
 */
export async function createChatRoom(
  request: ApiCreateChatRoomRequest
): Promise<ApiChatRoom> {
  return apiPost<ApiChatRoom>('/comms/chat-rooms', request)
}

/**
 * List chat rooms where the current authenticated user is a participant
 */
export async function listChatRooms(params?: {
  status?: 'active' | 'archived'
  context?: string
  withParticipant?: string
  hasActiveCall?: boolean
  limit?: number
  offset?: number
}): Promise<ApiPaginatedChatRoom> {
  return apiGet<ApiPaginatedChatRoom>('/comms/chat-rooms', params)
}

/**
 * Get specific chat room
 */
export async function getChatRoom(roomId: string): Promise<ApiChatRoom> {
  return apiGet<ApiChatRoom>(`/comms/chat-rooms/${roomId}`)
}

/**
 * Get chat room messages
 */
export async function getChatMessages(
  roomId: string,
  params?: {
    messageType?: 'text' | 'system' | 'video_call'
    limit?: number
    offset?: number
  }
): Promise<ApiPaginatedChatMessage> {
  return apiGet<ApiPaginatedChatMessage>(`/comms/chat-rooms/${roomId}/messages`, params)
}

/**
 * Send text message to chat room
 */
export async function sendTextMessage(
  roomId: string,
  message: string
): Promise<ApiChatMessage> {
  const request: ApiSendTextMessageRequest = {
    messageType: 'text',
    message
  }
  return apiPost<ApiChatMessage>(`/comms/chat-rooms/${roomId}/messages`, request)
}

/**
 * Start video call in chat room
 */
export async function startVideoCall(
  roomId: string,
  participants: ApiCallParticipant[]
): Promise<ApiChatMessage> {
  const request: ApiStartVideoCallRequest = {
    messageType: 'video_call',
    videoCallData: {
      status: 'starting',
      participants
    }
  }
  return apiPost<ApiChatMessage>(`/comms/chat-rooms/${roomId}/messages`, request)
}

// ============================================================================
// Video Call APIs
// ============================================================================

/**
 * Join active video call in chat room
 */
export async function joinVideoCall(
  roomId: string,
  request: ApiJoinVideoCallRequest
): Promise<ApiVideoCallJoinResponse> {
  return apiPost<ApiVideoCallJoinResponse>(
    `/comms/chat-rooms/${roomId}/video-call/join`,
    request
  )
}

/**
 * End active video call
 */
export async function endVideoCall(
  roomId: string
): Promise<ApiVideoCallEndResponse> {
  return apiPost<ApiVideoCallEndResponse>(
    `/comms/chat-rooms/${roomId}/video-call/end`,
    {}
  )
}

/**
 * Leave active video call
 */
export async function leaveVideoCall(
  roomId: string
): Promise<ApiLeaveVideoCallResponse> {
  return apiPost<ApiLeaveVideoCallResponse>(
    `/comms/chat-rooms/${roomId}/video-call/leave`,
    {}
  )
}

/**
 * Update participant status in video call
 */
export async function updateVideoCallParticipant(
  roomId: string,
  update: ApiUpdateParticipantRequest
): Promise<ApiCallParticipant> {
  return apiPatch<ApiCallParticipant>(
    `/comms/chat-rooms/${roomId}/video-call/participant`,
    update
  )
}

/**
 * Get TURN/STUN server configuration for WebRTC peer connections
 */
export async function getIceServers(): Promise<ApiIceServersResponse> {
  return apiGet<ApiIceServersResponse>('/comms/ice-servers')
}