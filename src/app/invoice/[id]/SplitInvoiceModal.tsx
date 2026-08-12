'use client'

import { useState, useTransition } from 'react'
import { requestInvoiceSplit } from './actions'
import { Calendar, Loader2, SplitSquareHorizontal, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SplitInvoiceModal({ invoice, onClose }: { invoice: any, onClose: () => void }) {
  const [splitCount, setSplitCount] = useState<number>(2)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSplit = () => {
    if (!reason.trim()) {
      toast.error('Mohon sertakan alasan pengajuan cicilan.')
      return
    }

    startTransition(async () => {
      const res = await requestInvoiceSplit(invoice.id, splitCount, reason)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Pengajuan berhasil dikirim!', { description: 'Menunggu persetujuan kasir.' })
        onClose()
        router.refresh()
      }
    })
  }

  const gapDays = invoice.amount < 10000000 ? 14 : 30
  const perAmount = Math.ceil(invoice.amount / splitCount)

  const simulasi = Array.from({ length: splitCount }).map((_, i) => {
    const d = invoice.due_date ? new Date(invoice.due_date) : new Date()
    d.setDate(d.getDate() + (i * gapDays))
    return {
      label: `Cicilan ${i + 1}`,
      amount: i === splitCount - 1 ? invoice.amount - (perAmount * (splitCount - 1)) : perAmount,
      date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg max-h-[95vh] flex flex-col rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 shrink-0 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
          <div className="flex items-center gap-3 text-[#111827]">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-[10px]">
              <SplitSquareHorizontal size={20} />
            </div>
            <h2 className="font-extrabold text-lg">Ajukan Cicilan</h2>
          </div>
          <button onClick={onClose} className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-black/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-[#4B5563] mb-2 uppercase tracking-wider">
              Pilih Jumlah Cicilan
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setSplitCount(num)}
                  className={`py-3 px-4 rounded-[12px] text-sm font-bold border-2 transition-all ${
                    splitCount === num 
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' 
                      : 'border-black/10 text-[#6B7280] hover:border-black/20 hover:bg-[#F8F9FA]'
                  }`}
                >
                  {num}x Bayar
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-[16px] border border-black/5">
            <h4 className="text-xs font-bold text-[#111827] mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-[#2563EB]" />
              Simulasi Jatuh Tempo (Jarak {gapDays} Hari)
            </h4>
            <div className="space-y-2">
              {simulasi.map((sim, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-black/5 last:border-0">
                  <div className="font-medium text-[#4B5563]">
                    <span className="font-bold text-[#111827] w-20 inline-block">{sim.label}</span>
                    <span className="text-xs text-[#9CA3AF]">{sim.date}</span>
                  </div>
                  <span className="font-bold text-[#2563EB]">Rp {sim.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B5563] mb-2 uppercase tracking-wider">
              Alasan Pengajuan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Berikan alasan mengapa tagihan ini perlu dipecah (misal: omset sedang turun)"
              className="w-full p-4 bg-white border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all min-h-[100px] resize-none"
            />
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-[12px] text-amber-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              Pengajuan ini akan menahan proses pembayaran sementara waktu hingga pihak kasir kami menyetujui pengajuan Anda.
            </p>
          </div>
        </div>

        <div className="p-6 shrink-0 border-t border-black/5 bg-[#F8F9FA]/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-[12px] text-sm font-bold text-[#4B5563] hover:bg-black/5 transition-all"
          >
            Batal
          </button>
          <button 
            onClick={handleSplit}
            disabled={isPending || !reason.trim()}
            className="px-6 py-2.5 rounded-[12px] text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            Kirim Pengajuan
          </button>
        </div>
      </div>
    </div>
  )
}
