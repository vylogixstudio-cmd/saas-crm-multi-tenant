'use client'

import React, { useState } from 'react'
import { Wrench, Plus, Search, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react'
import { createMaintenanceTicket } from './actions'
import { toast } from 'sonner'

export default function MaintenanceClient({ initialTickets }: { initialTickets: any[] }) {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredTickets = initialTickets.filter(t => 
    t.machine_name.toLowerCase().includes(search.toLowerCase()) || 
    t.issue_description.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const res = await createMaintenanceTicket(formData)
    
    if (res.success) {
      toast.success('Tiket kendala berhasil dilaporkan!')
      setIsModalOpen(false)
    } else {
      toast.error(res.error || 'Terjadi kesalahan sistem.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mesin & Perawatan</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Laporan kendala mesin & tiket maintenance operasional.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari laporan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
              />
           </div>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm whitespace-nowrap">
             <Plus size={16} /> Lapor Kendala
           </button>
        </div>
      </div>

      {/* TICKETS LIST */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                <th className="py-4 px-6 rounded-tl-[24px]">Waktu Laporan</th>
                <th className="py-4 px-6">Aset / Mesin</th>
                <th className="py-4 px-6">Kendala / Keluhan</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right rounded-tr-[24px]">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-4 px-6">
                    <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                      #{t.id.split('-')[0].toUpperCase()}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock size={10} /> {new Date(t.created_at).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-bold text-gray-900">{t.machine_name}</div>
                    <div className="text-xs font-medium text-gray-500 mt-1">Pelapor: {t.profiles?.full_name || 'Sistem'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-600 font-medium max-w-xs">{t.issue_description}</div>
                    {t.priority === 'high' && <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded text-rose-700 bg-rose-50 border border-rose-100">🔥 Prioritas Tinggi</span>}
                    {t.priority === 'low' && <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded text-gray-500 bg-gray-100 border border-gray-200">Santai / Low</span>}
                  </td>
                  <td className="py-4 px-6">
                    {t.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><AlertTriangle size={14}/> Menunggu Teknisi</span>}
                    {t.status === 'in_progress' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Wrench size={14}/> Sedang Diperbaiki</span>}
                    {t.status === 'resolved' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle size={14}/> Selesai (Aman)</span>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-xs font-medium text-gray-400 italic">Hanya Ops</span>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                    Tidak ada tiket yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-rose-50/50">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" size={20} /> Buat Laporan Baru
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Laporan akan diteruskan ke Tim Operasional.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Nama Mesin / Aset</label>
                <input required type="text" name="machine_name" placeholder="Misal: Mesin Cetak Banner Indoor" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Deskripsi Kendala</label>
                <textarea required name="issue_description" rows={3} placeholder="Ceritakan sedetail mungkin kendala yang dialami..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Tingkat Prioritas</label>
                <select name="priority" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm outline-none transition-all font-medium">
                  <option value="medium">Menengah (Standar)</option>
                  <option value="high">Tinggi (Produksi Terhambat!)</option>
                  <option value="low">Rendah (Santai)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
