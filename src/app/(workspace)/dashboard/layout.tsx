'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LayoutDashboard, Settings } from 'lucide-react'

import SidebarDigital from '@/components/layouts/SidebarDigital'
import SidebarPhysical from '@/components/layouts/SidebarPhysical'
import SidebarHybrid from '@/components/layouts/SidebarHybrid'
import GlobalNotificationListener from '@/components/dashboard/GlobalNotificationListener'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  const [role, setRole] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{id: string, name: string, email: string} | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [activeModules, setActiveModules] = useState({ digital: true, physical: false })
  const [updateCount, setUpdateCount] = useState(0)
  const [splitRequestCount, setSplitRequestCount] = useState(0)
  const [orgData, setOrgData] = useState<{ name?: string; logo_url?: string } | null>(null)
  
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()

    const fetchProfileData = async (user: any) => {
      setUserProfile({ id: user.id, name: user.user_metadata?.full_name || 'User', email: user.email || '' })
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id, organizations(name, logo_url, module_digital, module_physical, industry_type)')
        .eq('id', user.id)
        .single()
        
      if (profile) {
        setRole(profile.role)

        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return null
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift() || null
          return null
        }

        const impersonatedOrgId = getCookie('vylogix_impersonate_org')
        const targetOrgId = impersonatedOrgId || profile.organization_id
        setOrganizationId(targetOrgId)

        // Check maintenance mode (Configurable target check)
        if (profile.role !== 'super_admin' && profile.role !== 'superadmin') {
          try {
            const mRes = await fetch('/api/platform/settings').then(r => r.json())
            if (mRes.success && mRes.maintenance_mode) {
              const target = mRes.maintenance_target || 'ALL'
              if (target === 'ALL' || target === 'AGENCY') {
                window.location.href = '/maintenance'
                return
              }
            }
          } catch (e) {
            console.error('Error checking maintenance status:', e)
          }
        }
        
        let org: any = null
        if (impersonatedOrgId) {
          const { data: orgDb } = await supabase
            .from('organizations')
            .select('name, logo_url, module_digital, module_physical, industry_type')
            .eq('id', impersonatedOrgId)
            .single()
          org = orgDb
        } else if (profile.organizations) {
          const rawOrg = profile.organizations
          org = Array.isArray(rawOrg) ? (rawOrg[0] as any) : (rawOrg as any)
        }

        if (org) {
           const isIndustryPhysical = org?.industry_type === 'PHYSICAL' || org?.industry_type === 'MANUFACTURING'
           const isDigital = org?.module_digital !== false && !isIndustryPhysical
           const isPhysical = org?.module_physical === true || isIndustryPhysical

          setOrgData({
            name: org?.name || undefined,
            logo_url: org?.logo_url || undefined
          })

          setActiveModules({
            digital: isDigital,
            physical: isPhysical
          })
        }

        if (profile.role !== 'client') {
          const { data: perms } = await supabase
            .from('role_permissions')
            .select('permission_slug')
            .eq('role_slug', profile.role)
            
          if (perms) {
            setPermissions(perms.map(p => p.permission_slug))
          }

          // Fetch update requests count
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('status', 'update_pengajuan')
            
          if (count !== null) setUpdateCount(count)

          // Fetch split invoice requests count
          const { count: splitCount } = await supabase
            .from('fin_invoices')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('status', 'SPLIT_REQUESTED')
            
          if (splitCount !== null) setSplitRequestCount(splitCount)
        }
      }
    }

    // 1. Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchProfileData(user)
      }
    })

    // 2. Listen to cross-tab auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      } else if (session?.user) {
        fetchProfileData(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (!mounted || !role) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="animate-pulse w-8 h-8 bg-blue-200 rounded-full"></div>
    </div>
  }

  if (role === 'client') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {orgData?.logo_url ? (
                <img src={orgData.logo_url} alt={orgData.name || 'Logo'} className="w-8 h-8 rounded-[8px] object-cover shrink-0 border border-black/5" />
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
              <Link href="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/dashboard' || pathname.startsWith('/dashboard/project') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Proyek Saya</span>
              </Link>
              <Link href="/dashboard/client-settings" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${pathname.startsWith('/dashboard/client-settings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Settings size={18} />
                <span className="hidden sm:inline">Pengaturan</span>
              </Link>
              <div className="w-px h-6 bg-gray-200 mx-1 sm:mx-2"></div>
              <button onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all">
                <span className="hidden sm:inline">Logout</span>
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
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

  if (activeModules.digital && activeModules.physical) {
    return (
      <>
        {userProfile && organizationId && <GlobalNotificationListener organizationId={organizationId} currentUserId={userProfile.id} />}
        <SidebarHybrid {...sidebarProps}>{children}</SidebarHybrid>
      </>
    )
  }

  if (activeModules.physical) {
    return (
      <>
        {userProfile && organizationId && <GlobalNotificationListener organizationId={organizationId} currentUserId={userProfile.id} />}
        <SidebarPhysical {...sidebarProps}>{children}</SidebarPhysical>
      </>
    )
  }

  return (
    <>
      {userProfile && organizationId && <GlobalNotificationListener organizationId={organizationId} currentUserId={userProfile.id} />}
      <SidebarDigital {...sidebarProps}>{children}</SidebarDigital>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center"><div className="animate-pulse w-8 h-8 bg-blue-200 rounded-full"></div></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
