/**
 * Comms Module SDK Exports
 * Network/API layer for communication functionality
 */

// WebRTC classes
export { VideoPeerConnection } from './peer-connection'
export { SignalingClient } from './signaling-client'
export type { SignalMessage, ChatMessage } from './signaling-client'

// API client functions
export {
  createChatRoom,
  listChatRooms,
  getChatRoom,
  getChatMessages,
  sendTextMessage,
  startVideoCall,
  joinVideoCall,
  endVideoCall,
  leaveVideoCall,
  updateVideoCallParticipant,
  getIceServers
} from './api-client'

// React hooks
export { useChatRoom } from './hooks/use-chat-room'
export { useChatRooms } from './hooks/use-chat-rooms'