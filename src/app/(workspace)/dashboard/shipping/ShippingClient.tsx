'use client'

import React, { useState } from 'react'
import { Truck, Search, CheckCircle2, Send, Package } from 'lucide-react'
import { toast } from 'sonner'
import { processShipping } from './actions'

export default function ShippingClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, projectId: string) => {
    e.preventDefault()
    setIsUpdating(projectId)
    
    const formData = new FormData(e.currentTarget)
    const res = await processShipping(projectId, formData)
    
    if (res.success) {
      toast.success('Informasi pengiriman berhasil disimpan!')
      setProjects(projects.filter(p => p.id !== projectId))
    } else {
      toast.error(res.error || 'Terjadi kesalahan.')
    }
    setIsUpdating(null)
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pengiriman & Resi</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Input resi kurir atau jadwalkan pengambilan paket.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari pesanan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
           </div>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-8 rounded-[24px] border border-gray-200 text-center flex flex-col items-center shadow-sm">
             <Package size={36} className="text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">Belum Ada Paket</h3>
             <p className="text-gray-500 text-xs mt-1">Tidak ada paket yang menunggu untuk dikirim.</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="bg-white p-5 rounded-[20px] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-5 items-start">
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                      #{project.id.split('-')[0].toUpperCase()}
                    </span>
                </div>
                <h3 className="font-extrabold text-gray-900 text-base">{project.title}</h3>
                <p className="text-xs font-medium text-gray-600 mt-0.5">Klien: {project.profiles?.full_name}</p>
                <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Alamat Pengiriman</p>
                    <p className="text-xs font-bold text-gray-900 leading-relaxed">
                      {(() => {
                        const detail = Array.isArray(project.project_physical_details) ? project.project_physical_details[0] : project.project_physical_details
                        return detail?.shipping_address || 'Tidak ada alamat. (Diambil di tempat)'
                      })()}
                    </p>
                </div>
              </div>

              <div className="w-full md:w-[400px] shrink-0 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <form onSubmit={(e) => handleSubmit(e, project.id)} className="space-y-3">
                  <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-2">Opsi Pengiriman</h4>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <input type="radio" name="delivery_type" value="courier" defaultChecked className="text-orange-600 focus:ring-orange-500" />
                      Kirim Via Kurir
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <input type="radio" name="delivery_type" value="pickup" className="text-orange-600 focus:ring-orange-500" />
                      Diambil Klien
                    </label>
                  </div>

                  <div className="pt-2 space-y-3 group-has-[input[value=pickup]:checked]:hidden">
                    <input 
                      type="text" 
                      name="shipping_courier" 
                      placeholder="Nama Ekspedisi (JNE, GoSend, dll)" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <input 
                      type="text" 
                      name="tracking_number" 
                      placeholder="Nomor Resi / Link Lacak" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isUpdating === project.id}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send size={16} /> Proses Pengiriman
                  </button>
                </form>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  )
}
