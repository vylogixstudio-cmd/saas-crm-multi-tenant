'use client'

import { useState } from 'react'
import { PenTool, Link as LinkIcon, MessageSquare, ExternalLink, X, Save, Clock, AlertTriangle, CheckCircle, Search, Send, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { updateDesignProject, replyToDesignRevision } from './actions'

export default function DesignClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, briefing, design, revision, revision_pending
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})
  
  // Form State
  const [designUrl, setDesignUrl] = useState('')
  const [designNotes, setDesignNotes] = useState('')
  const [status, setStatus] = useState('')

  const getPhysicalDetails = (project: any) => {
    if (!project?.project_physical_details) return {}
    if (Array.isArray(project.project_physical_details)) return project.project_physical_details[0] || {}
    return project.project_physical_details
  }

  const openModal = (project: any) => {
    setSelectedProject(project)
    const pd = getPhysicalDetails(project)
    setDesignUrl(pd.design_file_url || '')
    setDesignNotes(pd.design_notes || '')
    setStatus(project.status)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setIsSubmitting(true)

    try {
      const res = await updateDesignProject(selectedProject.id, {
        design_file_url: designUrl,
        design_notes: designNotes,
        status: status
      })

      if (res.error) {
        alert(res.error)
      } else {
        // Jika status pindah ke 'production', hapus dari list (sudah pindah ke antrean produksi)
        if (status === 'production') {
          setProjects(prev => prev.filter(p => p.id !== selectedProject.id))
          setIsModalOpen(false)
          alert('✅ Desain ACC! Pesanan sudah dipindahkan ke Antrean Produksi.')
        } else {
          // Update local state untuk status lainnya
          const updatedProject = {
            ...selectedProject,
            status: status,
            project_physical_details: Array.isArray(selectedProject.project_physical_details) 
              ? selectedProject.project_physical_details.map((d: any, i: number) =>
                  i === 0 ? { ...d, design_file_url: designUrl, design_notes: designNotes } : d
                )
              : { ...(selectedProject.project_physical_details || {}), design_file_url: designUrl, design_notes: designNotes }
          }
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p))
          setSelectedProject(updatedProject)
          setIsModalOpen(false)
          alert('✅ Perubahan berhasil disimpan dan dikirim ke portal klien!')
        }
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || String(err) || "Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplyRevision = async (revId: string) => {
    if (!replyText[revId]) return
    setIsSubmitting(true)
    try {
      const res = await replyToDesignRevision(revId, replyText[revId])
      if (res.error) {
        alert(res.error)
      } else {
        alert("Balasan revisi terkirim!")
        window.location.reload()
      }
    } catch (err) {
      alert("Gagal membalas revisi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'briefing': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Briefing (Menunggu)</span>
      case 'design': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">Sedang Dikerjakan</span>
      case 'revision': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">Revisi Klien</span>
      case 'revision_pending': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white border border-rose-600 animate-pulse">🔴 Revisi Dari Klien!</span>
      case 'production': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Siap Cetak / ACC</span>
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">{s}</span>
    }
  }

  // Count client revision messages for selected project
  const clientRevisions = selectedProject?.internal_notes
    ? selectedProject.internal_notes.filter((n: any) => n.is_client_message && n.content.includes('[REVISI DARI KLIEN]'))
    : []
  const clientRevCount = clientRevisions.length
  const isRevQuotaExceeded = clientRevCount >= 3

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <PenTool className="text-pink-600" /> Studio & Mockup Desain (Fisik)
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Antrean desain prepress & komunikasi mockup dengan klien fisik/percetakan.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama proyek atau klien..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {['all', 'briefing', 'design', 'revision', 'revision_pending'].map(statusFilter => (
              <button
                key={statusFilter}
                onClick={() => setFilterStatus(statusFilter)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors capitalize ${
                  filterStatus === statusFilter 
                  ? statusFilter === 'revision_pending' ? 'bg-rose-600 text-white' : 'bg-gray-900 text-white' 
                  : statusFilter === 'revision_pending' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {statusFilter === 'all' ? 'Semua Status' : statusFilter === 'revision_pending' ? '🔴 Revisi Klien' : statusFilter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50">
                <th className="py-4 px-6">Informasi Proyek</th>
                <th className="py-4 px-6">Spesifikasi Cetak</th>
                <th className="py-4 px-6">Tautan Desain</th>
                <th className="py-4 px-6">Status Desain</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                const pd = project.project_physical_details?.[0]
                return (
                  <tr key={project.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-gray-900">{project.title}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">Klien: {project.profiles?.full_name}</div>
                      <div className="text-[11px] font-bold text-pink-600 mt-1 flex items-center gap-1">
                        <Clock size={12} /> Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString('id-ID') : 'Belum Set'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-medium text-gray-700">
                        {pd ? (
                          <>
                            Bahan: <strong>{pd.material_notes || '-'}</strong><br/>
                            Ukuran: <strong>{pd.size_notes || '-'}</strong><br/>
                            Warna/Tinta: <strong>{pd.color_notes || '-'}</strong>
                          </>
                        ) : 'Data cetak tidak lengkap'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {pd?.design_file_url ? (
                        <a href={pd.design_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-700 font-bold text-xs hover:bg-pink-100 transition-colors">
                          Buka Link <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">Belum ada link</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => openModal(project)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 hover:text-pink-600 transition-colors shadow-sm"
                      >
                        Kelola Mockup
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    <PenTool size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Tidak ada antrean desain saat ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KELOLA DESAIN */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-black/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/70">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-pink-100 text-pink-700">
                    Prepress & Mockup
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isRevQuotaExceeded ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Revisi Klien: {clientRevCount}x
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">{selectedProject.title}</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Klien: {selectedProject.profiles?.full_name || selectedProject.profiles?.email}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6">
              
              {/* Brief from CS */}
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-blue-600"/> Spesifikasi & Brief dari CS:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Jenis Barang</span>
                    <span className="font-bold text-gray-900">{getPhysicalDetails(selectedProject).item_type || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Bahan / Material</span>
                    <span className="font-bold text-gray-900">{getPhysicalDetails(selectedProject).material_notes || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Ukuran / Pola</span>
                    <span className="font-bold text-gray-900">{getPhysicalDetails(selectedProject).size_notes || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Warna Tinta / Sablon</span>
                    <span className="font-bold text-gray-900">{getPhysicalDetails(selectedProject).color_notes || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Client Revisions Section */}
              {selectedProject.internal_notes && selectedProject.internal_notes.filter((n: any) => n.is_client_message).length > 0 && (
                <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-rose-600" /> Log Revisi & Instruksi dari Klien:
                    </h4>
                    {isRevQuotaExceeded && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                        ⚠️ Revisi Ekstra #{clientRevCount}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {selectedProject.internal_notes.filter((n: any) => n.is_client_message).map((note: any) => {
                      const isAcc = note.content.includes('[ACC DARI KLIEN]')
                      return (
                        <div key={note.id} className={`bg-white rounded-xl border ${isAcc ? 'border-emerald-200' : 'border-rose-200'} overflow-hidden shadow-sm`}>
                          <div className={`p-2.5 border-b flex justify-between items-center ${isAcc ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                            <span className="text-xs font-bold">{isAcc ? '✅ KLIEN MENYETUJUI DESAIN (ACC)' : '🚨 REVISI DARI KLIEN'}</span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {new Date(note.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="p-3 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {note.content.replace('[REVISI DARI KLIEN] ', '').replace('[ACC DARI KLIEN] ', '')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Form Input Mockup & Catatan Desainer */}
              <form id="designForm" onSubmit={handleSubmit} className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon size={14}/> Link Mockup Desain (Canva / Google Drive / Figma / Cloudinary) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="url"
                    required
                    value={designUrl}
                    onChange={e => setDesignUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-inner"
                    placeholder="https://drive.google.com/... atau https://canva.com/..."
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Klien akan langsung dapat membuka link ini di portal mereka untuk mereview mockup.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Catatan Desainer ke Klien (Instruksi Review)
                  </label>
                  <textarea 
                    rows={3}
                    value={designNotes}
                    onChange={e => setDesignNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all resize-none shadow-inner"
                    placeholder="Contoh: Halo Kak, mockup kartu nama sudah disesuaikan ukuran font dan logonya ya. Mohon dicek ejaan dan jika cocok silakan klik tombol ACC!"
                  />
                </div>

                <div className="bg-white p-4 border border-gray-200 rounded-xl">
                  <label className="block text-xs font-bold text-gray-900 mb-2.5 uppercase tracking-wider">Pilih Status Desain:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-pink-500 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50/50 transition-all">
                      <input type="radio" name="status" value="design" checked={status === 'design'} onChange={() => setStatus('design')} className="text-pink-600 focus:ring-pink-500" />
                      <span className="text-xs font-bold text-blue-700">🎨 Mockup Siap Direview Klien</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-pink-500 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50/50 transition-all">
                      <input type="radio" name="status" value="revision" checked={status === 'revision'} onChange={() => setStatus('revision')} className="text-pink-600 focus:ring-pink-500" />
                      <span className="text-xs font-bold text-rose-700">✏️ Sedang Proses Revisi</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50 transition-all sm:col-span-2">
                      <input type="radio" name="status" value="production" checked={status === 'production'} onChange={() => setStatus('production')} className="text-emerald-600 focus:ring-emerald-500" />
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-emerald-700">✅ ACC Selesai — Lempar ke Antrean Produksi</span>
                        <CheckCircle size={16} className="text-emerald-600"/>
                      </div>
                    </label>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/80 mt-auto">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Tutup
              </button>
              <button 
                type="submit"
                form="designForm"
                disabled={isSubmitting}
                className="flex-[2] px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold transition-all flex justify-center items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim ke Portal Klien'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
