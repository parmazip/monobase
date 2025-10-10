// Query keys factory for consistent key management
export const queryKeys = {
  all: [] as const,

  // Person & Provider (adapted for provider app)
  person: () => [...queryKeys.all, 'person'] as const,
  personProfile: (id?: string) => [...queryKeys.person(), id] as const,
  provider: () => [...queryKeys.all, 'provider'] as const,
  providerProfile: (id?: string) => [...queryKeys.provider(), id] as const,

  // Notifications
  notifications: () => [...queryKeys.all, 'notifications'] as const,
  notificationsList: (params?: any) =>
    [...queryKeys.notifications(), 'list', params] as const,
  notification: (id: string) => [...queryKeys.notifications(), id] as const,

  // Communications
  chatRooms: () => [...queryKeys.all, 'chatRooms'] as const,
  chatRoomsList: (params?: any) => [...queryKeys.chatRooms(), 'list', params] as const,
  chatRoom: (id: string) => [...queryKeys.chatRooms(), id] as const,
  
  chatMessages: (roomId: string) => [...queryKeys.all, 'chatMessages', roomId] as const,
  chatMessagesList: (roomId: string, params?: any) => 
    [...queryKeys.chatMessages(roomId), 'list', params] as const,
  chatMessage: (roomId: string, messageId: string) => 
    [...queryKeys.chatMessages(roomId), messageId] as const,

} as const