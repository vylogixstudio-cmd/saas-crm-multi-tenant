'use client'

import React, { useState } from 'react'
import { Boxes, Search, Plus, X, Clock, Factory, CheckCircle, Info, MessageSquare, Send, Calendar, Activity } from 'lucide-react'
import Link from 'next/link'
import { updateOrderStatus, addInternalNote } from './actions'

const COLUMNS = [
  { id: 'design', title: 'Menunggu Desain', statuses: ['briefing', 'design', 'revision', 'Menunggu Desain', 'Menunggu ACC'], color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { id: 'queue', title: 'Antrean Produksi', statuses: ['production', 'Dalam Antrean Mesin'], color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'progress', title: 'Sedang Dikerjakan', statuses: ['production_in_progress', 'Proses Cetak'], color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'finishing', title: 'Finishing / Siap QC', statuses: ['finishing', 'qc_pending', 'Quality Control'], color: 'bg-emerald-50 border-emerald-200 text-emerald-800' }
]

export default function ProductionClient({ initialProjects, userRole = 'staff' }: { initialProjects: any[], userRole?: string }) {
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  )

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedProject) return
    setIsUpdatingStatus(true)
    const res = await updateOrderStatus(selectedProject.id, newStatus)
    if (res.success) {
      const updated = { ...selectedProject, status: newStatus }
      setSelectedProject(updated)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
    } else {
      alert(res.error || 'Gagal mengubah status')
    }
    setIsUpdatingStatus(false)
  }

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProject || !noteContent.trim()) return
    setIsUpdatingStatus(true)
    
    const res = await addInternalNote(selectedProject.id, noteContent)
    
    if (res.success && res.note) {
      const updated = {
        ...selectedProject,
        internal_notes: [...(selectedProject.internal_notes || []), res.note]
      }
      setSelectedProject(updated)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setNoteContent('')
    } else {
      alert(res.error || 'Gagal mengirim catatan.')
    }
    setIsUpdatingStatus(false)
  }

  return (
    <div className="p-4 sm:p-8 h-[calc(100vh-80px)] flex flex-col space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Boxes className="text-emerald-600" size={32} />
            Pantau Produksi (Kanban)
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Geser atau klik tiket untuk mengupdate progres pekerjaan.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari Pesanan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
           </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max items-start">
          {COLUMNS.map(col => {
            const colProjects = filteredProjects.filter(p => col.statuses.includes(p.status))
            return (
              <div key={col.id} className={`w-80 flex flex-col max-h-full rounded-[24px] border border-gray-100 bg-gray-50/50`}>
                {/* Column Header */}
                <div className={`p-4 border-b border-gray-100 rounded-t-[24px] ${col.color.replace('text-', 'bg-').replace('50', '100/50')} bg-opacity-50`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`font-bold ${col.color.split(' ')[2]}`}>{col.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/60 text-xs font-black shadow-sm">{colProjects.length}</span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {colProjects.length === 0 ? (
                    <div className="text-center p-4 text-xs font-medium text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      Kosong
                    </div>
                  ) : colProjects.map(project => (
                    <div 
                      key={project.id} 
                      onClick={() => setSelectedProject(project)}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                          #{project.id.split('-')[0].toUpperCase()}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {project.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors leading-snug">{project.title}</h4>
                      <p className="text-xs text-gray-500 font-medium truncate">{project.profiles?.full_name}</p>
                      
                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const deadline = project.project_physical_details?.[0]?.production_deadline || project.deadline
                            const isOverdue = deadline && new Date(deadline) < new Date()
                            return (
                              <div className="flex items-center gap-1.5" title={deadline ? "Deadline" : "Waktu Dibuat"}>
                                <Clock size={14} className={isOverdue ? 'text-rose-500' : 'text-gray-400'} />
                                <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-gray-500'}>
                                  {deadline 
                                    ? new Date(deadline).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) 
                                    : new Date(project.created_at).toLocaleString('id-ID', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})
                                  }
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Factory size={14} />
                           {project.project_physical_details?.[0]?.quantity || 1} Pcs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DETAIL & UPDATE PROGRESS */}
      {selectedProject && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
               {/* MODAL HEADER */}
               <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50 rounded-t-[32px]">
                  <div>
                    <h3 className="font-extrabold text-2xl text-emerald-900">{selectedProject.title}</h3>
                    <p className="text-sm font-mono text-emerald-700 mt-1">#{selectedProject.id.split('-')[0].toUpperCase()} • {selectedProject.profiles?.full_name}</p>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-700 shadow-sm border border-gray-200">
                     <X size={20} />
                  </button>
               </div>
               
               {/* MODAL BODY */}
               <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* KOLOM KIRI: Detail & Spesifikasi */}
                  <div className="md:col-span-2 space-y-6">
                     
                     {/* Spesifikasi */}
                     <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                           <Info size={18} className="text-emerald-600" /> Spesifikasi Pesanan
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                           <div>
                              <p className="text-gray-500 font-medium text-xs">Jenis Barang</p>
                              <p className="font-bold text-gray-900">{selectedProject.project_physical_details?.[0]?.item_type || '-'}</p>
                           </div>
                           <div>
                              <p className="text-gray-500 font-medium text-xs">Kuantitas</p>
                              <p className="font-bold text-gray-900">{selectedProject.project_physical_details?.[0]?.quantity || 1} Pcs</p>
                           </div>
                           <div className="col-span-2">
                              <p className="text-gray-500 font-medium text-xs">Catatan Bahan / Material</p>
                              <p className="font-medium text-gray-900 bg-white p-2 border border-gray-200 rounded-lg mt-1">{selectedProject.project_physical_details?.[0]?.material_notes || '-'}</p>
                           </div>
                           <div className="col-span-2">
                              <p className="text-gray-500 font-medium text-xs">Catatan Ukuran & Warna</p>
                              <p className="font-medium text-gray-900 bg-white p-2 border border-gray-200 rounded-lg mt-1">
                                Ukuran: {selectedProject.project_physical_details?.[0]?.size_notes || '-'}<br/>
                                Warna: {selectedProject.project_physical_details?.[0]?.color_notes || '-'}
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Log Catatan Internal */}
                     <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                           <MessageSquare size={18} className="text-blue-600" /> Log Catatan Produksi
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-64">
                           <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                              {selectedProject.internal_notes && selectedProject.internal_notes.length > 0 ? (
                                 selectedProject.internal_notes.map((note: any) => (
                                    <div key={note.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                       <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs font-bold text-gray-900">{note.author?.full_name || 'Staf'}</span>
                                          <span className="text-[10px] text-gray-400">{new Date(note.created_at).toLocaleString('id-ID')}</span>
                                       </div>
                                       <p className="text-sm text-gray-600">{note.content}</p>
                                    </div>
                                 ))
                              ) : (
                                 <p className="text-center text-sm text-gray-400 py-8">Belum ada catatan internal.</p>
                              )}
                           </div>
                           {userRole !== 'staff_warehouse' && (
                             <form onSubmit={handleAddNote} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                <input 
                                   type="text" 
                                   name="content"
                                   value={noteContent}
                                   onChange={(e) => setNoteContent(e.target.value)}
                                   placeholder="Ketik progres/catatan ke tim..." 
                                   className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                                />
                                <button disabled={isUpdatingStatus || !noteContent.trim()} type="submit" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                   <Send size={18} />
                                </button>
                             </form>
                           )}
                        </div>
                     </div>

                  </div>

                  {/* KOLOM KANAN: Update Status */}
                  <div className="space-y-6">
                     {userRole !== 'staff_cs' && userRole !== 'staff_warehouse' && (
                        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                           <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                              <Activity size={18} /> Update Status
                           </h4>
                           {(() => {
                              const isWaitingDesign = ['briefing', 'design', 'revision', 'revision_pending', 'Menunggu Desain', 'Menunggu ACC'].includes(selectedProject.status)
                              
                              if (isWaitingDesign) {
                                 return (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                                       <span className="font-bold block mb-1">Menunggu Tim Desain</span>
                                       Status terkunci. Akan otomatis pindah ke Antrean Produksi setelah desain dinyatakan selesai.
                                    </div>
                                 )
                              }

                              return (
                                 <div className="space-y-2">
                                    {['production', 'production_in_progress', 'finishing', 'qc_pending'].map((statusOption) => (
                                       <button 
                                          key={statusOption}
                                          disabled={isUpdatingStatus}
                                          onClick={() => handleStatusChange(statusOption)}
                                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border transition-all flex justify-between items-center
                                             ${selectedProject.status === statusOption 
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50'}`}
                                       >
                                          {statusOption === 'production' && 'Antrean Produksi'}
                                          {statusOption === 'production_in_progress' && 'Sedang Dikerjakan'}
                                          {statusOption === 'finishing' && 'Masuk Finishing'}
                                          {statusOption === 'qc_pending' && 'Siap QC'}
                                          {selectedProject.status === statusOption && <CheckCircle size={16} />}
                                       </button>
                                    ))}
                                 </div>
                              )
                           })()}
                        </div>
                     )}
                     
                     <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-sm">
                        <p className="font-bold text-amber-900 mb-2 flex items-center gap-2"><Calendar size={16}/> Deadline Produksi</p>
                        <p className="text-amber-800 font-medium">
                           {(() => {
                             const deadline = selectedProject.project_physical_details?.[0]?.production_deadline || selectedProject.deadline
                             return deadline
                               ? new Date(deadline).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                               : 'Tidak ada tenggat waktu (Silakan isi via Riwayat Pesanan)'
                           })()}
                        </p>
                     </div>
                  </div>

               </div>
            </div>
         </div>
      )}

    </div>
  )
}
