'use client'

import React, { useState } from 'react'
import { CheckCircle2, Search, CheckSquare, Truck, AlertTriangle, RefreshCw, XCircle, ExternalLink, Video, Image as ImageIcon, Send, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { confirmDelivery, reshipReturnOrder, cancelAndRefundOrder } from '../actions'

export default function ConfirmationClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Reship Modal state
  const [reshipModalProject, setReshipModalProject] = useState<any | null>(null)
  const [newCourier, setNewCourier] = useState('')
  const [newTracking, setNewTracking] = useState('')
  const [reshipNotes, setReshipNotes] = useState('')

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = async (projectId: string) => {
    if (!confirm('Tandai pesanan ini telah diterima dengan baik oleh klien dan selesaikan proyek?')) return
    setIsUpdating(projectId)
    
    const res = await confirmDelivery(projectId)
    
    if (res.success) {
      toast.success('Pesanan telah diselesaikan!')
      setProjects(projects.filter(p => p.id !== projectId))
    } else {
      toast.error(res.error || 'Terjadi kesalahan.')
    }
    setIsUpdating(null)
  }

  const handleCancelAndRefund = async (projectId: string) => {
    const reason = prompt('Masukkan alasan pembatalan / refund pesanan:')
    if (reason === null) return
    setIsUpdating(projectId)

    const res = await cancelAndRefundOrder(projectId, reason || 'Permintaan Refund Klien')
    if (res.success) {
      toast.success('Pesanan berhasil dibatalkan dan dimasukkan ke riwayat refund.')
      setProjects(projects.filter(p => p.id !== projectId))
    } else {
      toast.error(res.error || 'Gagal membatalkan pesanan.')
    }
    setIsUpdating(null)
  }

  const handleReshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reshipModalProject) return
    setIsUpdating(reshipModalProject.id)

    const fd = new FormData()
    fd.append('shipping_courier', newCourier)
    fd.append('tracking_number', newTracking)
    fd.append('reship_notes', reshipNotes)

    const res = await reshipReturnOrder(reshipModalProject.id, fd)
    if (res.success) {
      toast.success('Resi pengganti retur berhasil dikirim ke klien!')
      setProjects(prev => prev.map(p => p.id === reshipModalProject.id ? {
        ...p,
        status: 'shipped',
        project_physical_details: Array.isArray(p.project_physical_details)
          ? [{ ...p.project_physical_details[0], shipping_status: 'SHIPPED', shipping_courier: newCourier, tracking_number: newTracking }]
          : { ...p.project_physical_details, shipping_status: 'SHIPPED', shipping_courier: newCourier, tracking_number: newTracking }
      } : p))
      setReshipModalProject(null)
    } else {
      toast.error(res.error || 'Gagal menyimpan resi baru.')
    }
    setIsUpdating(null)
  }

  // Helper render parsed complaint note
  const renderComplaintContent = (rawContent: string) => {
    const lines = rawContent
      .replace('[KLAIM RETUR & KOMPLAIN]\n', '')
      .replace('[KLAIM CACAT CETAK / KOMPLAIN] ', '')
      .split('\n')

    let photoUrl = ''
    let videoUrl = ''
    const textLines: string[] = []

    lines.forEach(line => {
      if (line.startsWith('Foto Bukti: ')) {
        photoUrl = line.replace('Foto Bukti: ', '').trim()
      } else if (line.startsWith('Link Video Unboxing: ')) {
        videoUrl = line.replace('Link Video Unboxing: ', '').trim()
      } else {
        textLines.push(line)
      }
    })

    return (
      <div className="space-y-2 text-xs">
        <div className="space-y-1 text-gray-800 leading-relaxed font-medium">
          {textLines.map((tl, idx) => (
            <p key={idx}>{tl}</p>
          ))}
        </div>

        {/* Action badges for photo / video */}
        {(photoUrl || videoUrl) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-100">
            {photoUrl && (
              <a
                href={photoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold rounded-lg transition-all shadow-2xs"
              >
                <ImageIcon size={13} />
                <span>Lihat Foto Bukti</span>
                <ExternalLink size={11} />
              </a>
            )}
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-bold rounded-lg transition-all shadow-2xs"
              >
                <Video size={13} />
                <span>Buka Video Unboxing</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Konfirmasi Diterima & Retur</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Selesaikan pesanan sampai atau tangani retur & resi pengganti.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text" 
                placeholder="Cari pesanan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
           </div>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3.5">
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-6 rounded-[16px] border border-gray-200 text-center flex flex-col items-center shadow-sm">
             <CheckSquare size={30} className="text-gray-300 mb-2" />
             <h3 className="text-sm font-bold text-gray-900">Tidak Ada Antrean Pengiriman Aktif</h3>
             <p className="text-gray-500 text-xs mt-0.5">Semua pesanan yang terkirim telah diselesaikan atau tidak ada komplain.</p>
          </div>
        ) : (
          filteredProjects.map(project => {
            const detail = Array.isArray(project.project_physical_details) ? project.project_physical_details[0] : project.project_physical_details
            
            // Cek apakah ada komplain/retur dari klien
            const complaintNotes = (project.internal_notes || []).filter((n: any) => 
              n.content.includes('[KLAIM RETUR & KOMPLAIN]') || n.content.includes('[KLAIM CACAT CETAK')
            )
            const latestComplaint = complaintNotes[complaintNotes.length - 1]
            const isReturnRequested = detail?.shipping_status === 'RETURN_REQUESTED' || !!latestComplaint

            return (
            <div 
              key={project.id} 
              className={`bg-white p-4 sm:p-5 rounded-[16px] border shadow-2xs flex flex-col gap-3.5 transition-all ${
                isReturnRequested ? 'border-rose-300 ring-2 ring-rose-50 bg-rose-50/15' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    #{project.id.split('-')[0].toUpperCase()}
                  </span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                    isReturnRequested 
                      ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {isReturnRequested ? '🚨 KLIEN MENGAJUKAN RETUR / KOMPLAIN' : '🚚 DALAM PENGIRIMAN'}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-gray-500">
                  Klien: <span className="font-extrabold text-gray-800">{project.profiles?.full_name}</span> ({project.profiles?.whatsapp_number || project.profiles?.email})
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-gray-900 text-base">{project.title}</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Kurir</span>
                    <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                      <Truck size={12} className="text-orange-500" /> {detail?.shipping_courier || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Nomor Resi</span>
                    <span className="font-mono font-bold text-blue-600 mt-0.5 block truncate">{detail?.tracking_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                    <span className="font-bold text-gray-800 uppercase text-[10px] mt-0.5 block">{detail?.shipping_status || 'SHIPPED'}</span>
                  </div>
                </div>
              </div>

              {/* BOX DETAIL KOMPLAIN / RETUR KLIEN JIKA ADA */}
              {latestComplaint && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs space-y-2">
                  <div className="flex justify-between items-center text-rose-900 font-extrabold uppercase tracking-wider text-[10px]">
                    <span className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-rose-600" /> Tiket Komplain Klien:</span>
                    <span className="text-[10px] text-rose-700 font-medium">
                      {new Date(latestComplaint.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-rose-100">
                    {renderComplaintContent(latestComplaint.content)}
                  </div>
                </div>
              )}

              {/* TOMBOL AKSI STAF */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
                {isReturnRequested ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCancelAndRefund(project.id)}
                      disabled={isUpdating === project.id}
                      className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <XCircle size={14} /> Batalkan & Refund Dana
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReshipModalProject(project)
                        setNewCourier(detail?.shipping_courier || '')
                        setNewTracking('')
                        setReshipNotes('')
                      }}
                      disabled={isUpdating === project.id}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw size={14} /> Setujui Retur & Kirim Resi Pengganti
                    </button>

                    <button 
                      onClick={() => handleConfirm(project.id)}
                      disabled={isUpdating === project.id}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                      title="Selesaikan secara manual jika komplain sudah disepakati"
                    >
                      <CheckCircle2 size={14} /> Selesaikan Komplain
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium py-1 px-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>Paket dalam perjalanan &mdash; Menunggu konfirmasi penerimaan oleh Klien</span>
                  </div>
                )}
              </div>

            </div>
          )})
        )}
      </div>

      {/* MODAL INPUT RESI PENGGANTI RETUR */}
      {reshipModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden border border-black/10">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-orange-600" />
                <h3 className="font-extrabold text-sm text-gray-900">Kirim Resi Pengganti Retur</h3>
              </div>
              <button onClick={() => setReshipModalProject(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReshipSubmit} className="p-5 space-y-3.5">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Proyek</span>
                <p className="font-extrabold text-xs text-gray-900">{reshipModalProject.title}</p>
                <p className="text-[11px] text-gray-500">Klien: {reshipModalProject.profiles?.full_name}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nama Ekspedisi / Kurir Pengganti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCourier}
                  onChange={e => setNewCourier(e.target.value)}
                  placeholder="Contoh: JNE Reguler / GoSend / Kurir Toko"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nomor Resi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTracking}
                  onChange={e => setNewTracking(e.target.value)}
                  placeholder="Contoh: JNE1234567890"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Catatan Penggantian Retur (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={reshipNotes}
                  onChange={e => setReshipNotes(e.target.value)}
                  placeholder="Contoh: Barang cetak ulang sudah lolos QC dan dikirim kembali ke alamat klien."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReshipModalProject(null)}
                  className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating === reshipModalProject.id}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  {isUpdating === reshipModalProject.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Kirim Resi Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
