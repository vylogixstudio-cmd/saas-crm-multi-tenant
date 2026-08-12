'use client'

import { useState, useTransition } from 'react'
import { Calendar, Plus, Trash2, Loader2, DollarSign, Clock, SplitSquareHorizontal } from 'lucide-react'
import { createProjectInvoice, deleteProjectInvoice } from '@/app/(workspace)/dashboard/actions'
import { toast } from 'sonner'

export default function InstallmentScheduler({ 
  projectId, 
  clientId,
  invoices = [], 
  totalProjectPrice = 0 
}: { 
  projectId: string, 
  clientId: string,
  invoices: any[], 
  totalProjectPrice: number 
}) {
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  
  const [title, setTitle] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [amountRaw, setAmountRaw] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [includeTax, setIncludeTax] = useState(false)

  const handleAmountInput = (val: string) => {
    const raw = Number(val.replace(/\D/g, '')) || 0
    setAmountRaw(raw)
    setAmountDisplay(raw > 0 ? raw.toLocaleString('id-ID') : '')
  }

  const handleAdd = (e: any) => {
    e.preventDefault()
    if (!title) { toast.error('Judul tagihan wajib diisi'); return }
    if (amountRaw <= 0) { toast.error('Nominal harus lebih dari 0'); return }
    if (!dueDate) { toast.error('Tanggal jatuh tempo wajib diisi'); return }

    startTransition(async () => {
      const res = await createProjectInvoice({
        projectId,
        clientId,
        title,
        amount: amountRaw,
        dueDate,
        includeTax
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Tagihan berhasil dibuat!')
        setIsAdding(false)
        setTitle('')
        setAmountRaw(0)
        setAmountDisplay('')
        setDueDate('')
        setIncludeTax(false)
      }
    })
  }

  const handleDelete = (invoiceId: string) => {
    if (!confirm('Yakin ingin membatalkan jadwal tagihan ini? (Status akan menjadi CANCELLED)')) return
    
    startTransition(async () => {
      const res = await deleteProjectInvoice(invoiceId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Jadwal tagihan berhasil dibatalkan!')
      }
    })
  }

  const handleAutoSplit = () => {
    const remaining = Math.max(0, totalProjectPrice - totalScheduled)
    if (remaining <= 0) { toast.error('Tidak ada sisa tagihan untuk dibagi'); return }
    if (!confirm('Yakin ingin membuat 3 termin otomatis (DP 40%, Termin 2 30%, Pelunasan 30%)?')) return

    startTransition(async () => {
      const dpAmount = Math.floor(remaining * 0.4)
      const t2Amount = Math.floor(remaining * 0.3)
      const pelunasanAmount = remaining - dpAmount - t2Amount

      const today = new Date()
      const t2Date = new Date()
      t2Date.setDate(today.getDate() + 30)
      const t3Date = new Date()
      t3Date.setDate(today.getDate() + 60)

      const formatDate = (d: Date) => d.toISOString().split('T')[0]

      const terms = [
        { title: 'DP 40%', amount: dpAmount, dueDate: formatDate(today) },
        { title: 'Termin 2 (30%)', amount: t2Amount, dueDate: formatDate(t2Date) },
        { title: 'Pelunasan (30%)', amount: pelunasanAmount, dueDate: formatDate(t3Date) },
      ]

      for (const term of terms) {
        const res = await createProjectInvoice({
          projectId,
          clientId,
          title: term.title,
          amount: term.amount,
          dueDate: term.dueDate,
          includeTax: false // Ops bisa edit kalau perlu pajak
        })
        if (res?.error) {
          toast.error(`Gagal membuat ${term.title}: ${res.error}`)
          return
        }
      }
      toast.success('3 Termin berhasil dibuat otomatis!')
    })
  }

  const totalScheduled = invoices.filter(i => i.status !== 'CANCELLED' && !i.title.includes('Biaya Tambahan')).reduce((sum, inv) => sum + inv.amount, 0)
  const remainingToSchedule = Math.max(0, totalProjectPrice - totalScheduled)

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
        <div>
          <h3 className="font-bold text-[#111827] flex items-center gap-2">
            <Calendar size={18} className="text-[#2563EB]" /> Manajemen Jadwal Pembayaran (Cicilan)
          </h3>
          <p className="text-[10px] text-[#6B7280] mt-1">
            Sisa yang belum dijadwalkan: <span className="font-bold text-rose-500">Rp {remainingToSchedule.toLocaleString('id-ID')}</span>
          </p>
        </div>
        {!isAdding && (
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleAutoSplit}
              disabled={isPending || remainingToSchedule <= 0}
              className="flex items-center gap-1.5 bg-[#F3F4F6] text-[#4B5563] px-3 py-1.5 rounded-[8px] text-xs font-bold hover:bg-[#E5E7EB] transition-all disabled:opacity-50"
            >
              <SplitSquareHorizontal size={14} /> Auto 3 Termin
            </button>
            <button 
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 bg-[#111827] text-white px-3 py-1.5 rounded-[8px] text-xs font-bold hover:bg-black transition-all"
            >
              <Plus size={14} /> Tambah Manual
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="p-4 bg-blue-50/50 border-b border-black/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">Judul Termin</label>
              <input type="text" required placeholder="Contoh: DP 50%" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-black/10 rounded-[8px] text-sm focus:border-[#2563EB] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">Nominal (Rp)</label>
              <input type="text" inputMode="numeric" required placeholder="0" value={amountDisplay} onChange={e => handleAmountInput(e.target.value)} className="w-full px-3 py-2 bg-white border border-black/10 rounded-[8px] text-sm focus:border-[#2563EB] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">Jatuh Tempo</label>
              <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-black/10 rounded-[8px] text-sm focus:border-[#2563EB] outline-none" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeTax} onChange={e => setIncludeTax(e.target.checked)} className="rounded text-[#2563EB] focus:ring-[#2563EB]" />
              <span className="text-xs font-bold text-[#4B5563]">Tambahkan PPN 12% ke tagihan ini</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors">Batal</button>
              <button type="button" onClick={handleAdd} disabled={isPending} className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-[8px] text-xs font-bold transition-all shadow-sm disabled:opacity-50">
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]/50">
              <th className="py-3 px-4">Termin / Tagihan</th>
              <th className="py-3 px-4">Nominal</th>
              <th className="py-3 px-4">Jatuh Tempo</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-[#9CA3AF]">Belum ada jadwal tagihan. Silakan tambah jadwal.</td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="border-b border-black/5 hover:bg-[#F8F9FA] transition-colors group">
                  <td className="py-3 px-4">
                    <p className="text-sm font-bold text-[#111827]">{inv.title}</p>
                    <p className="text-[10px] text-[#6B7280]">{inv.invoice_number}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-extrabold text-[#2563EB]">Rp {inv.amount.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#4B5563]">
                      <Clock size={12} className={new Date(inv.due_date) < new Date() && inv.status !== 'PAID' ? 'text-rose-500' : 'text-[#9CA3AF]'} />
                      <span className={new Date(inv.due_date) < new Date() && inv.status !== 'PAID' ? 'text-rose-600 font-bold' : ''}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                      inv.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {inv.status === 'PENDING' && (
                      <button 
                        type="button"
                        onClick={() => handleDelete(inv.id)}
                        disabled={isPending}
                        className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-[8px] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Batalkan Invoice"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
