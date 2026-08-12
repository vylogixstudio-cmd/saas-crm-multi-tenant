'use client'

import { useState } from 'react'
import { SplitSquareHorizontal, Info } from 'lucide-react'
import SplitInvoiceModal from './SplitInvoiceModal'

export default function SplitInvoiceClient({ invoice }: { invoice: any }) {
  const [showModal, setShowModal] = useState(false)

  if (invoice.status === 'SPLIT_REQUESTED') {
    const details = invoice.split_request_details as any || {}
    return (
      <div className="max-w-4xl mx-auto mt-6 bg-amber-50 border border-amber-200 rounded-[20px] p-6 print:hidden">
        <h3 className="font-extrabold text-sm text-amber-700 mb-2 flex items-center gap-2">
          <SplitSquareHorizontal size={16} /> Menunggu Persetujuan Pemecahan Cicilan
        </h3>
        <p className="text-xs font-medium text-amber-600 mb-2">
          Anda telah mengajukan untuk memecah tagihan ini menjadi {details.split_count}x cicilan dengan alasan:
          <br/><span className="italic">"{details.client_reason}"</span>
        </p>
        <p className="text-[10px] text-amber-600">Pihak kasir akan segera memproses pengajuan Anda. Selama masa ini, proses pembayaran ditahan sementara.</p>
      </div>
    )
  }

  // Hanya tampil jika invoice PENDING dan belum pernah split requested
  if (invoice.status !== 'PENDING') return null

  // Tampilkan peringatan penolakan jika ada
  const details = invoice.split_request_details as any
  const rejectionReason = details?.pos_rejection_reason

  return (
    <div className="max-w-4xl mx-auto mt-6 print:hidden">
      {rejectionReason && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-[16px] mb-4">
          <h4 className="text-xs font-bold text-rose-700 mb-1">Pengajuan Cicilan Ditolak</h4>
          <p className="text-xs font-medium text-rose-600">Catatan Kasir: {rejectionReason}</p>
        </div>
      )}
      
      <div className="bg-[#F8F9FA] border border-black/10 rounded-[16px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-[#111827] mb-1 flex items-center gap-2">
            <SplitSquareHorizontal size={16} className="text-[#2563EB]" /> Ringankan Beban Tagihan Anda
          </h3>
          <p className="text-xs text-[#6B7280]">Ajukan pembayaran bertahap (cicilan) untuk tagihan ini.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="shrink-0 px-5 py-2.5 bg-white border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 rounded-[12px] text-xs font-bold transition-all shadow-sm w-full sm:w-auto"
        >
          Ajukan Cicilan
        </button>
      </div>

      {showModal && (
        <SplitInvoiceModal invoice={invoice} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
