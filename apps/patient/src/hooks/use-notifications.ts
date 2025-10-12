// Re-export SDK notification hooks
export {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@monobase/sdk/react/hooks/use-notifications'

// Alias for unread notifications
import { useMyNotifications } from '@monobase/sdk/react/hooks/use-notifications'
export const useUnreadNotifications = () => {
  const { data } = useMyNotifications({ read: false })
  return {
    data: data?.data || [],
    count: data?.data?.length || 0,
  }
}
