import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wrench } from 'lucide-react'

export default async function UpdatesProjectsPage() {
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
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, is_active, auto_suspend, license_expires_at')
      .eq('id', profile.organization_id)
      .single()

    const isExpired = org?.license_expires_at ? new Date() > new Date(org.license_expires_at) : false
    if (!org || org.is_active === false || (org.auto_suspend && isExpired)) {
      redirect('/suspended')
    }
    currentOrgId = org.id
  }

  // Fetch active projects that are in the update flow
  let projectsQuery = supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, email),
      project_revisions (id, description, created_at)
    `)
    .in('status', ['update_pengajuan', 'maintenance', 'update_deploy'])
    .order('updated_at', { ascending: false })

  if (currentOrgId) {
    projectsQuery = projectsQuery.eq('organization_id', currentOrgId)
  } else {
    projectsQuery = projectsQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: rawProjects } = await projectsQuery

  const projects = rawProjects?.map(p => {
    // Sort revisions by created_at descending to get the latest
    const sortedRevisions = p.project_revisions?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
    return {
      ...p,
      latest_revision: sortedRevisions.length > 0 ? sortedRevisions[0] : null
    }
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Wrench size={28} className="text-[#2563EB]" /> Update Proyek / Maintenance
            </h1>
            <p className="text-[#4B5563] text-sm mt-1">Daftar proyek yang sedang dalam masa garansi atau maintenance.</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                  <th className="py-3 px-4 rounded-tl-[12px]">Klien & Proyek</th>
                  <th className="py-3 px-4">Tipe Jasa</th>
                  <th className="py-3 px-4">Progress (%)</th>
                  <th className="py-3 px-4">Status Update</th>
                  <th className="py-3 px-4 text-right rounded-tr-[12px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {projects?.map((proj) => (
                  <tr key={proj.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors relative group">
                    <td className="py-4 px-4">
                      <Link href={`/dashboard/project/${proj.id}?source=updates`} className="absolute inset-0 z-0" aria-label={`Detail Proyek ${proj.title}`}></Link>
                      <div className="font-extrabold text-[#111827] relative z-10">{proj.title}</div>
                      <div className="text-xs font-medium text-[#4B5563] mt-1 relative z-10 flex flex-col gap-1">
                        <span>👤 {proj.profiles?.full_name || 'Klien'}</span>
                        {proj.latest_revision && (
                          <span className="text-rose-500 font-bold max-w-[200px] truncate" title={proj.latest_revision.description}>
                            Update: {proj.latest_revision.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 relative z-10">
                      <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {proj.service_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${proj.progress_percentage}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-[#4B5563]">{proj.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 relative z-10">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        proj.status === 'update_pengajuan' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        proj.status === 'maintenance' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        proj.status === 'update_deploy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'text-[#4B5563]'
                      }`}>
                        {proj.status === 'update_pengajuan' ? 'Dalam Pengajuan' : 
                         proj.status === 'maintenance' ? 'Maintenance' : 
                         proj.status === 'update_deploy' ? 'Deploy' : proj.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right relative z-10">
                      <Link href={`/dashboard/project/${proj.id}?source=updates`} className="bg-white border border-black/10 hover:bg-[#F8F9FA] text-[#111827] font-bold px-4 py-2 rounded-[8px] text-xs transition-all shadow-sm whitespace-nowrap inline-block relative z-20">
                        Kelola Update
                      </Link>
                    </td>
                  </tr>
                ))}

                {(!projects || projects.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#4B5563] font-medium text-sm">
                      Belum ada proyek dalam masa update.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
