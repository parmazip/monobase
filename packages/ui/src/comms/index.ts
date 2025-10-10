/**
 * Comms Module UI Exports
 * Browser/presentation layer for communication functionality
 */

// Media device utilities
export {
  getLocalMediaStream,
  toggleAudio,
  toggleVideo,
  stopMediaStream,
  checkMediaPermissions,
  getDisplayMediaStream,
  stopDisplayStream
} from './media-devices'
export type { MediaDeviceOptions } from './media-devices'

// Hooks
export { useMediaStream, useVideoCall } from './hooks'

// Components
export { 
  VideoTile, 
  CallControls, 
  ConnectionStatus, 
  VideoCallUI 
} from './components'