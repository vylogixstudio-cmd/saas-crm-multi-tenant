import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { getSystemSettings } from '@/lib/superAdminStore'
import Link from 'next/link'
import { LogOut, Package, Home, Settings } from 'lucide-react'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) redirect('/login')

  // Check Maintenance Mode for Portal (Client)
  const settings = getSystemSettings()
  
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, organization_id, role')
    .eq('id', user.id)
    .single()

  if (settings.maintenance_mode && profile?.role !== 'super_admin' && profile?.role !== 'superadmin') {
    const target = settings.maintenance_target || 'ALL'
    if (target === 'ALL' || target === 'CLIENT') {
      redirect('/maintenance')
    }
  }

  const { data: org } = profile?.organization_id
    ? await supabase
        .from('organizations')
        .select('name, logo_url, tagline')
        .eq('id', profile.organization_id)
        .single()
    : { data: null }

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Plus_Jakarta_Sans']">

      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Agency Logo + Name */}
          <Link href="/portal" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Package size={16} className="text-white" />
              </div>
            )}
            <div>
              <p className="font-extrabold text-sm text-gray-900 leading-none">{org?.name || 'Agency'}</p>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Portal Klien</p>
            </div>
          </Link>

          {/* Center: Navigation */}
          <div className="flex items-center gap-1">
            <Link 
              href="/portal" 
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <Home size={14} />
              Beranda
            </Link>
            <Link 
              href="/portal/settings" 
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <Settings size={14} />
              Pengaturan
            </Link>
          </div>

          {/* Right: User info + logout */}
          <div className="flex items-center gap-3">
            <Link 
              href="/portal/settings" 
              className="hidden sm:block text-right group hover:opacity-80 transition-opacity"
            >
              <p className="text-xs font-bold text-gray-900 leading-none group-hover:text-blue-600 transition-colors">
                {profile?.full_name || 'Klien'}
              </p>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">{profile?.email}</p>
            </Link>
            
            <Link 
              href="/portal/settings" 
              className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm hover:ring-2 hover:ring-blue-300 transition-all"
              title="Pengaturan Profil"
            >
              {(profile?.full_name || 'K').charAt(0).toUpperCase()}
            </Link>

            <form action={logout}>
              <button 
                type="submit" 
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                title="Keluar dari Portal"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-bold text-gray-500">{org?.name || 'Agency'}</span> &mdash; Portal Klien
          </p>
        </div>
      </footer>
    </div>
  )
}
