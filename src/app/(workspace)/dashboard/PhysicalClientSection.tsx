'use client'

import { useState, useTransition } from 'react'
import { Package, ExternalLink, CheckCircle, AlertCircle, Truck, MapPin, Hash } from 'lucide-react'

interface Props {
  project: any
  physicalDetails: any
  accPhysicalDesign: (projectId: string) => Promise<{ error?: string; success?: boolean }>
  requestPhysicalRevision: (projectId: string, message: string) => Promise<{ error?: string; success?: boolean }>
  confirmPhysicalDelivery: (projectId: string) => Promise<{ error?: string; success?: boolean }>
}

export default function PhysicalClientSection({
  project,
  physicalDetails: pd,
  accPhysicalDesign,
  requestPhysicalRevision,
  confirmPhysicalDelivery,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [revisionMsg, setRevisionMsg] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showDesignReview = ['design', 'revision', 'revision_pending'].includes(project.status)
  const showShipping = ['shipped', 'ready_to_ship'].includes(project.status)
  const designUrl = pd?.design_file_url

  const handleAcc = () => {
    startTransition(async () => {
      const res = await accPhysicalDesign(project.id)
      if (res.error) setFeedback({ type: 'error', msg: res.error })
      else setFeedback({ type: 'success', msg: '✅ Desain di-ACC! Pesanan masuk antrean produksi.' })
    })
  }

  const handleRevision = () => {
    if (!revisionMsg.trim()) return
    startTransition(async () => {
      const res = await requestPhysicalRevision(project.id, revisionMsg)
      if (res.error) setFeedback({ type: 'error', msg: res.error })
      else {
        setFeedback({ type: 'success', msg: '✅ Permintaan revisi terkirim ke tim desain.' })
        setRevisionMsg('')
        setShowRevisionForm(false)
      }
    })
  }

  const handleConfirmDelivery = () => {
    startTransition(async () => {
      const res = await confirmPhysicalDelivery(project.id)
      if (res.error) setFeedback({ type: 'error', msg: res.error })
      else setFeedback({ type: 'success', msg: '✅ Terima kasih! Pesanan telah dikonfirmasi selesai.' })
    })
  }

  return (
    <div className="space-y-4">
      {/* Feedback toast */}
      {feedback && (
        <div className={`p-4 rounded-[14px] text-sm font-bold flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {feedback.msg}
          <button onClick={() => setFeedback(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ===== KARTU MOCKUP DESAIN ===== */}
      {showDesignReview && (
        <div className={`rounded-[20px] p-6 border-2 shadow-sm ${project.status === 'revision_pending' ? 'bg-amber-50 border-amber-300' : 'bg-white border-orange-200'}`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-extrabold text-[#111827] flex items-center gap-2">
                🎨 Review Mockup Desain
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {project.status === 'revision_pending'
                  ? 'Tim desain sedang mengerjakan revisi Anda. Harap tunggu.'
                  : 'Tim desain telah mengirimkan mockup. Silakan review dan berikan keputusan Anda.'}
              </p>
            </div>
            {project.status === 'revision_pending' && (
              <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full whitespace-nowrap animate-pulse">
                Dalam Revisi
              </span>
            )}
          </div>

          {/* Link Mockup */}
          {designUrl ? (
            <a
              href={designUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-[14px] hover:bg-orange-100 transition-colors mb-4 group"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ExternalLink size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-orange-800">Buka Link Mockup / Desain</p>
                <p className="text-xs text-orange-600 truncate">{designUrl}</p>
              </div>
              <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">Buka →</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-[14px] mb-4 opacity-60">
              <ExternalLink size={18} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-500">Belum ada link mockup dari desainer.</p>
            </div>
          )}

          {/* Tombol ACC / Minta Revisi - hanya tampil jika status masih 'design' */}
          {project.status === 'design' && (
            <div className="space-y-3">
              {!showRevisionForm ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAcc}
                    disabled={isPending || !designUrl}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-[14px] transition-all shadow-sm"
                  >
                    <CheckCircle size={18} />
                    {isPending ? 'Memproses...' : '✅ ACC Desain — Lanjut Produksi'}
                  </button>
                  <button
                    onClick={() => setShowRevisionForm(true)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-rose-400 hover:bg-rose-50 text-rose-600 font-bold rounded-[14px] transition-all"
                  >
                    <AlertCircle size={18} />
                    🔄 Minta Revisi
                  </button>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-[14px] p-4 space-y-3">
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Keterangan Revisi</p>
                  <textarea
                    value={revisionMsg}
                    onChange={e => setRevisionMsg(e.target.value)}
                    rows={3}
                    placeholder="Jelaskan bagian mana yang perlu diubah, misalnya: warna terlalu gelap, font kurang sesuai..."
                    className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRevision}
                      disabled={isPending || !revisionMsg.trim()}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
                    >
                      {isPending ? 'Mengirim...' : 'Kirim Permintaan Revisi'}
                    </button>
                    <button
                      onClick={() => setShowRevisionForm(false)}
                      className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
              {!designUrl && (
                <p className="text-xs text-center text-amber-600 font-medium">
                  ⚠️ Tombol ACC aktif setelah desainer mengunggah link mockup.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== KARTU SPESIFIKASI PESANAN ===== */}
      {pd && (
        <div className="bg-white rounded-[20px] border border-black/5 shadow-sm p-6">
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
            <Package size={18} className="text-orange-500" /> Spesifikasi Pesanan Anda
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {pd.item_type && (
              <div className="bg-[#F8F9FA] rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Jenis Barang</p>
                <p className="text-sm font-bold text-[#111827]">{pd.item_type}</p>
              </div>
            )}
            {pd.quantity && (
              <div className="bg-[#F8F9FA] rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Jumlah</p>
                <p className="text-sm font-bold text-[#111827]">{pd.quantity} pcs</p>
              </div>
            )}
            {pd.size_notes && (
              <div className="bg-[#F8F9FA] rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ukuran</p>
                <p className="text-sm font-bold text-[#111827]">{pd.size_notes}</p>
              </div>
            )}
            {pd.material_notes && (
              <div className="bg-[#F8F9FA] rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bahan</p>
                <p className="text-sm font-bold text-[#111827]">{pd.material_notes}</p>
              </div>
            )}
            {pd.color_notes && (
              <div className="bg-[#F8F9FA] rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Warna / Tinta</p>
                <p className="text-sm font-bold text-[#111827]">{pd.color_notes}</p>
              </div>
            )}
            {pd.production_deadline && (
              <div className="bg-orange-50 rounded-[12px] p-3 border border-orange-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-1">Target Produksi</p>
                <p className="text-sm font-bold text-orange-700">
                  {new Date(pd.production_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
          {pd.design_notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-[12px] border border-blue-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">Catatan Desain</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{pd.design_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== KARTU STATUS PENGIRIMAN ===== */}
      {showShipping && (
        <div className={`rounded-[20px] p-6 border-2 shadow-sm ${pd?.shipping_status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-300' : 'bg-blue-50 border-blue-200'}`}>
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
            <Truck size={18} className="text-blue-600" /> Status Pengiriman
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {pd?.shipping_courier && (
              <div className="bg-white rounded-[12px] p-3 border border-blue-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ekspedisi</p>
                <p className="text-sm font-bold text-[#111827]">{pd.shipping_courier}</p>
              </div>
            )}
            {pd?.tracking_number && (
              <div className="bg-white rounded-[12px] p-3 border border-blue-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1"><Hash size={10} />Nomor Resi</p>
                <p className="text-sm font-bold text-blue-700 font-mono">{pd.tracking_number}</p>
              </div>
            )}
            {pd?.shipping_address && (
              <div className="bg-white rounded-[12px] p-3 border border-blue-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1"><MapPin size={10} />Alamat</p>
                <p className="text-xs font-medium text-[#111827]">{pd.shipping_address}</p>
              </div>
            )}
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold mb-4 ${
            pd?.shipping_status === 'DELIVERED' ? 'bg-emerald-500 text-white' :
            pd?.shipping_status === 'SHIPPED' ? 'bg-blue-500 text-white animate-pulse' :
            'bg-gray-100 text-gray-600'
          }`}>
            {pd?.shipping_status === 'DELIVERED' ? '✅ DITERIMA' :
             pd?.shipping_status === 'SHIPPED' ? '🚚 DALAM PENGIRIMAN' :
             'Menunggu Pengiriman'}
          </div>

          {/* Tombol Konfirmasi Terima */}
          {project.status === 'shipped' && pd?.shipping_status !== 'DELIVERED' && (
            <button
              onClick={handleConfirmDelivery}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-[14px] transition-all shadow-sm"
            >
              <CheckCircle size={18} />
              {isPending ? 'Memproses...' : '✅ Konfirmasi Pesanan Sudah Diterima'}
            </button>
          )}

          {pd?.shipping_status === 'DELIVERED' && (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle size={18} />
              Pesanan telah dikonfirmasi diterima. Terima kasih!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
