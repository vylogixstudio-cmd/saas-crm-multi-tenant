import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import CompletedProjectsClient from './CompletedProjectsClient'

export default async function CompletedProjectsPage() {
  const { user, profile, orgId: currentOrgId, org, role: userRole, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) {
    redirect('/login')
  }

  if (isSuspended) {
    redirect('/suspended')
  }

  const isDesigner = userRole === 'staff_design' || userRole === 'staff_physical'
  const isExecutor = ['staff_executor', 'staff_digital', 'staff_physical', 'staff_design', 'staff_production', 'staff_shipping', 'staff_warehouse'].includes(userRole || '')

  const isIndustryPhysical = org?.industry_type === 'PHYSICAL' || org?.industry_type === 'MANUFACTURING'
  const isPhysical = org?.module_physical === true || isIndustryPhysical
  const isDigital = org?.module_digital !== false && !isIndustryPhysical
  const isHybrid = isDigital && isPhysical

  // Filter statuses:
  const allowedStatuses = isDesigner
    ? [
        'production',
        'production_in_progress',
        'finishing',
        'qc_pending',
        'packing_completed',
        'ready_to_ship',
        'shipped',
        'completed',
        'selesai',
        'cancelled',
      ]
    : ['completed', 'selesai', 'cancelled']

  // Fetch projects with both detail relations
  let projectsQuery = supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, email),
      internal_notes (content),
      project_digital_details (domain_name, preview_url, platform),
      project_physical_details (item_type, quantity, shipping_courier, tracking_number, shipping_status, shipping_address)
    `)
    .in('status', allowedStatuses)
    .order('created_at', { ascending: false })

  if (currentOrgId) {
    projectsQuery = projectsQuery.eq('organization_id', currentOrgId)
  } else {
    projectsQuery = projectsQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: projects } = await projectsQuery

  const completedProjectIds = projects?.map(p => p.id) || []
  let paidTermins: Record<string, string[]> = {}

  if (completedProjectIds.length > 0) {
    const { data: invoicesData } = await supabase
      .from('fin_invoices')
      .select('project_id, termin_label, title')
      .eq('status', 'PAID')
      .in('project_id', completedProjectIds)

    if (invoicesData) {
      paidTermins = invoicesData.reduce((acc, curr) => {
        if (!acc[curr.project_id]) acc[curr.project_id] = []
        const label = curr.termin_label || (curr.title.includes('Termin 1') ? 'Termin 1' : curr.title.includes('Termin 2') ? 'Termin 2' : curr.title.includes('Termin 3') ? 'Termin 3' : '')
        if (label && !acc[curr.project_id].includes(label)) {
          acc[curr.project_id].push(label)
        }
        return acc
      }, {} as Record<string, string[]>)
    }
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-black/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isHybrid ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isHybrid ? 'Hybrid Archives' : isDesigner ? 'Design & Production' : 'Project Archives'}
              </span>
            </div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <ClipboardList size={28} className={isHybrid ? 'text-fuchsia-600' : 'text-blue-600'} />
              {isHybrid ? 'Riwayat Proyek & Pesanan Selesai' : isDesigner ? 'Riwayat Pesanan (Desain ACC & Selesai)' : 'Riwayat Proyek Selesai'}
            </h1>
            <p className="text-[#4B5563] text-xs sm:text-sm mt-1">
              Daftar seluruh arsip proyek digital dan pesanan fisik yang telah rampung & terkirim.
            </p>
          </div>
        </div>

        {/* Client Interactive View (Cards + Tabs + Table) */}
        <CompletedProjectsClient 
          projects={projects || []}
          paidTermins={paidTermins}
          userRole={userRole || 'admin'}
          isDesigner={isDesigner}
          isExecutor={isExecutor}
          isHybrid={isHybrid}
        />

      </div>
    </div>
  )
}

