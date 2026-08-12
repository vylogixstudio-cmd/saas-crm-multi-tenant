'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, ExternalLink, ArrowRight, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PosConfirmationInvoices({ invoices, clients }: { invoices: any[], clients: any[] }) {
  const [filterStatus, setFilterStatus] = useState<'WAITING_CONFIRMATION' | 'PAID' | 'ALL'>('WAITING_CONFIRMATION')
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'ALL') return true
    return inv.status === filterStatus
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleMarkPaid = async (invoiceId: string) => {
    if (!confirm('Tandai tagihan ini sebagai Lunas?')) return
    setLoadingId(invoiceId)
    
    try {
      const res = await fetch(`/api/invoice/${invoiceId}/mark-paid`, { method: 'POST' })
      if (!res.ok) throw new Error('Gagal menandai lunas')
      toast.success('Tagihan berhasil ditandai lunas!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#F8F9FA]/50">
        <div>
          <h2 className="font-extrabold text-lg text-[#111827]">Konfirmasi Pembayaran</h2>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Validasi bukti transfer dan kelola tagihan lunas</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2.5 bg-white border border-black/10 rounded-[10px] text-sm font-bold text-[#4B5563] focus:outline-none focus:border-[#2563EB]"
        >
          <option value="WAITING_CONFIRMATION">Menunggu Konfirmasi</option>
          <option value="PAID">Sudah Lunas</option>
          <option value="ALL">Semua</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]/50">
              <th className="py-4 px-6">Invoice</th>
              <th className="py-4 px-6">Klien</th>
              <th className="py-4 px-6">Nominal</th>
              <th className="py-4 px-6">Bukti Transfer</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-[#9CA3AF]">
                  Tidak ada data untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.client_id)
                return (
                  <tr key={inv.id} className="border-b border-black/5 hover:bg-[#F8F9FA] transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-[#111827]">{inv.title}</p>
                      <p className="text-xs text-[#6B7280] font-medium">{inv.invoice_number}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-[#111827]">{client?.full_name || 'Tanpa Klien'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-extrabold text-[#2563EB]">Rp {inv.amount.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="py-4 px-6">
                      {inv.payment_proof_url ? (
                        <a 
                          href={inv.payment_proof_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-[8px] text-xs font-bold transition-colors"
                        >
                          <ExternalLink size={14} /> Lihat Bukti
                        </a>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {inv.status === 'WAITING_CONFIRMATION' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                          <Clock size={12} /> Menunggu Validasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                          <CheckCircle size={12} /> Lunas
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === 'WAITING_CONFIRMATION' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            disabled={loadingId === inv.id}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[10px] text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                          >
                            {loadingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} 
                            Tandai Lunas
                          </button>
                        )}
                        <Link
                          href={`/dashboard/pos/invoice/${inv.id}`}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-black/10 hover:border-black/20 text-[#4B5563] rounded-[10px] text-xs font-bold transition-all shadow-sm"
                        >
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
