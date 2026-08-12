'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, ChevronDown, Menu, LogOut } from 'lucide-react'
import { NavItem } from './navigation'
import { createClient } from '@/utils/supabase/client'

interface BaseSidebarProps {
  navigation: NavItem[]
  children: React.ReactNode
  userProfile: { name: string; email: string } | null
  role: string | null
  permissions: string[]
  updateCount: number
  splitRequestCount?: number
  isPreFiltered?: boolean
  org?: { name?: string; logo_url?: string } | null
}

export default function BaseSidebar({
  navigation,
  children,
  userProfile,
  role,
  permissions,
  updateCount,
  splitRequestCount,
  isPreFiltered,
  org
}: BaseSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Auto expand menu that matches pathname
    const newExpanded = { ...expandedMenus }
    navigation.forEach(item => {
      if (item.subItems) {
        const subItems = item.subItems
        if (subItems?.some((sub: any) => pathname.startsWith(sub.href))) {
          newExpanded[item.name] = true
        }
      }
    })
    setExpandedMenus(newExpanded)
  }, [pathname, navigation])

  // Logic Dynamic Sidebar
  const filteredNavigation = isPreFiltered ? navigation : navigation.filter(item => {
    // Super admin & admin punya akses penuh
    if (role === 'super_admin' || role === 'admin') {
      return true
    }

    // Khusus Staff Finance: Tampilkan menu Klien (CRM)
    if (role === 'staff_finance' && item.name === 'Klien (CRM)') {
      return true
    }

    // Khusus Staff Digital/Eksekutor & CS & Design: Tampilkan menu Klien
    if (['staff_executor', 'staff_digital', 'staff_cs', 'staff_design'].includes(role as string) && item.name === 'Klien (CRM)') {
      return true
    }

    if (item.name === 'Pantau Tagihan') {
      return role === 'staff_ops' || role === 'staff_finance'
    }

    if (item.name === 'Pesanan Aktif' || item.name === 'Pesanan Aktif (Produksi)') {
      if (role === 'staff_cs' || role === 'staff_design' || role === 'staff_production' || role === 'staff_ops') return true;
    }

    if (item.name === 'Pesanan Masuk') {
      if (role === 'staff_cs' || role === 'staff_ops') return true;
    }

    // Untuk role selain admin, cek permission array
    if (item.permission) {
      return permissions.includes(item.permission)
    }

    // Menu khusus admin (jika item.permission null dan bukan Dashboard/Pengaturan)
    if (item.name === 'Tim & Staf' || item.name === 'Log Aktivitas') {
      return false
    }

    // Dashboard & Settings selalu muncul untuk staff
    if (item.name === 'Dashboard' || item.name === 'Dasbor' || item.name === 'Pengaturan') {
      return true
    }

    return false
  })

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-black/5 
        transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-black/5 shrink-0 relative group">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name || 'Logo'} className="w-8 h-8 rounded-[8px] object-cover shrink-0 border border-black/5" />
            ) : (
              <div className="w-8 h-8 bg-[#2563EB] rounded-[8px] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-extrabold text-sm uppercase">
                  {org?.name ? org.name.substring(0, 2) : 'VX'}
                </span>
              </div>
            )}
            <h2 className={`font-extrabold text-base text-[#111827] font-['Plus_Jakarta_Sans'] transition-opacity duration-300 truncate whitespace-nowrap ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'}`}>
              {org?.name || 'CRM Panel'}
            </h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-[#4B5563] p-1 hover:bg-[#F8F9FA] rounded-md shrink-0">
            <X size={20} />
          </button>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 bg-white border border-black/10 rounded-full p-2 text-[#4B5563] hover:text-[#111827] shadow-sm hover:shadow-md transition-all z-10"
          >
            {isCollapsed ? <ChevronRight size={20} strokeWidth={2.5} /> : <ChevronLeft size={20} strokeWidth={2.5} />}
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 md:px-4 space-y-1.5 custom-scrollbar">
          {filteredNavigation.map((item) => {
            let isActive = false
            if (!item.href) {
              isActive = false
            } else if (item.href === '/dashboard') {
              isActive = pathname === item.href
            } else if (item.href === '/dashboard/projects') {
              isActive = (pathname === '/dashboard/projects' || pathname.startsWith('/dashboard/project/')) && searchParams.get('source') !== 'completed' && searchParams.get('source') !== 'updates'
            } else if (item.href === '/dashboard/projects/completed') {
              isActive = pathname === '/dashboard/projects/completed' || (pathname.startsWith('/dashboard/project/') && searchParams.get('source') === 'completed')
            } else if (item.href === '/dashboard/updates') {
              isActive = pathname === '/dashboard/updates' || (pathname.startsWith('/dashboard/project/') && searchParams.get('source') === 'updates')
            } else if (item.href.includes('?')) {
              const [basePath, query] = item.href.split('?')
              const searchParamsObj = new URLSearchParams(query)
              let allMatch = true
              for (const [key, value] of searchParamsObj.entries()) {
                if (searchParams.get(key) !== value) {
                  allMatch = false
                  break
                }
              }
              isActive = pathname === basePath && allMatch
            } else if (item.href === '/dashboard/design' || item.href === '/dashboard/inventory' || item.href === '/dashboard/production' || item.href === '/dashboard/shipping') {
              isActive = pathname === item.href
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            }
            
            // Handling accordion parent
            if (item.subItems) {
              const subItems = item.subItems
              const isParentActive = subItems.some((sub: any) => pathname.startsWith(sub.href))
              const isExpanded = expandedMenus[item.name] || false
              
              return (
                <div key={item.name} className="flex flex-col">
                  <button
                    onClick={() => {
                      setExpandedMenus(prev => ({ ...prev, [item.name]: !isExpanded }))
                      if (isCollapsed) setIsCollapsed(false)
                    }}
                    title={isCollapsed ? item.name : undefined}
                    className={`
                      flex items-center justify-between px-3 py-3 rounded-[12px] text-sm font-bold transition-all whitespace-nowrap overflow-hidden
                      ${isParentActive 
                        ? 'bg-[#2563EB] text-white shadow-sm' 
                        : 'text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#111827]'}
                    `}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="shrink-0 relative">
                        <item.icon size={18} className={isParentActive ? 'text-white' : 'text-[#6B7280] group-hover:text-[#111827]'} />
                        {item.name.includes('Kasir') && (splitRequestCount || 0) > 0 && isCollapsed ? (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
                        ) : null}
                      </div>
                      <span className={`transition-opacity duration-300 flex-1 flex items-center justify-between ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'}`}>
                        <span>{item.name}</span>
                        {item.name.includes('Kasir') && (splitRequestCount || 0) > 0 && !isExpanded && !isCollapsed ? (
                          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0 ml-2">
                            {splitRequestCount}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} className={isParentActive ? 'text-white/80' : 'text-gray-400'} />
                      </div>
                    )}
                  </button>
                  
                  {/* Sub Items (Accordion Content) */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded && !isCollapsed ? 'max-h-96 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-1 pl-4 border-l-2 border-gray-100 ml-4 py-2">
                      {subItems.map((subItem: any) => {
                        const [basePath, query] = subItem.href.split('?')
                        const searchParamsObj = new URLSearchParams(query || '')
                        let isSubActive = pathname === basePath
                        for (const [key, value] of searchParamsObj.entries()) {
                          if (searchParams.get(key) !== value) {
                            isSubActive = false
                            break
                          }
                        }
                        
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all
                              ${isSubActive 
                                ? 'bg-blue-50 text-[#2563EB]' 
                                : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]'}
                            `}
                          >
                            <subItem.icon size={15} className={isSubActive ? 'text-[#2563EB]' : 'text-gray-400'} />
                            <span className="flex-1 flex items-center justify-between">
                              <span>{subItem.name}</span>
                              {subItem.name === 'Cicilan Klien' && (splitRequestCount || 0) > 0 ? (
                                <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                                  {splitRequestCount}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }
            
            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm font-bold transition-all whitespace-nowrap overflow-hidden
                  ${isActive 
                    ? 'bg-[#2563EB] text-white shadow-sm' 
                    : 'text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#111827]'}
                `}
              >
                <div className={`shrink-0 ${item.isSubMenu ? 'ml-4' : ''}`}>
                  <item.icon size={item.isSubMenu ? 15 : 18} className={isActive ? 'text-white' : 'text-[#6B7280] group-hover:text-[#111827]'} />
                </div>
                <span className={`transition-opacity duration-300 flex-1 flex items-center justify-between ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'} ${item.isSubMenu ? 'text-[13px] font-semibold' : ''}`}>
                  <span>{item.name}</span>
                  {item.href === '/dashboard/updates' && updateCount > 0 && !isCollapsed && (
                    <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
                      {updateCount}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-black/5 bg-[#F8F9FA] shrink-0 overflow-hidden">
          <div className="flex items-center gap-2">
             <div className="w-9 h-9 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[#2563EB] font-bold shrink-0 uppercase text-sm">
                {userProfile?.name?.charAt(0) || role?.charAt(0) || 'U'}
             </div>
             <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:h-0' : 'opacity-100'}`}>
                <p className="text-sm font-bold text-[#111827] truncate">{userProfile?.name || role}</p>
                <p className="text-[11px] font-medium text-[#6B7280] truncate capitalize">{role?.replaceAll('_', ' ')}</p>
             </div>
             <button
               onClick={handleLogout}
               title="Logout"
               className={`p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 ${isCollapsed ? '' : 'ml-auto'}`}
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-black/5 flex items-center px-4 justify-between shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name || 'Logo'} className="w-8 h-8 rounded-[8px] object-cover shrink-0 border border-black/5" />
            ) : (
              <div className="w-8 h-8 bg-[#2563EB] rounded-[8px] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-extrabold text-sm uppercase">
                  {org?.name ? org.name.substring(0, 2) : 'VX'}
                </span>
              </div>
            )}
            <h1 className="font-extrabold text-base sm:text-lg text-[#111827] truncate font-['Plus_Jakarta_Sans']">
              {org?.name || 'CRM Panel'}
            </h1>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-[#4B5563] hover:text-[#111827] bg-[#F8F9FA] rounded-[12px] border border-black/5 shrink-0">
            <Menu size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
