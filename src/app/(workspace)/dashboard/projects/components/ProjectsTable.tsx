'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Filter, SortAsc, SortDesc } from 'lucide-react'

export default function ProjectsTable({ projects, pendingRevisionsCount = {}, paidTermins = {}, userRole = 'staff' }: { projects: any[], pendingRevisionsCount?: Record<string, number>, paidTermins?: Record<string, string[]>, userRole?: string }) {
  const isExecutor = ['staff_executor', 'staff_digital', 'staff_physical', 'staff_design', 'staff_production', 'staff_warehouse', 'staff_shipping'].includes(userRole || '');
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortOption, setSortOption] = useState<string>('newest') // newest, oldest, deadline_asc, deadline_desc

  // Filter
  const filteredProjects = projects.filter(p => {
    // Khusus staff_design, jangan tampilkan proyek yang sudah masuk tahap produksi/finishing
    if (userRole === 'staff_design') {
      const productionStatuses = ['production', 'production_in_progress', 'finishing', 'qc_pending'];
      if (productionStatuses.includes(p.status)) return false;
    }

    if (filterStatus === 'all') return true
    if (filterStatus === 'briefing' && p.status === 'briefing') return true
    if (filterStatus === 'design' && p.status === 'design') return true
    if (filterStatus === 'development' && p.status === 'development') return true
    if (filterStatus === 'revision' && (p.status === 'revision' || p.status === 'revision_pending')) return true
    return false
  })

  // Sort
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortOption === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (sortOption === 'deadline_asc') {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    }
    if (sortOption === 'deadline_desc') {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
    }
    return 0
  })

  return (
    <div className="bg-white rounded-[20px] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Controls Bar */}
      <div className="p-4 border-b border-black/5 bg-[#F8F9FA]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter size={16} className="text-blue-500" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="briefing">Briefing</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="revision">Dalam Revisi</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <SortAsc size={16} className="text-emerald-500" />
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="newest">Paling Baru</option>
              <option value="oldest">Paling Lama</option>
              <option value="deadline_asc">Deadline Terdekat</option>
              <option value="deadline_desc">Deadline Terlama</option>
            </select>
          </div>
        </div>
        <div className="text-xs font-bold text-gray-400">
          Menampilkan {sortedProjects.length} Proyek
        </div>
      </div>

      <div className="overflow-x-auto p-2">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
              <th className="py-3 px-4 rounded-tl-[12px]">Klien & Proyek</th>
              <th className="py-3 px-4">Tipe Jasa</th>
              {!['staff_executor', 'staff_digital'].includes(userRole) && <th className="py-3 px-4">Harga / Status Pembayaran</th>}
              <th className="py-3 px-4">Progress (%)</th>
              <th className="py-3 px-4">Tahapan (Status)</th>
              <th className="py-3 px-4 text-right rounded-tr-[12px]"></th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((proj) => (
              <tr key={proj.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors relative group">
                <td className="py-4 px-4">
                  <Link href={`/dashboard/project/${proj.id}`} className="absolute inset-0 z-0" aria-label={`Detail Proyek ${proj.title}`}></Link>
                  <div className="font-extrabold text-[#111827] relative z-10">{proj.title}</div>
                  <div className="text-xs font-medium text-[#4B5563] mt-1 relative z-10">👤 {proj.profiles?.full_name || 'Klien'}</div>
                  {proj.deadline && (
                    <div className={`text-[10px] font-bold mt-1 relative z-10 inline-block px-2 py-0.5 rounded ${new Date(proj.deadline) < new Date() ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                      Deadline: {new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 relative z-10">
                  <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap inline-block">
                    {proj.service_type}
                  </span>
                </td>
                {(userRole === 'staff_cs' || userRole === 'staff_finance' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff_ops') && (
                  <td className="py-4 px-4 relative z-10">
                    <div className="text-sm font-bold text-[#111827]">Rp {proj.total_price.toLocaleString('id-ID')}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                      proj.payment_status === 'paid' ? 'text-emerald-600' : 
                      (paidTermins[proj.id] && paidTermins[proj.id].length > 0) ? 'text-blue-600' : 
                      'text-amber-600'
                    }`}>
                      {proj.payment_status === 'paid' ? 'LUNAS' : 
                       (paidTermins[proj.id] && paidTermins[proj.id].length > 0) ? `DIBAYAR: ${paidTermins[proj.id].join(', ')}` : 
                       'BELUM BAYAR'}
                    </div>
                  </td>
                )}
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
                    proj.status === 'revision_pending' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    proj.status === 'revision' ? 'bg-amber-50 text-amber-600' :
                    'text-[#4B5563]'
                  }`}>
                    {proj.status === 'revision_pending' ? 'Minta Revisi' : 
                     proj.status === 'revision' ? 'Sedang Revisi' : proj.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right relative z-10">
                  {pendingRevisionsCount[proj.id] > 0 && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full shadow-sm animate-pulse" title={`${pendingRevisionsCount[proj.id]} Revisi Baru`}>
                      {pendingRevisionsCount[proj.id]}
                    </div>
                  )}
                  {userRole !== 'staff_ops' && (
                    <Link href={`/dashboard/project/${proj.id}`} className="bg-white border border-black/10 hover:bg-[#F8F9FA] text-[#111827] font-bold px-4 py-2 rounded-[8px] text-xs transition-all shadow-sm whitespace-nowrap relative z-10 inline-block">
                      {isExecutor ? 'Lihat Detail' : 'Kelola'}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {sortedProjects.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  <p className="text-sm font-bold">Tidak ada proyek yang sesuai filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
