'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Filter, SortAsc, MessageSquare, Edit } from 'lucide-react'
import ReplyRevisionModal from './ReplyRevisionModal'
import RevisionStatusSelect from '@/components/RevisionStatusSelect'

export default function RevisionsTable({ revisions }: { revisions: any[] }) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortOption, setSortOption] = useState<string>('newest')
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null)

  const filteredRevisions = revisions.filter(r => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pending' && r.status === 'Pending') return true
    if (filterStatus === 'proses' && r.status === 'Proses') return true
    if (filterStatus === 'selesai' && r.status === 'Selesai') return true
    return false
  })

  const sortedRevisions = [...filteredRevisions].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortOption === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return 0
  })

  return (
    <div className="bg-white rounded-[20px] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-black/5 bg-[#F8F9FA]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter size={16} className="text-rose-500" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="proses">Sedang Dikerjakan</option>
              <option value="selesai">Selesai (Resolved)</option>
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
            </select>
          </div>
        </div>
        <div className="text-xs font-bold text-gray-400">
          Menampilkan {sortedRevisions.length} Tiket
        </div>
      </div>

      <div className="overflow-x-auto p-2">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
              <th className="py-3 px-4 rounded-tl-[12px]">Waktu & Status</th>
              <th className="py-3 px-4">Judul Revisi</th>
              <th className="py-3 px-4">Klien & Proyek</th>
              <th className="py-3 px-4 text-right rounded-tr-[12px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedRevisions.map((rev) => {
              let statusColor = 'bg-gray-100 text-gray-600'
              if (rev.status === 'Pending') statusColor = 'bg-rose-50 text-rose-600 border border-rose-100'
              if (rev.status === 'Proses') statusColor = 'bg-blue-50 text-blue-600 border border-blue-100'
              if (rev.status === 'Selesai') statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100'

              return (
                <tr key={rev.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors relative group">
                  <td className="py-4 px-4 align-top w-[200px]">
                    <div className="text-xs font-mono font-medium text-gray-500 mb-2">
                      {new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${statusColor}`}>
                      {rev.status}
                    </span>
                    {rev.admin_reply && (
                      <div className="mt-2 text-[10px] flex items-center gap-1 font-bold text-emerald-600">
                        <MessageSquare size={12} /> Dijawab
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="font-extrabold text-[#111827] text-sm mb-1">{rev.title}</div>
                    <div className="text-xs text-[#4B5563] line-clamp-2">{rev.description}</div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-[#111827] text-sm">{rev.project_title}</div>
                    <div className="text-xs font-medium text-[#4B5563] mt-0.5">👤 {rev.client_name}</div>
                  </td>
                  <td className="py-4 px-4 text-right align-middle">
                    <div className="flex flex-col gap-2 items-end">
                      <RevisionStatusSelect revisionId={rev.id} currentStatus={rev.status} />
                      <button 
                        onClick={() => setSelectedRevision(rev)}
                        className="bg-white border border-black/10 hover:bg-[#F8F9FA] text-[#111827] font-bold px-4 py-2 rounded-[8px] text-xs transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5"
                      >
                        <Edit size={14} /> Jawab / Detail
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {sortedRevisions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400">
                  <p className="text-sm font-bold">Tidak ada revisi yang sesuai filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedRevision && (
        <ReplyRevisionModal 
          revision={selectedRevision} 
          isOpen={!!selectedRevision} 
          onClose={() => setSelectedRevision(null)} 
        />
      )}
    </div>
  )
}
