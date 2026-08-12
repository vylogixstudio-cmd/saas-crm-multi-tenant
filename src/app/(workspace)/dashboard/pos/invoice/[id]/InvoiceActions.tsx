'use client'

import { useTransition } from 'react'
import { markInvoiceAsPaid, cancelInvoice } from '../../actions'
import { Printer, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function InvoiceActions({ invoiceId, status }: { invoiceId: string, status: string }) {
  const [isPendingPaid, startPaid] = useTransition()
  const [isPendingCancel, startCancel] = useTransition()

  const handlePrint = () => window.print()

  const handleMarkAsPaid = () => {
    startPaid(async () => {
      const res = await markInvoiceAsPaid(invoiceId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Invoice berhasil ditandai LUNAS!', {
          description: 'Mutasi pemasukan otomatis tercatat di Buku Besar Keuangan.',
          duration: 5000,
        })
      }
    })
  }

  const handleCancel = () => {
    const reason = window.prompt('Masukkan alasan pembatalan invoice ini:')
    if (reason === null) return // user clicked cancel on prompt
    
    startCancel(async () => {
      const res = await cancelInvoice(invoiceId, reason)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.warning('Invoice telah dibatalkan.', {
          description: 'Status invoice diubah menjadi CANCELLED.',
        })
      }
    })
  }

  const isLoading = isPendingPaid || isPendingCancel

  return (
    <div className="flex items-center gap-2 flex-wrap print:hidden">
      {/* Cetak */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 text-xs font-bold text-[#111827] px-4 py-2 bg-white border border-black/10 rounded-[10px] hover:bg-[#F8F9FA] shadow-sm transition-all"
      >
        <Printer size={15} /> Cetak Invoice
      </button>

      {/* Tandai Lunas — hanya jika PENDING */}
      {status === 'PENDING' && (
        <button
          onClick={handleMarkAsPaid}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 bg-emerald-600 rounded-[10px] hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
        >
          {isPendingPaid ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
          {isPendingPaid ? 'Memproses...' : 'Tandai Lunas'}
        </button>
      )}

      {/* Batalkan — hanya jika PENDING */}
      {status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold text-rose-600 px-4 py-2 bg-rose-50 border border-rose-200 rounded-[10px] hover:bg-rose-100 shadow-sm transition-all disabled:opacity-50"
        >
          {isPendingCancel ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
          {isPendingCancel ? 'Membatalkan...' : 'Batalkan Invoice'}
        </button>
      )}
    </div>
  )
}
