// Query keys factory for consistent key management
export const queryKeys = {
  all: [] as const,

  // Person
  person: () => [...queryKeys.all, 'person'] as const,
  personProfile: (id?: string) => [...queryKeys.person(), id] as const,

  // Providers
  providers: () => [...queryKeys.all, 'providers'] as const,
  providersList: (params?: any) => [...queryKeys.providers(), 'list', params] as const,
  provider: (id: string) => [...queryKeys.providers(), id] as const,

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

  // Booking
  booking: () => [...queryKeys.all, 'booking'] as const,
  bookingProviders: (filters?: Record<string, unknown>) =>
    filters ? [...queryKeys.booking(), 'providers', filters] as const : [...queryKeys.booking(), 'providers'] as const,
  bookingProviderSlots: (providerId: string) => [...queryKeys.booking(), 'providers', providerId, 'slots'] as const,

  // Billing
  billing: () => [...queryKeys.all, 'billing'] as const,
  billingMerchantAccount: () => [...queryKeys.billing(), 'merchantAccount', 'me'] as const,
  billingInvoices: (params?: Record<string, unknown>) =>
    params ? [...queryKeys.billing(), 'invoices', params] as const : [...queryKeys.billing(), 'invoices'] as const,
  billingInvoice: (id: string) => [...queryKeys.billing(), 'invoices', id] as const,

} as const
