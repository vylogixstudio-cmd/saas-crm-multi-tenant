'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Search, CheckCircle, Clock, AlertCircle, Bell } from 'lucide-react'

type InvoiceQueueItem = {
  projectId: string
  projectTitle: string
  clientId: string
  clientName: string
  terminLabel: string
  amount: number
  totalPrice: number
}

export default function PosRightPanel({
  invoices,
}: {
  invoices: any[]
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredInvoices = invoices?.filter(inv => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.title?.toLowerCase().includes(q) ||
      (inv.profiles as any)?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-black/5 bg-[#F8F9FA]/50">
        <div className="flex gap-2 mb-4">
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold transition-all bg-[#111827] text-white shadow-sm cursor-default"
          >
            <FileText size={13} />
            Riwayat Invoice
            <span className="text-[10px] font-semibold opacity-60 ml-0.5">({invoices?.length || 0})</span>
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Cari invoice..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-black/10 rounded-[10px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                <th className="py-3 px-4">No. Invoice & Klien</th>
                <th className="py-3 px-4">Judul</th>
                <th className="py-3 px-4">Total & Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices?.map(inv => (
                <tr key={inv.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#111827] text-xs">{inv.invoice_number}</div>
                    <div className="text-xs font-medium text-[#6B7280] mt-0.5">
                      {(inv.profiles as any)?.full_name || 'Klien Eksternal'}
                    </div>
                    <div className="text-[10px] font-medium text-[#9CA3AF] mt-0.5">
                      {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#4B5563] text-xs max-w-[140px] truncate">{inv.title}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111827] text-sm">
                      Rp {Number(inv.amount).toLocaleString('id-ID')}
                    </div>
                    <div className="mt-1">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          <CheckCircle size={9} /> LUNAS
                        </span>
                      ) : inv.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                          BATAL
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                            <Clock size={9} /> PENDING
                          </span>
                          {(inv as any).payment_proof_url && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider border border-blue-100 mt-1 ml-0 block w-fit">
                              <Bell size={9} /> Cek Bukti Transfer
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link 
                      href={`/dashboard/pos/invoice/${inv.id}`}
                      className="inline-block bg-white border border-black/10 hover:border-[#2563EB] hover:text-[#2563EB] text-[#4B5563] font-bold px-3 py-1.5 rounded-[8px] text-xs transition-all shadow-sm"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              
              {(!filteredInvoices || filteredInvoices.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <FileText size={36} className="mx-auto text-[#D1D5DB] mb-3" />
                    <p className="text-[#9CA3AF] font-semibold text-sm">{searchTerm ? 'Tidak ada hasil pencarian.' : 'Belum ada invoice.'}</p>
                    <p className="text-[#D1D5DB] text-xs mt-1">Buat invoice pertama dari form di sebelah kiri.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  )
}
