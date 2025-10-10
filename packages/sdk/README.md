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
│   └── storage.ts      # File upload/download
├── react/              # React-specific code
│   ├── provider.tsx    # ApiProvider setup
│   ├── auth-client.ts  # Auth singleton
│   ├── query-keys.ts   # TanStack Query key factory
│   └── hooks/          # React hooks
│       ├── use-auth.ts         # Better-Auth hooks
│       ├── use-person.ts       # Person hooks
│       ├── use-notifications.ts # Notification hooks
│       └── use-storage.ts      # File upload hook
└── utils/
    └── api.ts          # API utilities (pagination, sanitization)
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

### Utilities

```typescript
import { PaginatedResponse, sanitizeObject } from "@monobase/sdk/utils/api"

// Handle paginated responses
const response: PaginatedResponse<Notification> = await listNotifications()
console.log(response.data, response.pagination)

// Sanitize form data for API submission
const clean = sanitizeObject(formData, {
  nullable: ['lastName', 'middleName', 'primaryAddress']
})
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
