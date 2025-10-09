/**
 * E2E Test Helpers for Comms Module
 * Provides helper functions for testing chat rooms and video calls
 */

import type { ApiClient } from './client';
import type { 
  ChatRoom, 
  ChatMessage,
  SendTextMessageRequest,
  StartVideoCallRequest,
  JoinVideoCallRequest,
  UpdateParticipantRequest,
  VideoCallJoinResponse,
  VideoCallEndResponse,
  LeaveVideoCallResponse
} from '../../../src/handlers/comms/repos/comms.schema';

// ============================================================================
// CHAT ROOM HELPERS
// ============================================================================

/**
 * List user's chat rooms
 */
export async function listChatRooms(
  client: ApiClient,
  options?: {
    status?: 'active' | 'archived';
    context?: string;
    withParticipant?: string;
    hasActiveCall?: boolean;
    page?: number;
    pageSize?: number;
  }
) {
  const searchParams: Record<string, any> = {};

  if (options?.status) searchParams.status = options.status;
  if (options?.context) searchParams.context = options.context;
  if (options?.withParticipant) searchParams.withParticipant = options.withParticipant;
  if (options?.hasActiveCall !== undefined) searchParams.hasActiveCall = options.hasActiveCall;
  if (options?.page) searchParams.page = options.page;
  if (options?.pageSize) searchParams.pageSize = options.pageSize;
  
  const response = await client.fetch('/comms/chat-rooms', {
    method: 'GET',
    searchParams
  });
  const data = await response.json();
  
  return { response, data };
}

/**
 * Get specific chat room
 */
export async function getChatRoom(client: ApiClient, roomId: string) {
  const response = await client.fetch(`/comms/chat-rooms/${roomId}`, {
    method: 'GET'
  });
  const data = response.ok ? await response.json() : null;
  
  return { response, data: data as ChatRoom | null };
}

/**
 * Get chat room messages
 */
export async function getChatMessages(
  client: ApiClient, 
  roomId: string,
  options?: {
    messageType?: 'text' | 'system' | 'video_call';
    page?: number;
    pageSize?: number;
  }
) {
  const searchParams: Record<string, any> = {};
  if (options?.messageType) searchParams.messageType = options.messageType;
  if (options?.page) searchParams.page = options.page;
  if (options?.pageSize) searchParams.pageSize = options.pageSize;
  
  const response = await client.fetch(`/comms/chat-rooms/${roomId}/messages`, {
    method: 'GET',
    searchParams
  });
  const data = await response.json();
  
  return { response, data };
}

/**
 * Create chat room with array-based participants and admins
 */
export async function createChatRoom(
  client: ApiClient,
  participants: string[],
  admins?: string[],
  options?: {
    context?: string;
    upsert?: boolean;
  }
) {
  const requestBody: any = {
    participants,
    admins: admins || participants, // Default admins to all participants
    upsert: options?.upsert ?? false
  };

  // Only include optional fields if they have values
  if (options?.context) {
    requestBody.context = options.context;
  }

  const response = await client.fetch('/comms/chat-rooms', {
    method: 'POST',
    body: requestBody
  });
  const data = response.ok ? await response.json() : await response.json().catch(() => null);

  return { response, data: data as ChatRoom | null };
}

/**
 * Legacy helper for backwards compatibility - creates room with two participants
 */
export async function createChatRoomLegacy(
  client: ApiClient,
  participant1: string,
  participant2: string,
  admin: string,
  options?: {
    context?: string;
  }
) {
  return createChatRoom(
    client,
    [participant1, participant2],
    [admin],
    {
      context: options?.context,
      upsert: false
    }
  );
}

/**
 * Get or create appointment chat room using the general createChatRoom endpoint
 * This replaces the old appointment-specific endpoint
 * Uses upsert behavior: creates new room or returns existing room if one exists between the participants
 */
export async function getOrCreateAppointmentChatRoom(
  client: ApiClient,
  appointmentId: string,
  patientId: string,
  providerId: string
) {
  // The admin should be the provider ID (the database expects provider ID, not user ID)
  return createChatRoom(
    client,
    [patientId, providerId],
    [providerId], // Provider is the admin
    {
      context: appointmentId,
      upsert: true
    }
  );
}

