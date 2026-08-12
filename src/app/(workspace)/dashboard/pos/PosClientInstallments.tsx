'use client'

import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, CheckCircle, SplitSquareHorizontal, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { approveInvoiceSplit, rejectInvoiceSplit } from '../actions'

export default function PosClientInstallments({ invoices, clients }: { invoices: any[], clients: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  // Ambil hanya induk: yang statusnya SPLIT_REQUESTED atau SPLIT_APPROVED (atau yg punya anak)
  const parentInvoices = invoices.filter(i => 
    i.status === 'SPLIT_REQUESTED' || i.status === 'SPLIT_APPROVED'
  )

  const handleApprove = async (invoiceId: string) => {
    if (!confirm('Setujui pengajuan cicilan ini?')) return
    setProcessingId(invoiceId)
    const res = await approveInvoiceSplit(invoiceId)
    if (res?.error) toast.error(res.error)
    else toast.success('Pengajuan disetujui, cicilan berhasil dibuat!')
    setProcessingId(null)
  }

  const handleReject = async (invoiceId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Wajib isi alasan penolakan')
      return
    }
    setProcessingId(invoiceId)
    const res = await rejectInvoiceSplit(invoiceId, rejectReason)
    if (res?.error) toast.error(res.error)
    else {
      toast.success('Pengajuan ditolak')
      setRejectingId(null)
      setRejectReason('')
    }
    setProcessingId(null)
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 bg-[#F8F9FA]/50">
        <h2 className="font-extrabold text-lg text-[#111827]">Pengajuan Cicilan Klien</h2>
        <p className="text-xs text-[#6B7280] font-medium mt-1">Kelola persetujuan dan riwayat tagihan yang dipecah oleh klien.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]/50">
              <th className="py-4 px-6 w-10"></th>
              <th className="py-4 px-6">Invoice Awal</th>
              <th className="py-4 px-6">Klien</th>
              <th className="py-4 px-6">Total Awal</th>
              <th className="py-4 px-6">Skema</th>
              <th className="py-4 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {parentInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-[#9CA3AF]">
                  Tidak ada pengajuan cicilan.
                </td>
              </tr>
            ) : (
              parentInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.client_id)
                const isExpanded = expandedId === inv.id
                const details = inv.split_request_details as any || {}
                const isRequested = inv.status === 'SPLIT_REQUESTED'
                
                // Cari anak-anaknya jika sudah APPROVED
                const children = invoices.filter(child => child.parent_invoice_id === inv.id)

                return (
                  <React.Fragment key={inv.id}>
                    <tr 
                      className={`border-b border-black/5 hover:bg-[#F8F9FA] transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    >
                      <td className="py-4 px-6 text-[#9CA3AF]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F3F4F6] text-[#4B5563] rounded-full text-[10px] font-bold">
                          <SplitSquareHorizontal size={12} /> {details.split_count || '?'}x Cicilan
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isRequested ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                            Menunggu Persetujuan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                            Telah Dipecah
                          </span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9FA]">
                        <td colSpan={6} className="p-0 border-b border-black/5">
                          <div className="p-6 bg-blue-50/20 border-l-4 border-[#2563EB]">
                            {isRequested && (
                              <div className="bg-white p-5 rounded-[16px] shadow-sm border border-black/5 mb-4">
                                <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Alasan Klien</h4>
                                <p className="text-sm text-[#111827] font-medium italic mb-4">"{details.client_reason}"</p>
                                
                                {rejectingId === inv.id ? (
                                  <div className="space-y-3">
                                    <textarea
                                      value={rejectReason}
                                      onChange={e => setRejectReason(e.target.value)}
                                      placeholder="Tulis alasan penolakan..."
                                      className="w-full p-3 bg-[#F8F9FA] border border-rose-200 rounded-[12px] text-sm focus:outline-none focus:border-rose-500"
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleReject(inv.id)} disabled={processingId === inv.id} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] text-xs font-bold">Tolak Sekarang</button>
                                      <button onClick={() => setRejectingId(null)} className="px-4 py-2 bg-white text-gray-600 rounded-[10px] text-xs font-bold border border-gray-200">Batal</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button onClick={() => handleApprove(inv.id)} disabled={processingId === inv.id} className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[10px] text-xs font-bold flex items-center gap-2">
                                      {processingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Setujui
                                    </button>
                                    <button onClick={() => setRejectingId(inv.id)} className="px-5 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-[10px] text-xs font-bold flex items-center gap-2">
                                      <XCircle size={14} /> Tolak
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isRequested && children.length > 0 && (
                              <div className="bg-white rounded-[16px] shadow-sm border border-black/5 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-[#F3F4F6] text-[10px] font-bold uppercase text-[#6B7280]">
                                      <th className="py-2.5 px-4">Anak Cicilan</th>
                                      <th className="py-2.5 px-4">Nominal</th>
                                      <th className="py-2.5 px-4">Jatuh Tempo</th>
                                      <th className="py-2.5 px-4">Status</th>
                                      <th className="py-2.5 px-4 text-right">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {children.map(child => (
                                      <tr key={child.id} className="border-t border-black/5">
                                        <td className="py-3 px-4">
                                          <p className="text-xs font-bold text-[#111827]">{child.title}</p>
                                          <p className="text-[10px] text-[#6B7280]">{child.invoice_number}</p>
                                        </td>
                                        <td className="py-3 px-4 text-xs font-extrabold text-[#2563EB]">
                                          Rp {child.amount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-medium text-[#4B5563]">
                                          {child.due_date ? new Date(child.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                            child.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            child.status === 'WAITING_CONFIRMATION' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-gray-100 text-gray-600'
                                          }`}>
                                            {child.status}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          <Link
                                            href={`/dashboard/pos/invoice/${child.id}`}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-black/10 hover:border-[#2563EB] hover:text-[#2563EB] text-[#4B5563] rounded-[8px] text-[10px] font-bold transition-all shadow-sm"
                                          >
                                            Detail <ArrowRight size={12} />
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
