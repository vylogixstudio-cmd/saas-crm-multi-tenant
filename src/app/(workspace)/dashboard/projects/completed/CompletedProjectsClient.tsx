'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Globe, Package, Truck, ExternalLink, CheckCircle, 
  Search, Filter, DollarSign, ArrowUpRight, RefreshCw, XCircle 
} from 'lucide-react'

interface CompletedProjectsClientProps {
  projects: any[]
  paidTermins: Record<string, string[]>
  userRole: string
  isDesigner: boolean
  isExecutor: boolean
  isHybrid: boolean
}

export default function CompletedProjectsClient({
  projects = [],
  paidTermins = {},
  userRole,
  isDesigner,
  isExecutor,
  isHybrid
}: CompletedProjectsClientProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIGITAL' | 'PHYSICAL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Split projects
  const digitalProjects = projects.filter(p => p.project_category !== 'PHYSICAL')
  const physicalProjects = projects.filter(p => p.project_category === 'PHYSICAL')

  const totalDigitalIncome = digitalProjects.reduce((sum, p) => sum + Number(p.total_price || 0), 0)
  const totalPhysicalIncome = physicalProjects.reduce((sum, p) => sum + Number(p.total_price || 0), 0)
  const totalOverallIncome = projects.reduce((sum, p) => sum + Number(p.total_price || 0), 0)

  // Filtered by tab and search
  const filteredProjects = projects.filter(p => {
    const matchesTab = 
      activeTab === 'ALL' ? true :
      activeTab === 'DIGITAL' ? p.project_category !== 'PHYSICAL' :
      p.project_category === 'PHYSICAL'

    const matchesSearch = 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service_type?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const getStatusBadge = (proj: any) => {
    const status = proj.status
    const hasReturnHistory = (proj.internal_notes || []).some((n: any) => 
      n.content?.includes('[PENGIRIMAN ULANG RETUR]') || n.content?.includes('[KLAIM RETUR & KOMPLAIN]')
    )

    let badge = null

    switch (status) {
      case 'production':
        badge = <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">✅ Desain ACC (Produksi)</span>
        break
      case 'production_in_progress':
        badge = <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Sedang Produksi</span>
        break
      case 'finishing':
        badge = <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Finishing</span>
        break
      case 'qc_pending':
        badge = <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Quality Control</span>
        break
      case 'packing_completed':
      case 'ready_to_ship':
        badge = <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Siap Kirim</span>
        break
      case 'shipped':
        badge = <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Dalam Pengiriman</span>
        break
      case 'completed':
      case 'selesai':
        badge = <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Selesai</span>
        break
      case 'cancelled':
        badge = <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider rounded-md">❌ Dibatalkan</span>
        break
      default:
        badge = <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-md">{status}</span>
        break
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        {badge}
        {hasReturnHistory && status !== 'cancelled' && (
          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
            <RefreshCw size={10} /> Pernah Diretur
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      {/* 1. DUAL CATEGORY SUMMARY CARDS (KHUSUS HYBRID ATAU MULTI-PROJECT) */}
      {isHybrid && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* DIGITAL CARD */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[24px] shadow-lg shadow-blue-500/10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Globe size={80} /></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-[10px]"><Globe size={16} /></div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">Riwayat Proyek Digital</p>
            </div>
            <p className="text-2xl font-extrabold tracking-tight relative z-10">{digitalProjects.length} <span className="text-sm font-medium text-blue-200">proyek</span></p>
            <p className="text-xs text-blue-100 mt-1 font-medium relative z-10">Total Omset: <strong>Rp {totalDigitalIncome.toLocaleString('id-ID')}</strong></p>
          </div>

          {/* PHYSICAL CARD */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-[24px] shadow-lg shadow-orange-500/10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Package size={80} /></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-[10px]"><Package size={16} /></div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-100">Riwayat Pesanan Fisik</p>
            </div>
            <p className="text-2xl font-extrabold tracking-tight relative z-10">{physicalProjects.length} <span className="text-sm font-medium text-orange-200">pesanan</span></p>
            <p className="text-xs text-orange-100 mt-1 font-medium relative z-10">Total Omset: <strong>Rp {totalPhysicalIncome.toLocaleString('id-ID')}</strong></p>
          </div>

          {/* TOTAL OVERALL CARD */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[24px] shadow-lg shadow-emerald-500/10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><DollarSign size={80} /></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-[10px]"><CheckCircle size={16} /></div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Total Akumulasi Omset Selesai</p>
            </div>
            <p className="text-2xl font-extrabold tracking-tight relative z-10">Rp {totalOverallIncome.toLocaleString('id-ID')}</p>
            <p className="text-xs text-emerald-100 mt-1 font-medium relative z-10">Dari {projects.length} pesanan & proyek selesai</p>
          </div>

        </div>
      )}

      {/* 2. FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* TAB BUTTONS (HANYA MUNCUL JIKA HYBRID) */}
        {isHybrid ? (
          <div className="flex items-center p-1 bg-white border border-black/10 rounded-[14px] shadow-sm">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-[10px] text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('DIGITAL')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-bold transition-all ${
                activeTab === 'DIGITAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe size={14} /> Digital ({digitalProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('PHYSICAL')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-bold transition-all ${
                activeTab === 'PHYSICAL'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={14} /> Fisik & Kirim ({physicalProjects.length})
            </button>
          </div>
        ) : (
          <div></div>
        )}

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari proyek / klien / jasa..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-black/10 rounded-[12px] text-xs font-medium focus:outline-none focus:border-[#2563EB] shadow-sm"
          />
        </div>
      </div>

      {/* 3. TABLE RIWAYAT PESANAN */}
      <div className="bg-white rounded-[20px] border border-black/5 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                <th className="py-3.5 px-4 rounded-tl-[12px]">Klien & Proyek</th>
                <th className="py-3.5 px-4">Kategori & Tipe Jasa</th>
                <th className="py-3.5 px-4">Detail Pengiriman / Deliverable</th>
                {!isExecutor && <th className="py-3.5 px-4">Harga / Status</th>}
                <th className="py-3.5 px-4">Tahapan</th>
                <th className="py-3.5 px-4 text-right rounded-tr-[12px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((proj) => {
                const isPhys = proj.project_category === 'PHYSICAL'
                const physDetail = Array.isArray(proj.project_physical_details) ? proj.project_physical_details[0] : proj.project_physical_details
                const digDetail = Array.isArray(proj.project_digital_details) ? proj.project_digital_details[0] : proj.project_digital_details

                return (
                  <tr key={proj.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors relative group">
                    {/* KLIEN & JUDUL */}
                    <td className="py-4 px-4">
                      <Link href={`/dashboard/project/${proj.id}?source=completed`} className="absolute inset-0 z-0" aria-label={`Detail Proyek ${proj.title}`}></Link>
                      <div className="font-extrabold text-[#111827] text-sm relative z-10 flex items-center gap-2">
                        {proj.title}
                      </div>
                      <div className="text-xs font-medium text-[#4B5563] mt-1 relative z-10">
                        👤 {proj.profiles?.full_name || 'Klien'} <span className="text-[#9CA3AF]">({proj.profiles?.email})</span>
                      </div>
                    </td>

                    {/* KATEGORI & TIPE JASA */}
                    <td className="py-4 px-4 relative z-10">
                      <div className="flex flex-col gap-1.5 items-start">
                        {isPhys ? (
                          <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                            <Package size={11} /> Fisik
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                            <Globe size={11} /> Digital
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-700">
                          {proj.service_type}
                        </span>
                      </div>
                    </td>

                    {/* DETAIL PENGIRIMAN / DELIVERABLE */}
                    <td className="py-4 px-4 relative z-10">
                      {isPhys ? (
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Truck size={13} className="text-orange-600" />
                            <span>{physDetail?.shipping_courier || 'Kurir Ekspedisi'}</span>
                          </div>
                          {physDetail?.tracking_number && (
                            <div className="text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-max">
                              Resi: <strong className="text-gray-900">{physDetail.tracking_number}</strong>
                            </div>
                          )}
                          {physDetail?.shipping_address && (
                            <div className="text-[10px] text-gray-500 line-clamp-1 max-w-[220px]" title={physDetail.shipping_address}>
                              📍 {physDetail.shipping_address}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {digDetail?.domain_name ? (
                            <a 
                              href={digDetail.preview_url || `https://${digDetail.domain_name}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              🌐 {digDetail.domain_name} <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500 font-medium">Domain belum diatur</span>
                          )}
                          {digDetail?.platform && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium inline-block">
                              {digDetail.platform}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* HARGA / STATUS PEMBAYARAN */}
                    {!isExecutor && (
                      <td className="py-4 px-4 relative z-10">
                        <div className="text-sm font-extrabold text-[#111827]">Rp {proj.total_price.toLocaleString('id-ID')}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                          proj.status === 'cancelled' ? 'text-rose-600 font-extrabold' :
                          proj.payment_status === 'paid' ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                          {proj.status === 'cancelled' ? 'DIBATALKAN' : 'LUNAS'}
                        </div>
                      </td>
                    )}

                    {/* TAHAPAN STATUS */}
                    <td className="py-4 px-4 relative z-10">
                      {getStatusBadge(proj)}
                    </td>

                    {/* AKSI */}
                    <td className="py-4 px-4 text-right relative z-10">
                      <Link 
                        href={`/dashboard/project/${proj.id}?source=completed`} 
                        className="bg-white border border-black/10 hover:bg-[#111827] hover:text-white font-bold px-4 py-2 rounded-[10px] text-xs transition-all shadow-sm whitespace-nowrap inline-block"
                      >
                        Detail Proyek
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={isExecutor ? 5 : 6} className="py-16 text-center text-[#4B5563] font-medium text-sm">
                    Tidak ada riwayat pesanan yang cocok dengan filter.
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
