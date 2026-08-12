'use client'

import { useState } from 'react'
import { Plus, Check, X, Clock, DollarSign, FileText } from 'lucide-react'
import { createProcurementRequest } from './actions'

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
}

export default function ProcurementClient({ 
  requests,
  currentUserId
}: { 
  requests: ProcurementRequest[],
  currentUserId: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    try {
      const res = await createProcurementRequest(formData)
      if (res?.error) {
        alert(res.error)
      } else {
        setIsModalOpen(false)
        // refresh is handled by server action revalidatePath
      }
    } catch (err) {
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-bold flex items-center gap-1"><Clock size={12}/> MENUNGGU ACC</span>
      case 'APPROVED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold flex items-center gap-1"><Check size={12}/> DISETUJUI</span>
      case 'PAID': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-bold flex items-center gap-1"><DollarSign size={12}/> DANA CAIR</span>
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-bold flex items-center gap-1"><X size={12}/> DITOLAK</span>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#111827] text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          Buat Pengajuan Baru
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Tujuan Pengajuan</th>
                <th className="px-6 py-4 font-semibold">Nominal (Rp)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Diajukan Oleh</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
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
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      Rp {req.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {req.requested_by?.full_name || req.requested_by?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(req.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Pengajuan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Buat Pengajuan Dana</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form action={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan / Nama Pengajuan</label>
                <input 
                  type="text" 
                  name="title" 
                  required
                  placeholder="Contoh: Beli Tinta Printer, Kain Putih 2 Roll"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required
                  min="1000"
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Alasan</label>
                <textarea 
                  name="description" 
                  rows={3}
                  placeholder="Catatan tambahan untuk tim Keuangan (opsional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Ajukan Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
