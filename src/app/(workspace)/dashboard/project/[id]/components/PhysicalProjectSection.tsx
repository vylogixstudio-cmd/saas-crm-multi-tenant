import { Package, Truck, RefreshCw, AlertTriangle, ExternalLink, Image as ImageIcon, Video } from 'lucide-react'

interface PhysicalDetails {
  item_type?: string | null
  quantity?: number | null
  material_notes?: string | null
  size_notes?: string | null
  color_notes?: string | null
  design_file_url?: string | null
  shipping_address?: string | null
  shipping_courier?: string | null
  tracking_number?: string | null
  shipping_status?: string | null
  production_deadline?: string | null
}

interface Props {
  details: PhysicalDetails | null
  isFinance: boolean
  isExecutor: boolean
  isReadOnly: boolean
  isCsRestricted?: boolean
  userRole?: string
  internalNotes?: any[]
}

const SHIPPING_STATUS_LABELS: Record<string, string> = {
  WAITING:          'Menunggu Produksi',
  IN_PRODUCTION:    'Sedang Diproduksi',
  READY_TO_SHIP:    'Siap Dikirim',
  SHIPPED:          'Sudah Dikirim',
  DELIVERED:        'Sudah Diterima',
  RETURN_REQUESTED: 'Klien Minta Retur',
  CANCELLED:        'Dibatalkan / Refund',
}

