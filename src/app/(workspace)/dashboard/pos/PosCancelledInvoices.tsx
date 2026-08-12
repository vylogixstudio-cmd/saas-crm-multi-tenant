'use client'

import { Calendar, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PosCancelledInvoices({ invoices, clients }: { invoices: any[], clients: any[] }) {
  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 bg-[#F8F9FA]/50">
        <h2 className="font-extrabold text-lg text-[#111827]">Riwayat Dibatalkan</h2>
        <p className="text-xs text-[#6B7280] font-medium mt-1">Invoice proyek atau manual yang dibatalkan</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]/50">
              <th className="py-4 px-6">Invoice</th>
              <th className="py-4 px-6">Klien</th>
              <th className="py-4 px-6">Nominal</th>
              <th className="py-4 px-6">Dibuat Pada</th>
              <th className="py-4 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-[#9CA3AF]">
                  Tidak ada riwayat invoice yang dibatalkan.
                </td>
              </tr>
            ) : (
              sortedInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.client_id)
                return (
                  <tr key={inv.id} className="border-b border-black/5 hover:bg-[#F8F9FA] transition-colors opacity-70">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-[#111827] line-through">{inv.title}</p>
                      <p className="text-xs text-[#6B7280] font-medium">{inv.invoice_number}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-[#111827]">{client?.full_name || 'Tanpa Klien'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-extrabold text-[#6B7280]">Rp {inv.amount.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563]">
                        <Calendar size={14} className="text-[#9CA3AF]" />
                        {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
                        <Trash2 size={12} /> Batal
                      </span>
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
