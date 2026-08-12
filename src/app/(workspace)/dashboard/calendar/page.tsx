import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'
import { Calendar } from 'lucide-react'

export default async function CalendarPage() {
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

  // Fetch active projects that have deadlines
  let projectsQuery = supabase
    .from('projects')
    .select('id, title, deadline, status, project_physical_details(production_deadline)')
    .not('status', 'in', '("completed","cancelled")')

  if (currentOrgId) {
    projectsQuery = projectsQuery.eq('organization_id', currentOrgId)
  } else {
    projectsQuery = projectsQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: rawProjects } = await projectsQuery

  const projects = (rawProjects || []).map((p: any) => {
    const physical = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details;
    return {
      id: p.id,
      title: p.title,
      deadline: p.deadline,
      production_deadline: physical?.production_deadline || null,
      status: p.status
    }
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Calendar size={28} className="text-[#2563EB]" /> Kalender Deadline
            </h1>
            <p className="text-[#4B5563] text-sm mt-1">Pantau jadwal dan tenggat waktu proyek secara visual.</p>
          </div>
        </div>

        <CalendarClient projects={projects || []} />
      </div>
    </div>
  )
}
