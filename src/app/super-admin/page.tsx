import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Crown, LogOut, Building2, Users, Layers, Ban, CheckCircle, Zap, Globe, Package, DollarSign } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { createAdminClient } from '@/utils/supabase/admin'
import { getBroadcasts, getSystemSettings } from '@/lib/superAdminStore'
import SuperAdminTabs from './SuperAdminTabs'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgencyService {
  id: string
  name: string
  organization_id: string
}

export interface EnrichedAgency {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  is_active: boolean | null
  license_expires_at: string | null
  auto_suspend: boolean | null
  industry_type?: string
  module_digital?: boolean
  module_physical?: boolean
  monthly_sales_target?: number
  profiles: { email: string | undefined }
  projectCount: number
  staffCount: number
  clientCount: number
  totalRevenue: number
  hasSheets: boolean
  services: AgencyService[]
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function SuperAdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Verify super_admin role
  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'superadmin')) {
    redirect('/dashboard')
  }

  // ── Fetch base org list ────────────────────────────────────────────────────
  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  let agencies: EnrichedAgency[] = []
  let totalClientsAll = 0
  let totalStaffAll = 0
  let totalSaaSRevenue = 0
  let totalServicesAll = 0

  if (orgs && orgs.length > 0) {
    const orgIds = orgs.map((a) => a.id).filter(Boolean)

    // Parallel fetch: profiles, projects, services, transactions, sheet_configs
    const [profilesResult, projectCountsResult, servicesResult, txResult, sheetsResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, email, role, organization_id'),
      supabaseAdmin.from('projects').select('id, organization_id'),
      supabaseAdmin.from('agency_services').select('id, name, organization_id').in('organization_id', orgIds).order('name', { ascending: true }),
      supabaseAdmin.from('fin_transactions').select('organization_id, amount, type').eq('type', 'INCOME'),
      supabaseAdmin.from('agency_sheet_configs').select('agency_id, sheet_id')
    ])

    const allProfiles = profilesResult.data ?? []
    const projectRows = projectCountsResult.data ?? []
    const servicesData = (servicesResult.data ?? []) as AgencyService[]
    const transactions = txResult.data ?? []
    const sheetConfigs = sheetsResult.data ?? []

    totalClientsAll = allProfiles.filter(p => p.role === 'client').length
    totalStaffAll = allProfiles.filter(p => p.role !== 'client' && p.role !== 'super_admin').length
    totalSaaSRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    totalServicesAll = servicesData.length

    agencies = orgs.map((a) => {
      const orgProfiles = allProfiles.filter(p => p.organization_id === a.id)
      const adminEmail = orgProfiles.find(p => p.role === 'admin')?.email
      const staffCount = orgProfiles.filter(p => p.role !== 'client').length
      const clientCount = orgProfiles.filter(p => p.role === 'client').length
      const projectCount = projectRows.filter(p => p.organization_id === a.id).length
      const orgTx = transactions.filter(tx => tx.organization_id === a.id)
      const totalRev = orgTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
      const hasSheets = sheetConfigs.some(s => s.agency_id === a.id && Boolean(s.sheet_id))

      return {
        ...a,
        profiles: { email: adminEmail },
        projectCount,
        staffCount,
        clientCount,
        totalRevenue: totalRev,
        hasSheets,
        services: servicesData.filter((s) => s.organization_id === a.id),
      }
    }) as EnrichedAgency[]
  }

  // ── Metrics Calculation ────────────────────────────────────────────────────
  const totalAgencies = agencies.length
  let activeAgencies = 0
  let suspendedAgencies = 0
  let totalProjects = 0

  let digitalCount = 0
  let physicalCount = 0
  let hybridCount = 0

  agencies.forEach((a) => {
    totalProjects += a.projectCount
    const isExpired = a.license_expires_at ? new Date() > new Date(a.license_expires_at) : false
    const isSuspended = a.is_active === false || (a.auto_suspend && isExpired)
    
    if (isSuspended) {
      suspendedAgencies++
    } else {
      activeAgencies++
    }

    const isIndPhysical = a.industry_type === 'PHYSICAL' || a.industry_type === 'MANUFACTURING'
    const isPhys = a.module_physical === true || isIndPhysical
    const isDig = a.module_digital !== false && !isIndPhysical
    if (isDig && isPhys) {
      hybridCount++
    } else if (isPhys) {
      physicalCount++
    } else {
      digitalCount++
    }
  })

  // ── Fetch broadcasts + settings ────────────────────────────────────────────
  const broadcasts = getBroadcasts()
  const systemSettings = getSystemSettings()

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-12 px-4 sm:px-8 pb-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header Super Admin (Console Style) ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-[#111827] to-slate-900 p-6 sm:p-8 rounded-[28px] shadow-xl border border-white/10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown size={120} />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-amber-500/20 rounded-[18px] text-amber-400 border border-amber-500/30 shrink-0 shadow-inner">
              <Crown size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-extrabold text-2xl sm:text-3xl font-['Plus_Jakarta_Sans'] tracking-tight">
                  SaaS Master Console
                </h1>
                <span className="px-3 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                  SUPER ADMIN
                </span>
                {systemSettings.maintenance_mode && (
                  <span className="px-3 py-0.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                    🔧 MAINTENANCE
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">
                Pusat Kontrol Multi-Tenant Vylogix CRM • Manajemen {totalAgencies} Tenant Agensi & Ekosistem
              </p>
            </div>
          </div>

          <form action={logout} className="relative z-10">
            <button
              type="submit"
              className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white px-5 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-rose-600 hover:border-rose-600 transition-all shadow-sm"
            >
              <LogOut size={15} /> Keluar Console
            </button>
          </form>
        </div>

        {/* ── SaaS Global KPIs ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Total Tenants */}
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#6B7280] text-[11px] font-bold uppercase tracking-wider mb-1">Tenant Agensi</p>
                <h3 className="text-3xl font-extrabold text-[#111827]">{totalAgencies} <span className="text-sm font-medium text-gray-400">Agensi</span></h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-[14px]">
                <Building2 size={22} />
              </div>
            </div>
            <div className="text-xs text-[#6B7280] font-medium flex gap-2 pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle size={13}/> {activeAgencies} Aktif</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-rose-600 font-bold"><Ban size={13}/> {suspendedAgencies} Suspended</span>
            </div>
          </div>

          {/* Card 2: Tenant Distribution */}
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[#6B7280] text-[11px] font-bold uppercase tracking-wider mb-1">Distribusi Tipe</p>
                <h3 className="text-2xl font-extrabold text-[#111827]">{digitalCount}D &bull; {physicalCount}F &bull; {hybridCount}H</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-[14px]">
                <Zap size={22} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-2 border-t border-gray-100">
              <span className="text-blue-600">{digitalCount} Digital</span> &bull;
              <span className="text-orange-600">{physicalCount} Fisik</span> &bull;
              <span className="text-purple-600">{hybridCount} Hybrid</span>
            </div>
          </div>

          {/* Card 3: Total Users */}
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#6B7280] text-[11px] font-bold uppercase tracking-wider mb-1">Total Pengguna</p>
                <h3 className="text-3xl font-extrabold text-[#111827]">{totalStaffAll + totalClientsAll}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-[14px]">
                <Users size={22} />
              </div>
            </div>
            <div className="text-xs text-[#6B7280] font-medium flex gap-2 pt-2 border-t border-gray-100">
              <span>👥 <strong>{totalStaffAll}</strong> Tim & Staf</span>
              <span className="text-gray-300">|</span>
              <span>👤 <strong>{totalClientsAll}</strong> Klien</span>
            </div>
          </div>

          {/* Card 4: Total Volume Transaksi */}
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#6B7280] text-[11px] font-bold uppercase tracking-wider mb-1">Volume Bisnis Terproses</p>
                <h3 className="text-2xl font-extrabold text-emerald-600">Rp {totalSaaSRevenue.toLocaleString('id-ID')}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[14px]">
                <DollarSign size={22} />
              </div>
            </div>
            <p className="text-xs text-[#6B7280] font-medium pt-2 border-t border-gray-100">Dari {totalProjects} proyek & pesanan tenant</p>
          </div>

        </div>

        {/* ── Tabbed Main Content ───────────────────────────────────────────── */}
        <SuperAdminTabs
          agencies={agencies}
          broadcasts={broadcasts}
          settings={systemSettings}
          globalStats={{
            totalProjects,
            totalOrgs: totalAgencies,
            totalProfiles: totalStaffAll + totalClientsAll,
            totalTransactions: 0, // will be fetched live in Health panel via reload
            totalServices: totalServicesAll,
          }}
        />

        <p className="text-center text-xs text-gray-400">
          Vylogix SaaS Platform Multi-Tenant &bull; Hak Akses Master Super Administrator
        </p>

      </div>
    </div>
  )
}
