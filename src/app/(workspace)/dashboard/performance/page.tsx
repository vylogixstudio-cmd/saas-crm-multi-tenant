import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import PerformanceClient from './PerformanceClient'
import { BarChart2 } from 'lucide-react'

export default async function PerformancePage() {
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
    currentOrgId = profile.organization_id
  }

  // Fetch all active/recent physical projects for metrics
  let projectsQuery = supabase
    .from('projects')
    .select(`
      id, title, status, deadline, created_at, updated_at, project_category,
      project_physical_details ( quantity, shipping_status )
    `)
    .eq('project_category', 'PHYSICAL')

  if (currentOrgId) {
    projectsQuery = projectsQuery.eq('organization_id', currentOrgId)
  } else {
    projectsQuery = projectsQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: projects } = await projectsQuery

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <BarChart2 size={28} className="text-[#2563EB]" /> Laporan Kinerja
            </h1>
            <p className="text-[#4B5563] text-sm mt-1">Pantau efisiensi pabrik dan operasional minggu ini.</p>
          </div>
        </div>

        <PerformanceClient projects={projects || []} />
      </div>
    </div>
  )
}
