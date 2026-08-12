import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import CreateProjectModal from '@/components/CreateProjectModal'
import CreateHybridProjectModal from '@/components/CreateHybridProjectModal'
import ProjectsTable from './components/ProjectsTable'

export default async function ActiveProjectsPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()
  let currentOrgId: string | null = null

  // Get org id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, is_active, auto_suspend, license_expires_at, module_digital, module_physical, industry_type')
      .eq('id', profile.organization_id)
      .single()

    const isExpired = org?.license_expires_at ? new Date() > new Date(org.license_expires_at) : false
    if (!org || org.is_active === false || (org.auto_suspend && isExpired)) {
      redirect('/suspended')
    }
    currentOrgId = org.id
  }

  const userRole = profile?.role || 'staff_digital'

  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('module_digital, module_physical, industry_type')
    .eq('id', currentOrgId || '')
    .single()

  const isIndustryPhysical = currentOrg?.industry_type === 'PHYSICAL' || currentOrg?.industry_type === 'MANUFACTURING'
  const isPhysical = currentOrg?.module_physical === true || isIndustryPhysical
  const isDigital = currentOrg?.module_digital !== false && !isIndustryPhysical
  const isHybrid = isDigital && isPhysical

  // Fetch active projects
  let projectsQuery = supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, email)
    `)
    .not('status', 'in', '("completed","update_pengajuan","maintenance","update_deploy")')
    .order('created_at', { ascending: false })

  if (currentOrgId) {
    projectsQuery = projectsQuery.eq('organization_id', currentOrgId)
  } else {
    projectsQuery = projectsQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: projects } = await projectsQuery

  // Fetch clients for modal
  const { data: clientsList } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'client')
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false })

  // Fetch pending revisions for active projects
  const activeProjectIds = projects?.map(p => p.id) || []
  let pendingRevisionsCount: Record<string, number> = {}

  let paidTermins: Record<string, string[]> = {}

  if (activeProjectIds.length > 0) {
    const { data: revisionsData } = await supabase
      .from('project_revisions')
      .select('project_id')
      .eq('status', 'Pending')
      .in('project_id', activeProjectIds)

    if (revisionsData) {
      pendingRevisionsCount = revisionsData.reduce((acc, curr) => {
        acc[curr.project_id] = (acc[curr.project_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    const { data: invoicesData } = await supabase
      .from('fin_invoices')
      .select('project_id, termin_label, title')
      .eq('status', 'PAID')
      .in('project_id', activeProjectIds)

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

  // Fetch services for modal
  const { data: servicesList } = await supabase
    .from('agency_services')
    .select('id, name, organization_id')
    .eq('organization_id', currentOrgId)
    .order('name', { ascending: true })

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Briefcase size={28} className="text-[#2563EB]" /> Proyek Aktif
            </h1>
            <p className="text-[#4B5563] text-sm mt-1">Daftar semua proyek yang sedang berjalan.</p>
          </div>

          {['super_admin', 'admin', 'staff_cs'].includes(userRole) && (
            isHybrid ? (
              <CreateHybridProjectModal 
                clients={clientsList || []} 
                services={servicesList || []} 
              />
            ) : (
              <CreateProjectModal 
                clients={clientsList || []} 
                services={servicesList || []} 
              />
            )
          )}
        </div>

        <ProjectsTable 
          projects={projects || []} 
          pendingRevisionsCount={pendingRevisionsCount} 
          paidTermins={paidTermins} 
          userRole={userRole}
        />
      </div>
    </div>
  )
}
