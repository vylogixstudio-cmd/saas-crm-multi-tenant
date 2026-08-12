'use client'

import React, { useState } from 'react'
import { Box, PackageCheck, Search, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { updatePackingStatus } from './actions'

export default function PackingClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleFinishPacking = async (projectId: string) => {
    setIsUpdating(true)
    const res = await updatePackingStatus(projectId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Pesanan selesai dipacking dan siap dikirim!')
      setProjects(projects.filter(p => p.id !== projectId))
    }
    setIsUpdating(false)
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Box size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Antrean Packing</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Barang lolos QC yang harus dibungkus.</p>
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
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
           </div>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-8 rounded-[24px] border border-gray-200 text-center flex flex-col items-center shadow-sm">
             <PackageCheck size={36} className="text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">Tidak Ada Antrean Packing</h3>
             <p className="text-gray-500 text-xs mt-1">Semua pesanan yang lolos QC sudah dibungkus.</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="bg-white p-5 rounded-[20px] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between">
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                      #{project.id.split('-')[0].toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {(() => {
                        const detail = Array.isArray(project.project_physical_details) ? project.project_physical_details[0] : project.project_physical_details;
                        return detail?.item_type || 'Custom';
                      })()}
                    </span>
                </div>
                
                <h3 className="font-extrabold text-gray-900 text-base">{project.title}</h3>
                <p className="text-xs font-medium text-gray-600 mt-0.5">Klien: {project.profiles?.full_name}</p>
                
                <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex gap-4">
                      {(() => {
                        const detail = Array.isArray(project.project_physical_details) ? project.project_physical_details[0] : project.project_physical_details;
                        return (
                          <>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Kuantitas</p>
                              <p className="text-xs font-bold text-gray-900 mt-0.5">{detail?.quantity || 1} Pcs</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ukuran</p>
                              <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">{detail?.size_notes || '-'}</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Catatan Bahan/Tambahan</p>
                              <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">{detail?.material_notes || '-'}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex shrink-0">
                <button 
                  onClick={() => handleFinishPacking(project.id)}
                  disabled={isUpdating}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 md:py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> Selesai Di-packing
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  )
}
