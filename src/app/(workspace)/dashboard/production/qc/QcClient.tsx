'use client'

import React, { useState } from 'react'
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, MessageSquare, Plus, Trash2, Star } from 'lucide-react'
import { updateOrderStatus, addInternalNote } from '../actions'
import { toast } from 'sonner'

export default function QcClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // QC State per project
  const [qcStates, setQcStates] = useState<Record<string, { criteria: { name: string, score: string }[], defectNote: string }>>({})

  const initQcState = (projectId: string) => {
    if (!qcStates[projectId]) {
      setQcStates(prev => ({
        ...prev,
        [projectId]: {
          criteria: [{ name: 'Hasil Cetak', score: '' }],
          defectNote: ''
        }
      }))
    }
  }

  const addCriteria = (projectId: string) => {
    setQcStates(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        criteria: [...(prev[projectId]?.criteria || []), { name: '', score: '' }]
      }
    }))
  }

  const removeCriteria = (projectId: string, index: number) => {
    setQcStates(prev => {
      const newCriteria = [...prev[projectId].criteria]
      newCriteria.splice(index, 1)
      return { ...prev, [projectId]: { ...prev[projectId], criteria: newCriteria } }
    })
  }

  const updateCriteria = (projectId: string, index: number, field: 'name' | 'score', value: string) => {
    setQcStates(prev => {
      const newCriteria = [...prev[projectId].criteria]
      newCriteria[index] = { ...newCriteria[index], [field]: value }
      return { ...prev, [projectId]: { ...prev[projectId], criteria: newCriteria } }
    })
  }

  const updateDefectNote = (projectId: string, value: string) => {
    setQcStates(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], defectNote: value }
    }))
  }

  const handlePassQC = async (projectId: string) => {
    setIsUpdating(true)
    
    // Format QC notes for Admin
    const state = qcStates[projectId]
    if (state) {
      let note = '[QC PASSED]\n'
      state.criteria.forEach(c => {
        if (c.name) note += `- ${c.name}: ${c.score || '0'}%\n`
      })
      if (state.defectNote) {
        note += `Catatan Kecacatan: ${state.defectNote}\n`
      }
      await addInternalNote(projectId, note)
    }

    const res = await updateOrderStatus(projectId, 'ready_to_ship')
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Pesanan lulus QC dan dipindahkan ke Packing.')
      setProjects(projects.filter(p => p.id !== projectId))
    }
    setIsUpdating(false)
  }

  const handleFailQC = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    if (!rejectReason.trim()) {
      toast.error('Alasan reject wajib diisi.')
      return
    }

    setIsUpdating(true)
    
    const state = qcStates[selectedProjectId]
    let note = `[QC REJECTED] ${rejectReason}\n`
    if (state) {
      state.criteria.forEach(c => {
        if (c.name) note += `- ${c.name}: ${c.score || '0'}%\n`
      })
      if (state.defectNote) {
        note += `Catatan Kecacatan: ${state.defectNote}\n`
      }
    }
    await addInternalNote(selectedProjectId, note)
    
    const res = await updateOrderStatus(selectedProjectId, 'production_in_progress')
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.error('Pesanan dikembalikan ke bagian cetak/produksi.')
      setProjects(projects.filter(p => p.id !== selectedProjectId))
      setRejectModalOpen(false)
      setRejectReason('')
    }
    setIsUpdating(false)
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-amber-500" size={24} />
            Quality Control (QC)
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Periksa kualitas barang dan catat evaluasi.</p>
        </div>
      </div>

      {/* QC LIST */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white p-8 rounded-[20px] border border-gray-200 text-center flex flex-col items-center shadow-sm">
             <ShieldCheck size={36} className="text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">Tidak Ada Antrean QC</h3>
             <p className="text-gray-500 text-xs mt-1">Belum ada barang yang masuk ke tahap QC.</p>
          </div>
        ) : (
          projects.map(project => {
            const state = qcStates[project.id]
            if (!state) initQcState(project.id)

            return (
              <div key={project.id} className="bg-white p-5 rounded-[20px] border border-gray-200 shadow-sm flex flex-col gap-5">
                
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  {/* Info Singkat */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                          #{project.id.split('-')[0].toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-md">
                          {project.project_physical_details?.[0]?.item_type || 'Custom'}
                        </span>
                    </div>
                    
                    <h3 className="font-extrabold text-gray-900 text-base">{project.title}</h3>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">Klien: {project.profiles?.full_name}</p>
                    
                    <div className="mt-3 grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kuantitas</p>
                          <p className="text-xs font-bold text-gray-900 mt-0.5">{project.project_physical_details?.[0]?.quantity || 1} Pcs</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Bahan</p>
                          <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">{project.project_physical_details?.[0]?.material_notes || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ukuran & Warna</p>
                          <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">
                            {project.project_physical_details?.[0]?.size_notes || '-'} • {project.project_physical_details?.[0]?.color_notes || '-'}
                          </p>
                        </div>
                    </div>
                  </div>

                  {/* Form QC */}
                  <div className="flex-[2] w-full bg-[#F8F9FA] p-4 rounded-xl border border-black/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Star size={14} className="text-amber-500" /> Kriteria Pengecekan
                      </h4>
                      <button onClick={() => addCriteria(project.id)} className="text-[10px] font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors">
                        <Plus size={12} /> Tambah Kriteria
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      {state?.criteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={c.name} 
                            onChange={(e) => updateCriteria(project.id, i, 'name', e.target.value)}
                            placeholder="Apa yang dicek? (Msl: Hasil Cetak)" 
                            className="flex-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-amber-500 outline-none"
                          />
                          <div className="relative w-24">
                            <input 
                              type="number" 
                              value={c.score}
                              onChange={(e) => updateCriteria(project.id, i, 'score', e.target.value)}
                              placeholder="Rating"
                              min="0" max="100"
                              className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg pr-6 focus:border-amber-500 outline-none"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                          </div>
                          <button onClick={() => removeCriteria(project.id, i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-md transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-gray-400" /> Catatan Kecacatan (Opsional)
                      </h4>
                      <textarea 
                        value={state?.defectNote || ''}
                        onChange={(e) => updateDefectNote(project.id, e.target.value)}
                        placeholder="Tulis kecacatan produk jika ada (akan dikirim ke evaluasi operasi)..."
                        rows={2}
                        className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-amber-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
                  <button 
                    disabled={isUpdating}
                    onClick={() => { setSelectedProjectId(project.id); setRejectModalOpen(true); }}
                    className="px-5 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <XCircle size={16} /> Gagal QC
                  </button>
                  <button 
                    disabled={isUpdating}
                    onClick={() => handlePassQC(project.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> Lolos QC & Lanjut Packing
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-black/5 animate-in fade-in zoom-in-95 duration-200">
             <div className="p-5 border-b border-gray-100 bg-rose-50">
               <h3 className="font-extrabold text-lg text-rose-900 flex items-center gap-2">
                 <AlertTriangle size={20} className="text-rose-600" /> Reject QC
               </h3>
               <p className="text-rose-700 text-xs mt-1 font-medium">Pesanan akan dikembalikan ke status Proses Cetak.</p>
             </div>
             <form onSubmit={handleFailQC} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Alasan Reject / Instruksi Perbaikan</label>
                  <textarea 
                    required
                    rows={4}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Misal: Warna pudar, potongannya miring, tolong cetak ulang..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs outline-none transition-all resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setRejectModalOpen(false); setRejectReason(''); }} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                    Kirim Reject
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}
