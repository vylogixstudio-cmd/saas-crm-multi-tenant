import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Clock, LayoutTemplate, MonitorSmartphone, Code2, CheckCircle2, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Task Board (Kanban) - CRM Panel',
}

const KANBAN_COLUMNS = [
  { id: 'briefing', label: 'Briefing & Perencanaan', icon: LayoutTemplate, color: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
  { id: 'design', label: 'Desain UI/UX', icon: MonitorSmartphone, color: 'border-purple-200 bg-purple-50', text: 'text-purple-700' },
  { id: 'development', label: 'Development', icon: Code2, color: 'border-blue-200 bg-blue-50', text: 'text-blue-700' },
  { id: 'completed', label: 'Selesai', icon: CheckCircle2, color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
]

export default async function TaskBoardPage() {
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

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, progress_percentage, deadline, service_type, profiles:client_id(full_name)')
    .eq('organization_id', orgFilter)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  const getProjectsByStatus = (status: string) => {
    return (projects || []).filter(p => p.status === status)
  }

  return (
    <div className="p-4 sm:p-8 h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans']">Task Board</h1>
          <p className="text-sm text-[#4B5563] mt-1">Pantau seluruh pergerakan proyek digital dalam format Kanban.</p>
        </div>
      </div>

      {/* Kanban Board Container (Scrollable Horizontally) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {KANBAN_COLUMNS.map(column => {
            const colProjects = getProjectsByStatus(column.id)
            const Icon = column.icon
            
            return (
              <div key={column.id} className="w-[320px] flex flex-col h-full">
                {/* Column Header */}
                <div className={`p-4 rounded-t-2xl border-t border-l border-r border-b-4 ${column.color} mb-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={column.text} />
                    <h3 className={`font-bold text-sm ${column.text}`}>{column.label}</h3>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/50 ${column.text}`}>
                    {colProjects.length}
                  </span>
                </div>

                {/* Column Body (Scrollable Vertically) */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {colProjects.length > 0 ? colProjects.map(project => (
                    <Link 
                      href={`/dashboard/project/${project.id}`} 
                      key={project.id}
                      className="block bg-white p-4 rounded-xl border border-black/5 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                          {project.service_type}
                        </span>
                        {project.deadline && (
                          <span className={`text-[10px] font-mono font-medium px-2 py-1 rounded-md flex items-center gap-1 ${new Date(project.deadline) < new Date() ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-500'}`}>
                            {new Date(project.deadline) < new Date() && <AlertCircle size={10} />}
                            {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-sm text-gray-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Klien: <span className="font-medium text-gray-700">{(project.profiles as any)?.full_name}</span>
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="w-full mr-4">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{project.progress_percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${project.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center text-gray-400">
                      <p className="text-xs font-medium">Belum ada proyek</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