// ============================================================================
// MESSAGE HELPERS
// ============================================================================

/**
 * Send text message
 */
export async function sendTextMessage(
  client: ApiClient,
  roomId: string,
  message: string
) {
  const requestBody: SendTextMessageRequest = {
    messageType: 'text',
    message
  };
  
  const response = await client.fetch(`/comms/chat-rooms/${roomId}/messages`, {
    method: 'POST',
    body: requestBody
  });
  const data = response.ok ? await response.json() : null;
  
  return { response, data: data as ChatMessage | null };
}

/**
 * Start video call
 */
export async function startVideoCall(
  client: ApiClient,
  roomId: string,
  participants: Array<{
    user: string;
    displayName: string;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
  }>
) {
  const requestBody: StartVideoCallRequest = {
    messageType: 'video_call',
    videoCallData: {
      status: 'starting',
      participants: participants.map(p => ({
        user: p.user,
        displayName: p.displayName,
        audioEnabled: p.audioEnabled ?? true,
        videoEnabled: p.videoEnabled ?? true
      }))
    }
  };

  const response = await client.fetch(`/comms/chat-rooms/${roomId}/messages`, {
    method: 'POST',
    body: requestBody
  });
  const data = response.ok ? await response.json() : null;

  // Log error details for debugging startVideoCall
  if (!response.ok) {
    const errorData = await response.text().catch(() => null);
    console.log(`startVideoCall failed with ${response.status}:`, errorData);
  }

  return { response, data: data as ChatMessage | null };
}

// ============================================================================
// VIDEO CALL ACTION HELPERS
// ============================================================================

/**
 * Join video call
 */
export async function joinVideoCall(
  client: ApiClient,
  roomId: string,
  displayName: string,
  options?: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
  }
) {
  const requestBody: JoinVideoCallRequest = {
    displayName,
    audioEnabled: options?.audioEnabled ?? true,
    videoEnabled: options?.videoEnabled ?? true
  };
  
  const response = await client.fetch(`/comms/chat-rooms/${roomId}/video-call/join`, {
    method: 'POST',
    body: requestBody
  });
  const data = response.ok ? await response.json() : null;

  // Log error details for debugging joinVideoCall
  if (!response.ok) {
    const errorData = await response.text().catch(() => null);
    console.log(`joinVideoCall failed with ${response.status}:`, errorData);
  }

  return { response, data: data as VideoCallJoinResponse | null };
}

/**
 * End video call
 */
export async function endVideoCall(client: ApiClient, roomId: string) {
  const response = await client.fetch(`/comms/chat-rooms/${roomId}/video-call/end`, {
    method: 'POST',
    body: {}
  });
  const data = response.ok ? await response.json() : null;
  
  return { response, data: data as VideoCallEndResponse | null };
}

/**
 * Leave video call
 */
export async function leaveVideoCall(client: ApiClient, roomId: string) {
  const response = await client.fetch(`/comms/chat-rooms/${roomId}/video-call/leave`, {
    method: 'POST',
    body: {}
  });
  const data = response.ok ? await response.json() : null;
  
  return { response, data: data as LeaveVideoCallResponse | null };
}

/**
 * Update video call participant status
 */
