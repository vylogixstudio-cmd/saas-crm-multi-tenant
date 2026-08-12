'use client'

import { useState } from 'react'
import { Check, X, Clock, DollarSign, FileText, CheckCircle } from 'lucide-react'
import { updateProcurementStatus } from './actions'

interface Profile {
  full_name: string
  email: string
}

interface ProcurementRequest {
  id: string
  title: string
  amount: number
  description: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  created_at: string
  requested_by: Profile | null
  approved_by: Profile | null
}

export default function FinanceProcurementClient({ 
  requests,
  currentUserId
}: { 
  requests: ProcurementRequest[],
  currentUserId: string
}) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Yakin ingin mengubah status menjadi ${newStatus}?`)) return
    
    setProcessingId(id)
    try {
      const res = await updateProcurementStatus(id, newStatus)
      if (res?.error) {
        alert(res.error)
      }
    } catch (err) {
      alert('Terjadi kesalahan')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> MENUNGGU ACC</span>
      case 'APPROVED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><Check size={12}/> DISETUJUI</span>
      case 'PAID': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><DollarSign size={12}/> DANA CAIR</span>
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><X size={12}/> DITOLAK</span>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Tujuan Pengajuan</th>
                <th className="px-6 py-4 font-semibold">Nominal (Rp)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Diajukan Oleh</th>
                <th className="px-6 py-4 font-semibold">Aksi (Keuangan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    Belum ada riwayat pengajuan belanja.
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{req.title}</p>
                      {req.description && <p className="text-gray-500 text-xs mt-1 max-w-xs truncate">{req.description}</p>}
                      <p className="text-gray-400 text-[10px] mt-2">
                        {new Date(req.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      Rp {req.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                      {req.approved_by && (
                        <p className="text-[10px] text-gray-500 mt-1">oleh: {req.approved_by.full_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {req.requested_by?.full_name || req.requested_by?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button 
                            disabled={processingId === req.id}
                            onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Setujui"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            disabled={processingId === req.id}
                            onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      
                      {req.status === 'APPROVED' && (
                        <button 
                          disabled={processingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'PAID')}
                          className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                        >
                          <CheckCircle size={14} /> Cairkan Dana
                        </button>
                      )}

                      {req.status === 'PAID' && (
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Selesai</span>
                      )}
                      
                      {req.status === 'REJECTED' && (
                        <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200">Ditolak</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
