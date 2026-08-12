'use client'

import React, { useState } from 'react'
import { Factory, Activity, CheckCircle, Package, Clock, LogOut, ArrowRight, ClipboardList, ShieldCheck, Wrench, Calendar, User, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function DashboardProduction({ 
  orgName, 
  projects,
  recentLogs
}: any) {
  const router = useRouter()
  const supabase = createClient()
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filter projects by specific production statuses (ignore category for now to catch miscategorized items)
  const antreanProduksi = projects?.filter((p: any) => p.status === 'production' || p.status === 'Dalam Antrean Mesin') || []
  const sedangDikerjakan = projects?.filter((p: any) => p.status === 'production_in_progress' || p.status === 'Proses Cetak') || []
  const siapQC = projects?.filter((p: any) => p.status === 'finishing' || p.status === 'qc_pending' || p.status === 'Quality Control') || []

  // Filter logs for production related activities if needed, or just take top 5
  const productionLogs = recentLogs?.slice(0, 5) || []

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full -mr-20 -mt-20 opacity-70 blur-3xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Factory size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Produksi</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Sistem Operasional Pabrik / Bengkel • {orgName}</p>
          </div>
        </div>
        <div className="relative z-10">
           <button onClick={handleLogout} className="px-5 py-2.5 bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-gray-100 shadow-sm">
              <LogOut size={18} /> Keluar
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-amber-50/30 p-6 rounded-[32px] border border-amber-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-200/50 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-white text-amber-500 rounded-xl shadow-sm border border-amber-100">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-gray-700">Menunggu Diproses</h3>
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-black text-amber-600 tracking-tighter">{antreanProduksi.length}</span>
            <p className="text-sm text-gray-500 mt-2 font-medium">Tiket siap masuk mesin cetak</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50/30 p-6 rounded-[32px] border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-white text-blue-500 rounded-xl shadow-sm border border-blue-100">
              <Activity size={24} />
            </div>
            <h3 className="font-bold text-gray-700">Sedang Dikerjakan</h3>
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-black text-blue-600 tracking-tighter">{sedangDikerjakan.length}</span>
            <p className="text-sm text-gray-500 mt-2 font-medium">Proses perakitan & cetak berjalan</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-[32px] border border-emerald-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl group-hover:bg-emerald-200/50 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-white text-emerald-500 rounded-xl shadow-sm border border-emerald-100">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-gray-700">Finishing / Siap QC</h3>
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-black text-emerald-600 tracking-tighter">{siapQC.length}</span>
            <p className="text-sm text-gray-500 mt-2 font-medium">Siap diperiksa untuk dikirim</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Links & Tools */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2">
               <Package size={20} className="text-indigo-600"/> Alat Kerja Utama
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard/production" className="group bg-indigo-50/30 p-5 rounded-[24px] border border-indigo-100 hover:bg-indigo-50 transition-colors flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Factory size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-gray-900 text-lg">Antrean Produksi</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Kanban board manajemen tugas cetak</p>
                </div>
              </Link>
              
              <Link href="/dashboard/production/qc" className="group bg-emerald-50/30 p-5 rounded-[24px] border border-emerald-100 hover:bg-emerald-50 transition-colors flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-gray-900 text-lg">Quality Control (QC)</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Luluskan barang sebelum dikirim</p>
                </div>
              </Link>

              <Link href="/dashboard/inventory/outbound" className="group bg-orange-50/30 p-5 rounded-[24px] border border-orange-100 hover:bg-orange-50 transition-colors flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Package size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-gray-900 text-lg">Request Bahan</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Catat material gudang yang dipakai</p>
                </div>
              </Link>
              
              <Link href="/dashboard/production/maintenance" className="group bg-rose-50/30 p-5 rounded-[24px] border border-rose-100 hover:bg-rose-50 transition-colors flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                    <Wrench size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-gray-900 text-lg">Mesin & Perawatan</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Laporan kendala & tiket maintenance</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <ClipboardList size={20} className="text-blue-500" /> Log Aktivitas
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Terbaru</span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {productionLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50 min-h-[200px]">
                <ClipboardList size={40} className="text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Belum ada aktivitas tercatat hari ini.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {productionLogs.map((log: any, index: number) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                        <User size={16} />
                      </div>
                      {index !== productionLogs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-100"></div>
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-bold text-gray-900 text-sm truncate">{log.actor_email?.split('@')[0] || 'Sistem'}</span>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0 bg-gray-50 px-2 py-0.5 rounded-md">
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{log.action?.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{log.target_type} - {log.target_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
             <button onClick={() => setIsLogModalOpen(true)} className="text-sm font-bold text-blue-600 hover:text-blue-700">Lihat Semua Log →</button>
          </div>
        </div>
        
      </div>

      {/* ALL LOGS MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50 rounded-t-[32px]">
                 <div>
                   <h3 className="font-extrabold text-2xl text-blue-900 flex items-center gap-2"><ClipboardList/> Semua Log Aktivitas</h3>
                   <p className="text-sm font-medium text-blue-700 mt-1">50 Aktivitas terakhir dalam organisasi Anda.</p>
                 </div>
                 <button onClick={() => setIsLogModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-700 shadow-sm border border-gray-200">
                    <X size={20} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 rounded-b-[32px]">
                {recentLogs?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Tidak ada log.</p>
                ) : (
                  recentLogs?.map((log: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0 border border-gray-200">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <span className="font-bold text-gray-900 text-sm">{log.actor_email || 'Sistem'}</span>
                          <span className="text-[10px] font-bold text-gray-400 shrink-0 bg-gray-100 px-2 py-0.5 rounded-md">
                            {new Date(log.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">{log.action?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{log.target_type} - {log.target_name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
