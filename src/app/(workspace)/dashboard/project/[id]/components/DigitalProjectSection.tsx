import { LinkIcon, Server } from 'lucide-react'

interface DigitalDetails {
  preview_url?: string | null
  link_youtube?: string | null
  link_cloudinary?: string | null
  domain_name?: string | null
  domain_expiry_date?: string | null
  hosting_info?: string | null
  warranty_months?: number | null
  warranty_expired_at?: string | null
  platform?: string | null
  design_notes?: string | null
}

interface Props {
  details: DigitalDetails | null
  isFinance: boolean
  isExecutor: boolean
  serviceType?: string | null
  serviceClass?: string | null
  isReadOnly?: boolean
  isUpdateMode?: boolean
}

export default function DigitalProjectSection({ details, isFinance, isExecutor, serviceType, serviceClass, isReadOnly = false, isUpdateMode = false }: Props) {
  const d = details ?? {}

  if (isFinance) {
    return (
      <>
        <input type="hidden" name="previewUrl"       value={d.preview_url ?? ''} />
        <input type="hidden" name="linkYoutube"      value={d.link_youtube ?? ''} />
        <input type="hidden" name="linkCloudinary"   value={d.link_cloudinary ?? ''} />
        <input type="hidden" name="warrantyMonths"   value={d.warranty_months ?? 0} />
        <input type="hidden" name="warrantyExpiredAt" value={d.warranty_expired_at ? new Date(d.warranty_expired_at).toISOString().split('T')[0] : ''} />
        <input type="hidden" name="domainName"       value={d.domain_name ?? ''} />
        <input type="hidden" name="domainExpiryDate" value={d.domain_expiry_date ? new Date(d.domain_expiry_date).toISOString().split('T')[0] : ''} />
        <input type="hidden" name="hostingInfo"      value={d.hosting_info ?? ''} />
        <input type="hidden" name="platform"         value={d.platform ?? ''} />
        <input type="hidden" name="designNotes"      value={d.design_notes ?? ''} />
      </>
    )
  }

  const hasAnyLink = d.preview_url || d.link_youtube || d.link_cloudinary

  return (
    <div className="space-y-6">
      {/* Spesifikasi Proyek (Platform & Kebutuhan) */}
      {(!isReadOnly || d.platform || d.design_notes) && (
        <div>
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
            <LinkIcon size={18} className="text-purple-500" /> Platform & Kebutuhan Proyek
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Platform / Tipe Layanan</label>
              {isReadOnly ? (
                <div className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-[#111827]">
                  {d.platform || '-'}
                </div>
              ) : (
                <input type="text" name="platform" defaultValue={d.platform ?? ''} placeholder="Misal: Wordpress, Shopify, atau Logo Design" className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all" />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Catatan Desain & Kebutuhan</label>
              {isReadOnly ? (
                <div className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-[#111827] whitespace-pre-wrap">
                  {d.design_notes || 'Tidak ada catatan'}
                </div>
              ) : (
                <textarea name="designNotes" defaultValue={d.design_notes ?? ''} rows={4} placeholder="Tuliskan detail kebutuhan, preferensi warna, contoh referensi..." className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all resize-none" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tautan Aset & Hasil */}
      {(!isReadOnly || hasAnyLink) && (
        <div>
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
            <LinkIcon size={18} className="text-purple-500" /> Tautan Aset & Hasil
          </h3>
          <div className="space-y-4">
            {(!isReadOnly || d.preview_url) && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Live Preview URL</label>
                {isReadOnly ? (
                  <a href={d.preview_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-blue-600 hover:underline break-all">
                    {d.preview_url}
                  </a>
                ) : (
                  <input type="url" name="previewUrl" defaultValue={d.preview_url ?? ''} placeholder="https://..." className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all" />
                )}
              </div>
            )}
            {(!isReadOnly || d.link_youtube) && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Link YouTube (Video Draft)</label>
                {isReadOnly ? (
                  <a href={d.link_youtube || '#'} target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-blue-600 hover:underline break-all">
                    {d.link_youtube}
                  </a>
                ) : (
                  <input type="url" name="linkYoutube" defaultValue={d.link_youtube ?? ''} placeholder="https://youtube.com/..." className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all" />
                )}
              </div>
            )}
            {(!isReadOnly || d.link_cloudinary) && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Link Cloudinary (Folder Aset)</label>
                {isReadOnly ? (
                  <a href={d.link_cloudinary || '#'} target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-blue-600 hover:underline break-all">
                    {d.link_cloudinary}
                  </a>
                ) : (
                  <input type="url" name="linkCloudinary" defaultValue={d.link_cloudinary ?? ''} placeholder="https://cloudinary.com/..." className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none transition-all" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deployment & Garansi */}
      {!isExecutor && !isUpdateMode && (
        <div className="bg-[#111827] rounded-[20px] shadow-lg border border-white/5 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
            <Server size={120} className="text-emerald-500" />
          </div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Server size={20} className="text-emerald-400" /> Informasi Deployment & Garansi
            </h3>
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-md border border-emerald-500/20">
              PROYEK FINISH LINE
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4 relative z-10">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Durasi Garansi</label>
              {isReadOnly ? (
                <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-bold text-white">
                  {d.warranty_months === 0 ? 'Tidak Ada Garansi' : `${d.warranty_months} Bulan`}
                </div>
              ) : (
                <select name="warrantyMonths" defaultValue={d.warranty_months ?? 0} className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-emerald-500 outline-none text-white cursor-pointer transition-all">
                  <option value="0" className="bg-[#1F2937]">Tidak Ada Garansi</option>
                  <option value="1" className="bg-[#1F2937]">1 Bulan</option>
                  <option value="3" className="bg-[#1F2937]">3 Bulan</option>
                  <option value="6" className="bg-[#1F2937]">6 Bulan</option>
                  <option value="12" className="bg-[#1F2937]">12 Bulan</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Tanggal Habis Garansi</label>
              {isReadOnly ? (
                <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-bold text-white">
                  {d.warranty_expired_at ? new Date(d.warranty_expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              ) : (
                <input type="date" name="warrantyExpiredAt" defaultValue={d.warranty_expired_at ? new Date(d.warranty_expired_at).toISOString().split('T')[0] : ''} className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-emerald-500 outline-none text-white transition-all [color-scheme:dark]" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4 relative z-10">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Nama Domain</label>
              {isReadOnly ? (
                <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-bold text-white">
                  {d.domain_name || '-'}
                </div>
              ) : (
                <input type="text" name="domainName" defaultValue={d.domain_name ?? ''} placeholder="contoh.com" className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-emerald-500 outline-none text-white transition-all placeholder:text-white/20" />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Tanggal Expired Domain</label>
              {isReadOnly ? (
                <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-bold text-white">
                  {d.domain_expiry_date ? new Date(d.domain_expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              ) : (
                <input type="date" name="domainExpiryDate" defaultValue={d.domain_expiry_date ? new Date(d.domain_expiry_date).toISOString().split('T')[0] : ''} className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium focus:border-emerald-500 outline-none text-white transition-all [color-scheme:dark]" />
              )}
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Informasi Hosting/Server</label>
            {isReadOnly ? (
              <div className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-bold text-emerald-400 font-mono whitespace-pre-wrap">
                {d.hosting_info || '-'}
              </div>
            ) : (
              <textarea name="hostingInfo" defaultValue={d.hosting_info ?? ''} rows={4} placeholder="Detail login panel..." className="w-full px-4 py-3 bg-[#1F2937] border border-white/10 rounded-[12px] text-sm font-medium font-mono focus:border-emerald-500 outline-none text-emerald-400 transition-all resize-none placeholder:text-white/20 placeholder:font-sans" />
            )}
          </div>
        </div>
      )}

      {(isExecutor || isUpdateMode) && (
        <>
          <input type="hidden" name="warrantyMonths"   value={d.warranty_months ?? 0} />
          <input type="hidden" name="warrantyExpiredAt" value={d.warranty_expired_at ? new Date(d.warranty_expired_at).toISOString().split('T')[0] : ''} />
          <input type="hidden" name="domainName"       value={d.domain_name ?? ''} />
          <input type="hidden" name="domainExpiryDate" value={d.domain_expiry_date ? new Date(d.domain_expiry_date).toISOString().split('T')[0] : ''} />
          <input type="hidden" name="hostingInfo"      value={d.hosting_info ?? ''} />
          <input type="hidden" name="platform"         value={d.platform ?? ''} />
          <input type="hidden" name="designNotes"      value={d.design_notes ?? ''} />
        </>
      )}
    </div>
  )
}
