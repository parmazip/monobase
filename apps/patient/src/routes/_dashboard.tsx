import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuthWithProfile } from '@/services/guards'
import { AppSidebar, type NavGroup } from '@/components/app-sidebar'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@monobase/ui/components/sidebar'
import { Separator } from '@monobase/ui/components/separator'
import {
  Home,
  User,
  Shield,
  Calendar,
  Activity,
  Bell,
  CreditCard,
  Stethoscope,
  FileText,
  Video,
} from 'lucide-react'
import { UserButton } from '@daveyplate/better-auth-ui'
import { useUnreadNotifications } from '@/hooks/use-notifications'
import { useAppointments } from '@/hooks/use-appointments'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: requireAuthWithProfile(),
  component: DashboardLayout,
})

function DashboardLayout() {
  // Fetch unread notifications count for badge
  const { data: unreadData } = useUnreadNotifications()
  const unreadCount = unreadData?.pagination?.totalCount || 0

  // Fetch confirmed appointments count for badge
  const { data: confirmedAppointmentsData } = useAppointments({ 
    status: 'confirmed', 
    limit: 1 
  })
  const confirmedAppointmentsCount = confirmedAppointmentsData?.pagination?.totalCount || 0

  // Define navigation structure for the dashboard
  const navGroups: NavGroup[] = [
    {
      label: "Navigation",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
          badge: null,
        },
        {
          title: "Appointments",
          url: "/appointments",
          icon: Video,
          badge: confirmedAppointmentsCount > 0 ? confirmedAppointmentsCount : null,
        },
        {
          title: "Medical Records",
          url: "/medical-records",
          icon: FileText,
        },
        {
          title: "Providers",
          url: "/providers",
          icon: Stethoscope,
        },
        {
          title: "Billing",
          url: "/billing",
          icon: CreditCard,
        },
        {
          title: "Notifications",
          url: "/notifications",
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : null,
        },
      ]
    },
    {
      label: "Account",
      items: [
        {
          title: "Account Settings",
          url: "/settings/account",
          icon: User,
        },
        {
          title: "Healthcare Settings",
          url: "/settings/healthcare",
          icon: Activity,
        },
        {
          title: "Security",
          url: "/settings/security",
          icon: Shield,
        },
      ]
    }
  ]

  return (
    <SidebarProvider>
      <AppSidebar
        navGroups={navGroups}
        headerTitle="PARMAZIP"
        headerSubtitle="Patient Portal"
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            {/* Breadcrumbs will go here */}
          </div>
          <UserButton
            variant="ghost"
            disableDefaultLinks
          />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
