'use client'

import React, { useState } from 'react'
import { Activity, Clock, CheckCircle2, Factory, Printer, GripVertical, AlertTriangle } from 'lucide-react'
import { updateOrderStatus } from '../actions'

const COLUMNS = [
  'Menunggu Desain',
  'Menunggu ACC',
  'Dalam Antrean Mesin',
  'Proses Cetak',
  'Quality Control',
  'Siap Packing'
]

export default function ProgressClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    setIsUpdating(true)
    const res = await updateOrderStatus(projectId, newStatus)
    if (res?.error) {
      alert(res.error)
    } else {
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
    }
    setIsUpdating(false)
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Activity className="text-[#2563EB]" size={32} />
          Kanban Produksi (Update Progress)
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Pantau dan pindahkan status pesanan secara visual.</p>
      </div>

      {/* KANBAN BOARD SCROLLABLE AREA */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((columnStatus) => {
            const columnProjects = projects.filter(p => p.status === columnStatus)
            
            return (
              <div key={columnStatus} className="w-[300px] flex flex-col h-full bg-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                
                {/* COLUMN HEADER */}
                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
                  <h3 className="font-extrabold text-gray-800 text-sm">{columnStatus}</h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                    {columnProjects.length}
                  </span>
                </div>
                
                {/* COLUMN CARDS */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnProjects.map(project => {
                    const isOverdue = project.deadline && new Date(project.deadline) < new Date()
                    
                    return (
                      <div key={project.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#2563EB]/50 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            #{project.id.split('-')[0].toUpperCase()}
                          </span>
                          {isOverdue && (
                             <span title="Melewati Deadline"><AlertTriangle size={14} className="text-rose-500" /></span>
                          )}
                        </div>
                        
                        <h4 className="font-extrabold text-gray-900 text-sm leading-snug">{project.title}</h4>
                        <p className="text-xs font-medium text-gray-500 mt-1">{project.profiles?.full_name}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-1 rounded-md">
                            {project.project_physical_details?.[0]?.item_type || 'Custom'}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.project_physical_details?.[0]?.quantity || 1} Pcs
                          </span>
                        </div>

                        {/* STATUS MOVER */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                           <select 
                             disabled={isUpdating}
                             value={project.status}
                             onChange={(e) => handleUpdateStatus(project.id, e.target.value)}
                             className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                           >
                              {COLUMNS.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                              <option value="Selesai (Siap Kirim)">-- Lulus & Siap Kirim --</option>
                           </select>
                        </div>
                      </div>
                    )
                  })}
                  
                  {columnProjects.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-xs font-medium text-gray-400">Kosong</p>
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
