import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { LifeBuoy } from 'lucide-react'
import RevisionsTable from './components/RevisionsTable'

export const metadata = {
  title: 'Pusat Revisi - CRM Panel',
}

export default async function RevisionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgFilter = profile?.organization_id

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('id, title, status, profiles:client_id(full_name)')
    .eq('organization_id', orgFilter)

  // Filter out updates manually if .not() with array doesn't work well
  const filteredProjects = projects?.filter(p => !['update_pengajuan', 'maintenance', 'update_deploy'].includes(p.status)) || []

  const projectIds = filteredProjects.map(p => p.id)

  let revisions: any[] = []
  if (projectIds.length > 0) {
    const { data: revData } = await supabaseAdmin
      .from('project_revisions')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
    revisions = revData || []
  }

  const enrichedRevisions = revisions.map(rev => {
    const proj = filteredProjects.find(p => p.id === rev.project_id)
    return {
      ...rev,
      project_title: proj?.title || 'Unknown Project',
      client_name: (proj?.profiles as any)?.full_name || 'Unknown Client',
    }
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <LifeBuoy size={28} className="text-rose-500" /> Pusat Revisi (Tickets)
            </h1>
            <p className="text-[#4B5563] text-sm mt-1">Kelola semua permintaan revisi dan komplain klien dari satu tempat.</p>
          </div>
        </div>

        <RevisionsTable revisions={enrichedRevisions} />
      </div>
    </div>
  )
}
