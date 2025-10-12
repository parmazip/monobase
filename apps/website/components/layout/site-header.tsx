'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, User, LogOut } from 'lucide-react'
import { Button } from '@monobase/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@monobase/ui/components/dropdown-menu'
import { SignupModal } from '@/components/auth/signup-modal'
import { patientAppUrl, providerAppUrl } from '@/utils/config'

interface SiteHeaderProps {
  session: {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role?: string
    }
    session: {
      id: string
      expiresAt: Date
      token: string
      userId: string
    }
  } | null | undefined
  isLoading: boolean
  onSignOut: () => void
}

export function SiteHeader({ session, isLoading, onSignOut }: SiteHeaderProps): React.JSX.Element {
  const getDashboardUrl = () => {
    const userRole = (session?.user as any)?.role
    if (!userRole) return `${patientAppUrl}/dashboard`

    const roles = userRole.split(',').map((r: string) => r.trim())

    // If user has provider role, redirect to provider app
    if (roles.includes('provider')) {
      return `${providerAppUrl}/dashboard`
    }

    // Default to patient app
    return `${patientAppUrl}/dashboard`
  }

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <Image
                src="/images/logos/logo-horizontal.png"
                alt="Parmazip Healthcare"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/#features" 
                className="text-gray-700 hover:text-primary text-sm font-medium transition-colors"
              >
                Features
              </Link>
              <Link 
                href="/#solutions" 
                className="text-gray-700 hover:text-primary text-sm font-medium transition-colors"
              >
                Solutions
              </Link>
              <Link 
                href="/pharmacists" 
                className="text-gray-700 hover:text-primary text-sm font-medium transition-colors"
              >
                Find a Pharmacist
              </Link>
              <Link 
                href="/#integrations" 
                className="text-gray-700 hover:text-primary text-sm font-medium transition-colors"
              >
                Integrations
              </Link>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-20 h-9 bg-gray-200 rounded animate-pulse" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{session.user.name?.split(' ')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a 
                      href={getDashboardUrl()}
                      className="flex items-center w-full"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Dashboard
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onSignOut}
                    className="flex items-center text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SignupModal />
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}