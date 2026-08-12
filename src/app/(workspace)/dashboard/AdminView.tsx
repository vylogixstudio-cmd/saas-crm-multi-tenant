import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/admin'
import { getBroadcasts } from '@/lib/superAdminStore'
import ImpersonationBanner from '@/components/dashboard/ImpersonationBanner'
import GlobalBroadcastBanner from '@/components/dashboard/GlobalBroadcastBanner'
import DashboardDigital from '@/components/dashboard/DashboardDigital'
import DashboardPhysical from '@/components/dashboard/DashboardPhysical'
import DashboardHybrid from '@/components/dashboard/DashboardHybrid'
import DashboardCS from '@/components/dashboard/DashboardCS'
import DashboardWarehouse from '@/components/dashboard/DashboardWarehouse'
import DashboardDesign from '@/components/dashboard/DashboardDesign'
import DashboardProduction from '@/components/dashboard/DashboardProduction'
import DashboardShipping from '@/components/dashboard/DashboardShipping'

export default async function AdminView() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  let currentOrgId: string | null = null
  let orgName = ''
  let orgLogoUrl: string | null = null
  let currentWebhookUrl: string | null = null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, organizations(module_digital, module_physical)')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'superadmin'
  const cookieStore = await cookies()
  const impersonatedOrgId = isSuperAdmin ? cookieStore.get('vylogix_impersonate_org')?.value : null
  const isImpersonating = Boolean(isSuperAdmin && impersonatedOrgId)

  // Jika super admin masuk tanpa impersonasi, arahkan ke master console
  if (isSuperAdmin && !impersonatedOrgId) {
    redirect('/super-admin')
  }

  const orgFilter = impersonatedOrgId || profile?.organization_id

  if (!orgFilter) {
    redirect('/login')
  }

  const userRole = isImpersonating ? 'admin' : profile?.role || 'admin'

  const isFinanceOrAdmin = ['super_admin', 'admin', 'staff_finance'].includes(userRole)
  const isOpsOrAdmin = ['super_admin', 'admin', 'staff_ops', 'staff_executor', 'staff_digital', 'staff_physical'].includes(userRole)
  const isExecutor = ['staff_executor', 'staff_digital', 'staff_physical'].includes(userRole)

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url, is_active, auto_suspend, license_expires_at, webhook_url, industry_type, module_digital, module_physical, monthly_sales_target')
    .eq('id', orgFilter)
    .single()

  const isExpired = org?.license_expires_at ? new Date() > new Date(org.license_expires_at) : false

  if (!org) {
    console.error("Organization data missing.")
  } else if (!isImpersonating && (org.is_active === false || (org.auto_suspend && isExpired))) {
    redirect('/suspended')
  }

  currentOrgId = org?.id ?? currentOrgId
  orgName = org?.name ?? orgName
  orgLogoUrl = org?.logo_url ?? orgLogoUrl
  currentWebhookUrl = org?.webhook_url ?? null
  const industryType = org?.industry_type || 'DIGITAL'

  // Fetch active broadcast for this organization
  const activeBroadcasts = getBroadcasts(orgFilter)
  const latestBroadcast = activeBroadcasts.length > 0 ? activeBroadcasts[0] : null

  // Fetch Projects — filter berdasarkan role
  let projectsQuery = supabase
    .from('projects')
    .select('*, profiles:client_id (full_name, email), project_physical_details(shipping_status)')
    .eq('organization_id', orgFilter)
    .order('created_at', { ascending: false })

  // Staff produksi hanya butuh project fisik agar count di dashboard match dengan kanban
  if (userRole === 'staff_production' || userRole === 'staff_shipping' || userRole === 'staff_warehouse') {
    projectsQuery = projectsQuery.eq('project_category', 'PHYSICAL')
  }

  const { data: projects } = await projectsQuery

  // Executor-specific metrics
  const totalProjectsCount = (projects || []).length
  const completedProjectsCount = (projects || []).filter(p => p.status === 'completed' || p.status === 'selesai').length
  const updateProjectsCount = (projects || []).filter(p => p.status === 'update_pengajuan' || p.status === 'update_deploy' || p.status === 'maintenance').length

  // Fetch Finance Data
  const { data: transactions } = await supabase
    .from('fin_transactions')
    .select('id, type, amount, created_at')
    .eq('organization_id', orgFilter)

  const { data: invoices } = await supabase
    .from('fin_invoices')
    .select('id, title, invoice_number, amount, status, created_at, due_date, client_id, profiles:client_id(full_name, email), projects:project_id(title)')
    .eq('organization_id', orgFilter)
    .order('created_at', { ascending: false })

  // Fetch Audit Logs for Activity Stream
  let auditLogsQuery = supabase
    .from('audit_logs')
    .select('id, action, actor_email, target_name, created_at')
    .eq('organization_id', orgFilter)
    .order('created_at', { ascending: false })
    .limit(5)

  if (userRole === 'staff_finance') {
    auditLogsQuery = auditLogsQuery.or('action.ilike.%invoice%,action.ilike.%payment%,action.ilike.%termin%,target_name.ilike.%invoice%,target_name.ilike.%tagihan%')
  }

  const { data: recentLogs } = await auditLogsQuery

  // Fetch Inventory for CS & Warehouse
  const { data: inventoryItems } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', orgFilter)
    .order('name', { ascending: true })

  let inventoryTransactionsQuery = supabase
    .from('inventory_transactions')
    .select('*')
    .eq('organization_id', orgFilter)
    .order('created_at', { ascending: false })
    .limit(50)
  
  const { data: inventoryTransactions } = await inventoryTransactionsQuery

  // Metrics Calculation
  const totalIncome = (transactions || []).filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = (transactions || []).filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalReceivables = (invoices || []).filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + Number(inv.amount), 0)
  const activeProjectsCount = (projects || []).filter(p => p.status !== 'completed' && p.status !== 'selesai').length
  const overdueProjectsCount = (projects || []).filter(p => p.status !== 'completed' && p.status !== 'selesai' && p.deadline && new Date(p.deadline) < new Date()).length
  
  const { count: clientsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'client')
    .eq('organization_id', orgFilter)

  // Top Clients LTV
  const clientLTV: Record<string, { name: string, ltv: number }> = {}
  ;(invoices || []).forEach(inv => {
    if (inv.status === 'PAID' && inv.client_id) {
      if (!clientLTV[inv.client_id]) {
        clientLTV[inv.client_id] = { name: (inv.profiles as any)?.full_name || 'Unknown', ltv: 0 }
      }
      clientLTV[inv.client_id].ltv += Number(inv.amount)
    }
  })
  const topClients = Object.values(clientLTV).sort((a, b) => b.ltv - a.ltv).slice(0, 5)

  // Calculate Omzet
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const omzetBulanIni = (transactions || [])
    .filter(t => t.type === 'INCOME' && new Date(t.created_at) >= currentMonthStart)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const omzetBulanLalu = (transactions || [])
    .filter(t => t.type === 'INCOME' && new Date(t.created_at) >= lastMonthStart && new Date(t.created_at) <= lastMonthEnd)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const pengeluaranBulanIni = (transactions || [])
    .filter(t => t.type === 'EXPENSE' && new Date(t.created_at) >= currentMonthStart)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const pengeluaranBulanLalu = (transactions || [])
    .filter(t => t.type === 'EXPENSE' && new Date(t.created_at) >= lastMonthStart && new Date(t.created_at) <= lastMonthEnd)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Calculate low stock items
  const { data: invItems } = await supabase
    .from('inventory_items')
    .select('current_stock, min_stock_alert')
    .eq('organization_id', orgFilter)
  const lowStockItemsCount = (invItems || []).filter(item => Number(item.current_stock) <= Number(item.min_stock_alert)).length

  // Calculate pending maintenance tickets
  const { count: pendingMaintenanceCount } = await supabase
    .from('maintenance_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgFilter)
    .eq('status', 'pending')

  // Calculate pending procurement requests
  const { count: pendingProcurementCount } = await supabase
    .from('procurement_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgFilter)
    .eq('status', 'PENDING')

  // Calculate total design assets in cloud
  const { count: designAssetsCount } = await supabase
    .from('design_assets')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgFilter)

  const dashboardProps = {
    orgLogoUrl,
    orgName,
    industryType,
    userRole,
    currentWebhookUrl,
    isExecutor,
    isFinanceOrAdmin,
    isOpsOrAdmin,
    totalProjectsCount: projects?.length || 0,
    activeProjectsCount,
    completedProjectsCount,
    updateProjectsCount: 0,
    totalIncome,
    totalExpense,
    totalReceivables,
    clientsCount: clientsCount || 0,
    designAssetsCount: designAssetsCount || 0,
    omzetBulanIni,
    omzetBulanLalu,
    pengeluaranBulanIni,
    pengeluaranBulanLalu,
    overdueProjectsCount,
    lowStockItemsCount,
    pendingMaintenanceCount: pendingMaintenanceCount || 0,
    pendingProcurementCount: pendingProcurementCount || 0,
    monthlySalesTarget: org?.monthly_sales_target || 0,
    transactions: transactions || [],
    invoices: invoices || [],
    projects: projects || [],
    recentLogs: recentLogs || [],
    inventoryItems: inventoryItems || [],
    inventoryTransactions: inventoryTransactions || [],
    topClients
  }

  // @ts-ignore
  const isIndustryPhysical = org?.industry_type === 'PHYSICAL' || org?.industry_type === 'MANUFACTURING'
  // @ts-ignore
  const isPhysical = org?.module_physical === true || profile?.organizations?.module_physical === true || isIndustryPhysical
  // @ts-ignore
  const isDigital = (org?.module_digital !== false || profile?.organizations?.module_digital !== false) && !isIndustryPhysical

  const renderContent = () => {
    if (userRole === 'staff_cs') {
      return <DashboardCS {...dashboardProps} />
    }

    if (userRole === 'staff_warehouse') {
      return <DashboardWarehouse {...dashboardProps} />
    }

    if (userRole === 'staff_design') {
      return (
        <Suspense fallback={<div className="p-8">Memuat Dashboard Desain...</div>}>
          <DashboardDesign {...dashboardProps} />
        </Suspense>
      )
    }

    if (userRole === 'staff_production') {
      return (
        <Suspense fallback={<div className="p-8">Memuat Dashboard Produksi...</div>}>
          <DashboardProduction {...dashboardProps} />
        </Suspense>
      )
    }

    if (userRole === 'staff_shipping') {
      return (
        <Suspense fallback={<div className="p-8">Memuat Dashboard Shipping...</div>}>
          <DashboardShipping {...dashboardProps} />
        </Suspense>
      )
    }

    if (isDigital && isPhysical) {
      return <DashboardHybrid {...dashboardProps} />
    }

    if (isPhysical) {
      return <DashboardPhysical {...dashboardProps} />
    }

    return <DashboardDigital {...dashboardProps} />
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isImpersonating && <ImpersonationBanner orgName={orgName} />}
      {latestBroadcast && (
        <div className="pt-4 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <GlobalBroadcastBanner broadcast={latestBroadcast} />
        </div>
      )}
      {renderContent()}
    </div>
  )
}
