'use client'

import React, { useState } from 'react'
import { PackageCheck, Search, MapPin, Truck, CalendarCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HistoryClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects] = useState(initialProjects)
  const [search, setSearch] = useState('')

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <PackageCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Riwayat Pengiriman</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Daftar paket yang sudah sukses diterima oleh klien.</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Cari pesanan..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
           />
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-[24px] border border-gray-200 text-center flex flex-col items-center shadow-sm">
             <PackageCheck size={48} className="text-gray-300 mb-4" />
             <h3 className="text-lg font-bold text-gray-900">Belum Ada Riwayat</h3>
             <p className="text-gray-500 text-sm mt-1">Paket yang telah dikonfirmasi diterima akan muncul di sini.</p>
          </div>
        ) : (
          filteredProjects.map(project => {
            const detail = Array.isArray(project.project_physical_details) ? project.project_physical_details[0] : project.project_physical_details
            
            return (
            <div key={project.id} className="bg-white p-5 rounded-[20px] border border-gray-200 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                <CalendarCheck size={12} /> Terkirim
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  #{project.id.split('-')[0].toUpperCase()}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-3">{project.title}</h3>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">Klien: {project.profiles?.full_name}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-start gap-3">
                  <Truck size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Kurir & Resi</p>
                    <p className="text-xs font-bold text-gray-900">{detail?.shipping_courier || '-'}</p>
                    <p className="text-xs font-mono text-gray-600 mt-0.5">{detail?.tracking_number || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alamat Pengiriman</p>
                    <p className="text-xs font-bold text-gray-900 leading-relaxed">
                      {detail?.shipping_address || 'Tidak ada alamat. (Diambil di tempat)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-medium text-gray-400">
                  Diperbarui pada: {formatDate(project.updated_at)}
                </p>
                
                <Link 
                  href={`/dashboard/project/${project.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Lihat Detail <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )})
        )}
      </div>

    </div>
  )
}
