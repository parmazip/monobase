# `@monobase/sdk`

Type-safe frontend SDK for the Monobase Application Platform. Provides API client utilities, service functions, and React hooks for seamless integration with the Monobase API.

## Architecture

The SDK is organized into two main layers:

1. **Core Layer** - Vanilla TypeScript API client and service functions
2. **React Layer** - TanStack Query hooks and Better-Auth integration

```
packages/sdk/src/
├── api.ts              # Core API client (fetch wrapper)
├── auth.ts             # Better-Auth client factory
├── types.ts            # Common SDK types
├── services/           # API service functions
│   ├── person.ts       # Person profile operations
│   ├── notifications.ts # Notification operations
│   ├── storage.ts      # File upload/download
│   └── comms.ts        # Chat rooms, messages, video calls
├── lib/                # Core libraries
│   ├── signaling-client.ts  # WebSocket signaling for WebRTC
│   └── peer-connection.ts   # RTCPeerConnection wrapper
├── react/              # React-specific code
│   ├── provider.tsx    # ApiProvider setup
│   ├── auth-client.ts  # Auth singleton
│   ├── query-keys.ts   # TanStack Query key factory
│   └── hooks/          # React hooks
│       ├── use-auth.ts          # Better-Auth hooks
│       ├── use-person.ts        # Person hooks
│       ├── use-notifications.ts # Notification hooks
│       ├── use-storage.ts       # File upload hook
│       ├── use-chat-rooms.ts    # Chat room management
│       └── use-chat-messages.ts # Message operations
└── utils/
    ├── api.ts          # API utilities (pagination, sanitization)
    └── format.ts       # Date formatting utilities
```

## Installation

Add to your app's `package.json`:

```json
{
  "dependencies": {
    "@monobase/sdk": "workspace:*"
  }
}
```

## Setup

### React Applications

Wrap your app with `ApiProvider`:

```tsx
import { ApiProvider } from "@monobase/sdk/react/provider"

function App() {
  return (
    <ApiProvider apiBaseUrl="http://localhost:7213">
      <YourApp />
    </ApiProvider>
  )
}
```

The `ApiProvider` automatically:
- Configures the API base URL
- Sets up TanStack Query with optimized defaults
- Initializes Better-Auth client
- Provides auth state to all hooks

### Custom QueryClient (Optional)

```tsx
import { QueryClient } from "@tanstack/react-query"
import { ApiProvider } from "@monobase/sdk/react/provider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // Custom: 10 minutes
    },
  },
})

function App() {
  return (
    <ApiProvider 
      apiBaseUrl="http://localhost:7213"
      queryClient={queryClient}
    >
      <YourApp />
    </ApiProvider>
  )
}
```

## Available Exports

### Core API Client

```typescript
import { apiGet, apiPost, apiPatch, apiDelete } from "@monobase/sdk/api"
import { ApiError } from "@monobase/sdk/api"

// Make authenticated requests
const data = await apiGet('/endpoint', { param: 'value' })
await apiPost('/endpoint', { body: 'data' })
await apiPatch('/endpoint', { body: 'data' })
await apiDelete('/endpoint')

// Handle errors
try {
  await apiGet('/endpoint')
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status, error.message)
  }
}
```

### Services

#### Person Service

```typescript
import {
  getMyProfile,
  createMyPerson,
  updateMyPersonalInfo,
  updateMyContactInfo,
  updateMyAddress,
  updateMyPreferences,
  type Person,
} from "@monobase/sdk/services/person"

const profile = await getMyProfile()
const newProfile = await createMyPerson({ firstName: "John" })
```

#### Notifications Service

```typescript
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@monobase/sdk/services/notifications"

const notifications = await listNotifications({ status: 'unread' })
await markNotificationAsRead(notificationId)
```

#### Storage Service

```typescript
import {
  requestFileUpload,
  uploadToPresignedUrl,
  completeFileUpload,
  getFileDownload,
} from "@monobase/sdk/services/storage"

// 4-step upload process
const upload = await requestFileUpload({ filename, size, mimeType })
await uploadToPresignedUrl(upload.uploadUrl, file)
await completeFileUpload(upload.file)
const download = await getFileDownload(upload.file)
```

### React Hooks

#### Authentication Hooks

```typescript
import {
  useSession,
  useUpdateUser,
  useListAccounts,
  useEmailVerification,
} from "@monobase/sdk/react/hooks/use-auth"

function MyComponent() {
  const { data: session } = useSession()
  const updateUser = useUpdateUser()
  const sendVerification = useEmailVerification()

  return <div>Welcome {session?.user?.name}</div>
}
```

#### Person Hooks