export default function PhysicalProjectSection({ 
  details, 
  isFinance, 
  isExecutor, 
  isReadOnly, 
  isCsRestricted, 
  userRole,
  internalNotes = []
}: Props) {
  const d = details ?? {}

  if (isFinance) {
    // Finance tidak bisa edit field fisik, data tetap dikirim via hidden
    return (
      <>
        <input type="hidden" name="itemType"          value={d.item_type ?? ''} />
        <input type="hidden" name="quantity"          value={d.quantity ?? 1} />
        <input type="hidden" name="materialNotes"     value={d.material_notes ?? ''} />
        <input type="hidden" name="sizeNotes"         value={d.size_notes ?? ''} />
        <input type="hidden" name="colorNotes"        value={d.color_notes ?? ''} />
        <input type="hidden" name="designFileUrl"     value={d.design_file_url ?? ''} />
        <input type="hidden" name="shippingAddress"   value={d.shipping_address ?? ''} />
        <input type="hidden" name="shippingCourier"   value={d.shipping_courier ?? ''} />
        <input type="hidden" name="trackingNumber"    value={d.tracking_number ?? ''} />
        <input type="hidden" name="shippingStatus"    value={d.shipping_status ?? 'WAITING'} />
        <input type="hidden" name="productionDeadline" value={d.production_deadline ? new Date(d.production_deadline).toISOString().split('T')[0] : ''} />
      </>
    )
  }

  const isShippingStaff = userRole === 'staff_shipping'
  const isShippingHistory = isShippingStaff && d.shipping_status === 'DELIVERED'
  const effectiveReadOnly = isReadOnly || isShippingHistory

  // Deteksi Riwayat Retur & Komplain
  const returnNotes = internalNotes.filter((n: any) => 
    n.content?.includes('[PENGIRIMAN ULANG RETUR]') || 
    n.content?.includes('[KLAIM RETUR & KOMPLAIN]') ||
    n.content?.includes('[KLAIM CACAT CETAK') ||
    n.content?.includes('[PESANAN DIBATALKAN / REFUND]')
  )
  const hasReturnHistory = returnNotes.length > 0

  return (
    <div className="space-y-6">

      {/* Informasi Barang (Sembunyikan untuk staf ekspedisi) */}
      {!isShippingStaff && (
      <div>
        <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
          <Package size={18} className="text-orange-500" /> Informasi Barang & Produksi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Tipe Barang</label>
            <input
              type="text"
              name="itemType"
              defaultValue={d.item_type ?? ''}
              readOnly={isReadOnly || isCsRestricted}
              placeholder="Contoh: Kaos, Banner, Mug, Piala..."
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Jumlah (Qty)</label>
            <input
              type="number"
              name="quantity"
              min="1"
              defaultValue={d.quantity ?? 1}
              readOnly={isReadOnly || isCsRestricted}
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold focus:border-[#2563EB] outline-none transition-all ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Ukuran / Size</label>
            <input
              type="text"
              name="sizeNotes"
              defaultValue={d.size_notes ?? ''}
              readOnly={isReadOnly || isCsRestricted}
              placeholder="Contoh: A3, XL, 60x160cm..."
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Warna / Spesifikasi</label>
            <input
              type="text"
              name="colorNotes"
              defaultValue={d.color_notes ?? ''}
              readOnly={isReadOnly || isCsRestricted}
              placeholder="Contoh: Merah full, pantone 485..."
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Catatan Bahan / Material</label>
            <textarea
              name="materialNotes"
              defaultValue={d.material_notes ?? ''}
              readOnly={isReadOnly || isCsRestricted}
              rows={3}
              placeholder="Contoh: Kertas Art Paper 300gsm, laminasi glossy..."
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all resize-none ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Link File Desain (Canva / Drive)</label>
            <input
              type="url"
              name="designFileUrl"
              defaultValue={d.design_file_url ?? ''}
              readOnly={isReadOnly || isCsRestricted}
              placeholder="https://canva.com/design/... atau drive.google.com/..."
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Target Selesai Produksi</label>
            <input
              type="date"
              name="productionDeadline"
              defaultValue={d.production_deadline ? new Date(d.production_deadline).toISOString().split('T')[0] : ''}
              readOnly={isReadOnly || isCsRestricted}
              className={`w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all ${isReadOnly || isCsRestricted ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
        </div>
      </div>
      )}

      {/* Informasi Pengiriman */}
      <div className="bg-[#111827] rounded-[20px] shadow-lg border border-white/5 p-6 md:p-8 text-white relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
          <Truck size={120} className="text-orange-400" />
        </div>

        <div className="flex flex-wrap justify-between items-start gap-3 relative z-10">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Truck size={20} className="text-orange-400" /> Informasi Pengiriman
            </h3>
            {hasReturnHistory && (
              <p className="text-xs text-orange-300/90 font-medium mt-1 flex items-center gap-1.5">
                <RefreshCw size={13} className="text-orange-400" /> Pesanan ini memiliki riwayat retur / komplain unboxing.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasReturnHistory && (
              <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <RefreshCw size={11} /> Pernah Diretur
              </span>
            )}
            <div className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md border ${
              d.shipping_status === 'DELIVERED' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                : d.shipping_status === 'SHIPPED'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/20'
                : d.shipping_status === 'RETURN_REQUESTED'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : d.shipping_status === 'CANCELLED'
                ? 'bg-rose-500/30 text-rose-300 border-rose-500/40'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/20'
            }`}>
              {SHIPPING_STATUS_LABELS[d.shipping_status ?? 'WAITING'] ?? 'Menunggu'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Status Pengiriman</label>
            {effectiveReadOnly ? (
              <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium text-white">
                {SHIPPING_STATUS_LABELS[d.shipping_status ?? 'WAITING'] ?? 'Menunggu'}
              </div>
            ) : (
              <select
                name="shippingStatus"
                defaultValue={d.shipping_status ?? 'WAITING'}
                className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-orange-500 outline-none text-white cursor-pointer transition-all"
              >
                {Object.entries(SHIPPING_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-[#1F2937]">{label}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Kurir</label>
            {effectiveReadOnly ? (
              <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium text-white">
                {d.shipping_courier || '-'}
              </div>
            ) : (
              <input
                type="text"
                name="shippingCourier"
                defaultValue={d.shipping_courier ?? ''}
                placeholder="JNE / J&T / SiCepat / Anteraja..."
                className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-orange-500 outline-none text-white transition-all placeholder:text-white/20"
              />
            )}
          </div>
        </div>

        <div className="relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Nomor Resi Pengiriman</label>
          {effectiveReadOnly ? (
            <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium font-mono text-white">
              {d.tracking_number || '-'}
            </div>
          ) : (
            <input
              type="text"
              name="trackingNumber"
              defaultValue={d.tracking_number ?? ''}
              placeholder="Contoh: JNE00012345678..."
              className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium font-mono focus:border-orange-500 outline-none text-orange-400 transition-all placeholder:text-white/20 placeholder:font-sans"
            />
          )}
        </div>

        <div className="relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Alamat Pengiriman Klien</label>
          {effectiveReadOnly ? (
            <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium text-white whitespace-pre-wrap min-h-[80px]">
              {d.shipping_address || 'Tidak ada alamat pengiriman.'}
            </div>
          ) : (
            <textarea
              name="shippingAddress"
              defaultValue={d.shipping_address ?? ''}
              rows={3}
              placeholder="Masukkan alamat lengkap pengiriman..."
              className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-orange-500 outline-none text-white transition-all resize-none placeholder:text-white/20"
            />
          )}
        </div>

        {/* ── RIWAYAT RETUR & KOMPLAIN ── */}
        {hasReturnHistory && (
          <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <RefreshCw size={15} /> Riwayat Retur & Komplain Pesanan ({returnNotes.length})
            </h4>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {returnNotes.map((note: any) => {
                const isReturnReship = note.content?.includes('[PENGIRIMAN ULANG RETUR]')
                const isCancelled = note.content?.includes('[PESANAN DIBATALKAN')
                
                return (
                  <div 
                    key={note.id} 
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                      isReturnReship 
                        ? 'bg-orange-950/40 border-orange-500/30 text-orange-200' 
                        : isCancelled
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                        : 'bg-gray-800/80 border-white/10 text-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/50">
                      <span>{note.profiles?.full_name || 'Sistem'}</span>
                      <span>{new Date(note.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="whitespace-pre-wrap font-medium">
                      {note.content}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
