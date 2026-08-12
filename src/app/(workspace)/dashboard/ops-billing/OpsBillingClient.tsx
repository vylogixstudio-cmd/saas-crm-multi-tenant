'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, CreditCard, Search, ExternalLink } from 'lucide-react'

type Project = {
  id: string
  title: string
  service_type: string
  status: string
  total_price: number
  payment_status: string
  created_at: string
  client?: { full_name: string | null; email: string | null } | null
}

type TabType = 'all' | 'nunggak' | 'partial' | 'paid'

export default function OpsBillingClient({ projects }: { projects: Project[] }) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mapping status pembayaran internal ke tampilan badge
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Lunas</span>
      case 'partial':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Menunggu Pelunasan</span>
      case 'pending':
      case 'unpaid':
      default:
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Nunggak (Belum DP)</span>
    }
  }

  // Filter projects
  const filteredProjects = projects.filter(p => {
    // Tab filter
    if (activeTab === 'nunggak' && p.payment_status !== 'pending' && p.payment_status !== 'unpaid') return false
    if (activeTab === 'partial' && p.payment_status !== 'partial') return false
    if (activeTab === 'paid' && p.payment_status !== 'paid') return false

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchTitle = p.title.toLowerCase().includes(q)
      const matchClient = p.client?.full_name?.toLowerCase().includes(q)
      if (!matchTitle && !matchClient) return false
    }

    return true
  })

  // Calculate totals
  const totalNunggak = projects.filter(p => p.payment_status === 'pending' || p.payment_status === 'unpaid').length
  const totalPartial = projects.filter(p => p.payment_status === 'partial').length
  const totalPaid = projects.filter(p => p.payment_status === 'paid').length

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex bg-gray-100/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Semua Proyek ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('nunggak')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'nunggak' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-rose-600'
            }`}
          >
            🔴 Nunggak ({totalNunggak})
          </button>
          <button
            onClick={() => setActiveTab('partial')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'partial' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-amber-600'
            }`}
          >
            🟡 Menunggu Pelunasan ({totalPartial})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'paid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            🟢 Lunas ({totalPaid})
          </button>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <input
            type="text"
            placeholder="Cari proyek / klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                <th className="py-4 px-6 rounded-tl-[12px]">Klien & Proyek</th>
                <th className="py-4 px-6">Tipe Jasa</th>
                <th className="py-4 px-6">Total Biaya</th>
                <th className="py-4 px-6 text-right rounded-tr-[12px]">Status Tagihan</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((proj) => (
                <tr key={proj.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-extrabold text-[#111827]">{proj.title}</div>
                    <div className="text-[12px] font-medium text-[#6B7280] mt-0.5">
                      {proj.client?.full_name || 'Tanpa Klien'}
                    </div>
                  </td>
                  <td className="py-4 px-6 align-middle">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {proj.service_type}
                    </span>
                  </td>
                  <td className="py-4 px-6 align-middle">
                    <div className="text-sm font-bold text-[#111827]">
                      Rp {proj.total_price.toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="py-4 px-6 align-middle text-right">
                    {getPaymentBadge(proj.payment_status)}
                  </td>
                </tr>
              ))}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard size={48} className="text-gray-300 mb-3" />
                      <p className="font-bold text-gray-900">Tidak ada data tagihan</p>
                      <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
