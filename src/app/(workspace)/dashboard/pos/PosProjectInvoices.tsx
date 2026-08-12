'use client'

import { useState } from 'react'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PosProjectInvoices({ invoices, clients }: { invoices: any[], clients: any[] }) {
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date'>('created_at')

  const filteredInvoices = invoices.filter(inv => !inv.parent_invoice_id)
  
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
  })

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
        <div>
          <h2 className="font-extrabold text-lg text-[#111827]">Tagihan Proyek (Menunggu Pembayaran)</h2>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Tagihan yang dibuat oleh tim operasional</p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 bg-white border border-black/10 rounded-[10px] text-sm font-bold text-[#4B5563] focus:outline-none focus:border-[#2563EB]"
        >
          <option value="created_at">Terbaru Dibuat</option>
          <option value="due_date">Jatuh Tempo Terdekat</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]/50">
              <th className="py-4 px-6">Invoice</th>
              <th className="py-4 px-6">Klien</th>
              <th className="py-4 px-6">Nominal</th>
              <th className="py-4 px-6">Jatuh Tempo</th>
              <th className="py-4 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-[#9CA3AF]">
                  Tidak ada tagihan proyek yang sedang menunggu pembayaran.
                </td>
              </tr>
            ) : (
              sortedInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.client_id)
                return (
                  <tr key={inv.id} className="border-b border-black/5 hover:bg-[#F8F9FA] transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-[#111827]">{inv.title}</p>
                      <p className="text-xs text-[#6B7280] font-medium">{inv.invoice_number}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-[#111827]">{client?.full_name || 'Tanpa Klien'}</p>
                      {client?.email && <p className="text-[10px] text-[#6B7280]">{client.email}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-extrabold text-[#2563EB]">Rp {inv.amount.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="py-4 px-6">
                      {inv.due_date ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563]">
                          <Calendar size={14} className={new Date(inv.due_date) < new Date() ? 'text-rose-500' : 'text-[#9CA3AF]'} />
                          {new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/pos/invoice/${inv.id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-black/10 hover:border-[#2563EB] hover:text-[#2563EB] text-[#4B5563] rounded-[10px] text-xs font-bold transition-all shadow-sm"
                      >
                        Detail <ArrowRight size={14} />
                      </Link>
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