export async function updateVideoCallParticipant(
  client: ApiClient,
  roomId: string,
  updates: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
  }
) {
  const requestBody: UpdateParticipantRequest = updates;
  
  const response = await client.fetch(`/comms/chat-rooms/${roomId}/video-call/participant`, {
    method: 'PATCH',
    body: requestBody
  });
  const data = response.ok ? await response.json() : null;
  
  return { response, data };
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Generate test text message content
 */
export function generateTestMessageContent(): string {
  const messages = [
    'Hello, how are you doing today?',
    'I have some questions about my appointment.',
    'Thank you for your help!',
    'Can we discuss the treatment plan?',
    'I\'m feeling much better now.',
    'What time should I take the medication?',
    'I need to reschedule our next meeting.',
    'The test results look good.',
    'I have some concerns about the side effects.',
    'When should I schedule a follow-up?'
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Generate test video call participants
 * @param patientUserId - The user ID (authentication ID) of the patient
 * @param providerUserId - The user ID (authentication ID) of the provider
 * @param patientName - Display name for patient
 * @param providerName - Display name for provider
 */
export function generateVideoCallParticipants(
  patientUserId: string,
  providerUserId: string,
  patientName: string = 'Test Patient',
  providerName: string = 'Dr. Test Provider'
): Array<{
  user: string;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}> {
  return [
    {
      user: patientUserId,
      displayName: patientName,
      audioEnabled: true,
      videoEnabled: true
    },
    {
      user: providerUserId,
      displayName: providerName,
      audioEnabled: true,
      videoEnabled: false // Provider starts with video off
    }
  ];
}

// ============================================================================
// CLEANUP HELPERS
// ============================================================================

/**
 * Clean up any active video call in a chat room
 * Used for test cleanup to prevent 409 conflicts
 */
export async function cleanupActiveVideoCall(
  client: ApiClient,
  roomId: string
): Promise<void> {
  try {
    // Try to end any active video call - this will return 404 if no active call
    await endVideoCall(client, roomId);
  } catch (error) {
    // Ignore errors - likely means no active call to clean up
  }
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validate chat room response structure (new array-based format)
 */
export function validateChatRoomResponse(room: any): boolean {
  return !!(
    room &&
    typeof room.id === 'string' &&
    Array.isArray(room.participants) &&
    room.participants.length > 0 &&
    Array.isArray(room.admins) &&
    room.admins.length > 0 &&
    typeof room.status === 'string' &&
    typeof room.messageCount === 'number' &&
    room.createdAt &&
    room.updatedAt
  );
}

/**
 * Validate chat room response structure (legacy format for backwards compatibility)
 */
export function validateChatRoomResponseLegacy(room: any): boolean {
  return !!(
    room &&
    typeof room.id === 'string' &&
    typeof room.participant1 === 'string' &&
    typeof room.participant2 === 'string' &&
    typeof room.admin === 'string' &&
    typeof room.status === 'string' &&
    typeof room.messageCount === 'number' &&
    room.createdAt &&
    room.updatedAt
  );
}

/**
 * Validate chat message response structure
 */
export function validateChatMessageResponse(message: any): boolean {
  return !!(
    message &&
    typeof message.id === 'string' &&
    typeof message.chatRoom === 'string' &&
    typeof message.sender === 'string' &&
    typeof message.messageType === 'string' &&
    message.timestamp &&
    message.createdAt &&
    message.updatedAt
  );
}

/**
 * Validate video call join response structure
 */
export function validateVideoCallJoinResponse(response: any): boolean {
  return !!(
    response &&
    typeof response.roomUrl === 'string' &&
    typeof response.token === 'string' &&
    typeof response.callStatus === 'string' &&
    Array.isArray(response.participants)
  );
}

/**
 * Validate video call end response structure
 */
export function validateVideoCallEndResponse(response: any): boolean {
  return !!(
    response &&
    typeof response.message === 'string' &&
    (response.callDuration === undefined || typeof response.callDuration === 'number')
  );
}

/**
 * Validate leave video call response structure
 */
export function validateLeaveVideoCallResponse(response: any): boolean {
  return !!(
    response &&
    typeof response.message === 'string' &&
    typeof response.callStillActive === 'boolean' &&
    typeof response.remainingParticipants === 'number'
  );
}

// ============================================================================
// ICE SERVERS HELPERS
// ============================================================================

/**
 * Get ICE servers configuration for WebRTC
 */
export async function getIceServers(client: ApiClient) {
  const response = await client.fetch('/comms/ice-servers', {
    method: 'GET'
  });
  const data = response.ok ? await response.json() : null;

  return { response, data };
}

/**
 * Validate ICE servers response structure
 */
export function validateIceServersResponse(response: any): boolean {
  if (!response || !Array.isArray(response.iceServers)) {
    return false;
  }

  // Validate each ICE server entry
  return response.iceServers.every((server: any) => {
    // urls is required and can be string or string[]
    const hasValidUrls = typeof server.urls === 'string' ||
      (Array.isArray(server.urls) && server.urls.every((url: any) => typeof url === 'string'));

    // username and credential are optional strings
    const hasValidUsername = server.username === undefined || typeof server.username === 'string';
    const hasValidCredential = server.credential === undefined || typeof server.credential === 'string';

    return hasValidUrls && hasValidUsername && hasValidCredential;
  });
}