```typescript
import {
  useMyPerson,
  useCreateMyPerson,
  useUpdateMyPersonalInfo,
  useUpdateMyContactInfo,
  useUpdateMyAddress,
  useUpdateMyPreferences,
} from "@monobase/sdk/react/hooks/use-person"

function ProfilePage() {
  const { data: person, isLoading } = useMyPerson()
  const updateInfo = useUpdateMyPersonalInfo()

  const handleSubmit = (data) => {
    updateInfo.mutate(data)
  }

  if (isLoading) return <div>Loading...</div>
  if (!person) return <div>No profile found</div>

  return <div>{person.firstName}</div>
}
```

#### Notification Hooks

```typescript
import {
  useNotifications,
  useUnreadNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@monobase/sdk/react/hooks/use-notifications"

function NotificationBell() {
  const { data: unread } = useUnreadNotifications()
  const markAsRead = useMarkNotificationAsRead()

  return (
    <div>
      {unread?.data.length} unread
      <button onClick={() => markAsRead.mutate(notificationId)}>
        Mark as read
      </button>
    </div>
  )
}
```

#### Storage Hook

```typescript
import { useFileUpload } from "@monobase/sdk/react/hooks/use-storage"

function FileUploader() {
  const { upload, isUploading, progress } = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, // 50MB
  })

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file)
      console.log('Uploaded:', result.downloadUrl)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files?.[0])} />
      {isUploading && <div>Progress: {progress}%</div>}
    </div>
  )
}
```

#### Comms Hooks

```typescript
import {
  useChatRooms,
  useChatRoom,
  useCreateChatRoom,
  useChatMessages,
  useSendMessage,
  useStartVideoCall,
} from "@monobase/sdk/react/hooks/use-comms"

// List chat rooms
function ChatRoomsList() {
  const { data: rooms, isLoading } = useChatRooms({
    status: 'active',
    limit: 20,
  })
  const createRoom = useCreateChatRoom()

  const handleCreate = () => {
    createRoom.mutate({
      name: 'New Chat Room',
      participants: [{ personId: '123', role: 'member' }],
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={handleCreate}>Create Room</button>
      {rooms?.items.map(room => (
        <div key={room.id}>{room.name}</div>
      ))}
    </div>
  )
}

// Chat messages
function ChatMessagesView({ roomId }: { roomId: string }) {
  const { data: messages } = useChatMessages(roomId)
  const sendMessage = useSendMessage()

  const handleSend = (text: string) => {
    sendMessage.mutate({ roomId, message: text })
  }

  return (
    <div>
      {messages?.items.map(msg => (
        <div key={msg.id}>{msg.message}</div>
      ))}
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') handleSend(e.currentTarget.value)
      }} />
    </div>
  )
}
```

### Comms Module

The SDK provides comprehensive chat and video call functionality through REST APIs, WebSocket signaling, and WebRTC peer connections.

#### REST API Client

```typescript
import {
  listChatRooms,
  getChatRoom,
  createChatRoom,
  updateChatRoom,
  archiveChatRoom,
  getChatMessages,
  sendTextMessage,
  updateMessage,
  deleteMessage,
  getIceServers,
  startVideoCall,
  joinVideoCall,
  endVideoCall,
  leaveVideoCall,
  updateVideoCallParticipant,
} from "@monobase/sdk/services/comms"

// Chat rooms
const rooms = await listChatRooms({ status: 'active', limit: 20 })
const room = await getChatRoom(roomId)
const newRoom = await createChatRoom({
  name: 'Project Discussion',
  participants: [{ personId: '123', role: 'member' }],
})

// Messages
const messages = await getChatMessages(roomId, { limit: 50, offset: 0 })
const message = await sendTextMessage(roomId, 'Hello!')
await updateMessage(roomId, messageId, { text: 'Updated text' })
await deleteMessage(roomId, messageId)

// Video calls
const iceServers = await getIceServers()
const call = await startVideoCall(roomId, [
  { personId: '123', role: 'host' },
  { personId: '456', role: 'participant' },
])
const session = await joinVideoCall(roomId, { deviceCapabilities: { audio: true, video: true } })
await updateVideoCallParticipant(roomId, { audioEnabled: false })
await leaveVideoCall(roomId)
await endVideoCall(roomId) // Host only
```

#### WebSocket Signaling Client

```typescript
import { SignalingClient } from "@monobase/sdk/lib/signaling-client"

const signalingClient = new SignalingClient(
  'http://localhost:7213',
  roomId,
  authToken
)

// Listen for WebRTC signaling events
signalingClient.on('offer', (data) => {
  console.log('Received offer:', data)
})

signalingClient.on('answer', (data) => {
  console.log('Received answer:', data)
})

signalingClient.on('ice-candidate', (data) => {
  console.log('Received ICE candidate:', data)
})

signalingClient.on('error', (error) => {
  console.error('Signaling error:', error)
})

// Connect and send signals
signalingClient.connect()
signalingClient.send('offer', sessionDescription)
signalingClient.send('answer', sessionDescription)
signalingClient.send('ice-candidate', iceCandidate)
signalingClient.disconnect()
```

#### WebRTC Peer Connection

