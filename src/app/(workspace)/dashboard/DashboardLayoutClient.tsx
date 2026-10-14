'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import SidebarDigital from '@/components/layouts/SidebarDigital'
import SidebarPhysical from '@/components/layouts/SidebarPhysical'
import SidebarHybrid from '@/components/layouts/SidebarHybrid'
import GlobalNotificationListener from '@/components/dashboard/GlobalNotificationListener'
import ImpersonationBanner from '@/components/dashboard/ImpersonationBanner'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userProfile: { id: string; name: string; email: string }
  role: string | null
  actualRole: string | null
  isImpersonating: boolean
  impersonatedOrgName?: string | null
  permissions: string[]
  updateCount: number
  splitRequestCount: number
  orgData: { name?: string; logo_url?: string } | null
  organizationId: string | null
  activeModules: { digital: boolean; physical: boolean }
}

export default function DashboardLayoutClient({
  children,
  userProfile,
  role,
  actualRole,
  isImpersonating,
  impersonatedOrgName,
  permissions,
  updateCount,
  splitRequestCount,
  orgData,
  organizationId,
  activeModules,
}: DashboardLayoutClientProps) {
  const pathname = usePathname()

  if (role === 'client') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {orgData?.logo_url ? (
                <img
                  src={orgData.logo_url}
                  alt={orgData.name || 'Logo'}
                  className="w-8 h-8 rounded-[8px] object-cover shrink-0 border border-black/5"
                />
              ) : (
                <div className="w-8 h-8 bg-[#2563EB] rounded-[8px] flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-white font-extrabold text-sm uppercase">
                    {orgData?.name ? orgData.name.substring(0, 2) : 'VX'}
                  </span>
                </div>
              )}
              <h1 className="font-extrabold text-lg text-[#111827] font-['Plus_Jakarta_Sans'] hidden sm:block">
                {orgData?.name || 'Client Portal'}
              </h1>
            </div>

            <nav className="flex items-center gap-1 sm:gap-4">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  pathname === '/dashboard' || pathname.startsWith('/dashboard/project')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Proyek Saya</span>
              </Link>
              <Link
                href="/dashboard/client-settings"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  pathname.startsWith('/dashboard/client-settings')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Pengaturan</span>
              </Link>
              <div className="w-px h-6 bg-gray-200 mx-1 sm:mx-2"></div>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <span className="hidden sm:inline">Logout</span>
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    )
  }

  const sidebarProps = {
    userProfile,
    role,
    permissions,
    updateCount,
    splitRequestCount,
    org: orgData,
  }

  const contentWithBanner = (
    <div className="flex flex-col min-h-full">
      {isImpersonating && (
        <ImpersonationBanner orgName={impersonatedOrgName || orgData?.name || 'Agensi'} />
      )}
      <div className="flex-1">{children}</div>
    </div>
  )

  if (activeModules.digital && activeModules.physical) {
    return (
      <>
        {userProfile && organizationId && (
          <GlobalNotificationListener
            organizationId={organizationId}
            currentUserId={userProfile.id}
          />
        )}
        <SidebarHybrid {...sidebarProps}>{contentWithBanner}</SidebarHybrid>
      </>
    )
  }

  if (activeModules.physical) {
    return (
      <>
        {userProfile && organizationId && (
          <GlobalNotificationListener
            organizationId={organizationId}
            currentUserId={userProfile.id}
          />
        )}
        <SidebarPhysical {...sidebarProps}>{contentWithBanner}</SidebarPhysical>
      </>
    )
  }

  return (
    <>
      {userProfile && organizationId && (
        <GlobalNotificationListener
          organizationId={organizationId}
          currentUserId={userProfile.id}
        />
      )}
      <SidebarDigital {...sidebarProps}>{contentWithBanner}</SidebarDigital>
    </>
  )
}
