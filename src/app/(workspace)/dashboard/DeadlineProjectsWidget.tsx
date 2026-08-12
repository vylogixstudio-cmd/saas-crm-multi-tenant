import Link from 'next/link'
import { Calendar, AlertCircle } from 'lucide-react'

interface ProjectData {
  id: string
  title: string
  deadline: string | null
  status: string
  profiles: { full_name: string; email: string } | null
  project_physical_details?: any
}

export default function DeadlineProjectsWidget({ projects }: { projects: ProjectData[] }) {
  // Filter active projects with deadline and sort by deadline ascending
  const upcomingProjects = projects
    .filter(p => {
      if (!p.deadline || p.status === 'completed' || p.status === 'selesai' || p.status === 'shipping') return false
      
      const physicalDetails = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details
      if (physicalDetails?.shipping_status === 'DELIVERED' || physicalDetails?.shipping_status === 'SHIPPED') {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5) // Ambil 5 teratas

  return (
    <div className="bg-white p-6 rounded-[20px] border border-black/5 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-[12px] text-rose-500">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#111827]">Deadline Terdekat</h3>
            <p className="text-xs text-[#4B5563] mt-0.5">Pantau proyek aktif yang mendekati tenggat waktu</p>
          </div>
        </div>
        <Link href="/dashboard/projects" className="text-xs font-bold text-[#2563EB] hover:underline">
          Lihat Semua
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {upcomingProjects.length > 0 ? (
          upcomingProjects.map(proj => {
            const deadlineDate = new Date(proj.deadline!)
            const today = new Date()
            const diffTime = deadlineDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let statusColor = 'text-[#4B5563] bg-[#F8F9FA]'
            if (diffDays <= 3 && diffDays >= 0) statusColor = 'text-rose-600 bg-rose-50 border-rose-100'
            else if (diffDays < 0) statusColor = 'text-white bg-rose-500' // Terlewat
            else if (diffDays <= 7) statusColor = 'text-amber-600 bg-amber-50 border-amber-100'

            return (
              <div key={proj.id} className="flex flex-col sm:flex-row justify-between p-4 bg-[#F8F9FA] rounded-[16px] border border-black/5 gap-4">
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-[#111827]">{proj.title}</h4>
                  <p className="text-xs text-[#4B5563] mt-1 flex items-center gap-1">
                    👤 {proj.profiles?.full_name || 'Klien'}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end justify-center">
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${statusColor} mb-1 flex items-center gap-1`}>
                    {diffDays < 0 ? <AlertCircle size={12} /> : null}
                    {diffDays < 0 
                      ? `Terlewat ${Math.abs(diffDays)} hari`
                      : diffDays === 0 ? 'Hari ini'
                      : `${diffDays} hari lagi`
                    }
                  </span>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                    {deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
            <Calendar size={40} className="text-[#9CA3AF] mb-3" />
            <p className="text-sm font-bold text-[#4B5563]">Belum ada data deadline</p>
            <p className="text-xs text-[#6B7280] mt-1 max-w-[200px]">Atur tanggal deadline saat membuat proyek baru.</p>
          </div>
        )}
      </div>
    </div>
  )
}