```typescript
import { VideoPeerConnection } from "@monobase/sdk/lib/peer-connection"

const peerConnection = new VideoPeerConnection(
  signalingClient,
  iceServers,
  localStream
)

// Handle remote stream
peerConnection.onRemoteStream((stream) => {
  remoteVideoElement.srcObject = stream
})

// Handle connection state changes
peerConnection.onConnectionStateChange((state) => {
  console.log('Connection state:', state)
})

// Initialize connection (as host)
await peerConnection.createOffer()

// Initialize connection (as participant)
await peerConnection.createAnswer()

// Replace video track (e.g., for screen sharing)
const screenStream = await navigator.mediaDevices.getDisplayMedia()
const screenTrack = screenStream.getVideoTracks()[0]
await peerConnection.replaceVideoTrack(screenTrack)

// Cleanup
peerConnection.close()
```

#### React Hooks

```typescript
import {
  // Chat rooms
  useChatRooms,
  useChatRoom,
  useCreateChatRoom,
  useUpsertChatRoom,
  usePrefetchChatRoom,
  useInvalidateChatRooms,
  // Chat messages
  useChatMessages,
  useInfiniteChatMessages,
  useSendMessage,
  useStartVideoCall,
  useSendChatMessage,
  usePrefetchChatMessages,
  useInvalidateChatMessages,
  useOptimisticSendMessage,
} from "@monobase/sdk/react/hooks/use-comms"

// List chat rooms
function ChatRoomsList() {
  const { data, isLoading } = useChatRooms({
    status: 'active',
    limit: 20,
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.items.map(room => (
        <div key={room.id}>{room.name}</div>
      ))}
    </div>
  )
}

// Single chat room with messages
function ChatRoom({ roomId }: { roomId: string }) {
  const { data: room } = useChatRoom(roomId)
  const { data: messages } = useChatMessages(roomId)
  const sendMessage = useSendMessage()

  return (
    <div>
      <h1>{room?.name}</h1>
      {messages?.items.map(msg => (
        <div key={msg.id}>{msg.message}</div>
      ))}
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') {
          sendMessage.mutate({ 
            roomId,
            message: e.currentTarget.value 
          })
        }
      }} />
    </div>
  )
}

// Video call management
function VideoCallManager({ roomId }: { roomId: string }) {
  const startCall = useStartVideoCall()

  const handleStartCall = () => {
    startCall.mutate({
      roomId,
      participants: [
        { 
          user: '123', 
          displayName: 'John Doe',
          audioEnabled: true,
          videoEnabled: true
        },
      ],
    })
  }

  return (
    <div>
      <button onClick={handleStartCall}>Start Call</button>
    </div>
  )
}
```

**Note**: The SDK provides the **network layer** for comms. For UI components and browser media APIs, see `@monobase/ui/comms`.

### Utilities

```typescript
import { PaginatedResponse, sanitizeObject } from "@monobase/sdk/utils/api"
import { formatDate } from "@monobase/sdk/utils/format"

// Handle paginated responses
const response: PaginatedResponse<Notification> = await listNotifications()
console.log(response.data, response.pagination)

// Sanitize form data for API submission
const clean = sanitizeObject(formData, {
  nullable: ['lastName', 'middleName', 'primaryAddress']
})

// Format dates
const dateStr = formatDate(new Date(), { format: 'date' })
```

## Type Safety

All service functions use OpenAPI-generated types from `@monobase/api-spec`:

```typescript
import type { components } from "@monobase/api-spec/types"

type ApiPerson = components["schemas"]["Person"]
```

The SDK provides **frontend-friendly types** that:
- Use `Date` objects instead of ISO strings
- Provide cleaner interfaces for React components
- Handle type mapping between API and frontend

See [CONTRIBUTING.md](./CONTRIBUTING.md) for type mapping patterns.

## Common Patterns

### Form Integration

```tsx
import { PersonalInfoForm } from "@monobase/ui/person/components/personal-info-form"
import { useUpdateMyPersonalInfo } from "@monobase/sdk/react/hooks/use-person"

function EditProfile() {
  const updateInfo = useUpdateMyPersonalInfo()

  return (
    <PersonalInfoForm
      onSubmit={(data) => updateInfo.mutate(data)}
      isSubmitting={updateInfo.isPending}
    />
  )
}
```

### Optimistic Updates

Notification hooks use optimistic updates for better UX:

```typescript
// Mark as read immediately, rollback on error
const markAsRead = useMarkNotificationAsRead()
markAsRead.mutate(notificationId) // UI updates instantly
```

### Error Handling

All mutation hooks include built-in toast notifications:

```typescript
const updateInfo = useUpdateMyPersonalInfo()

// Success: Shows "Personal information updated successfully!"
// Error: Shows "Failed to update personal information"
updateInfo.mutate(data)
```

## Development

For monorepo setup and general development workflow, see the [main README](../../README.md).

For SDK-specific development patterns, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Testing

```bash
# Run type checking
bun run typecheck
```

## License

PROPRIETARY
