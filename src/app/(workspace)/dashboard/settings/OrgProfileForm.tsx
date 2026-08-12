'use client'

import { useRef, useState, useTransition } from 'react'
import { updateOrganizationSettings } from './actions'
import {
  Building2,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ImageIcon,
} from 'lucide-react'

interface OrgProfileFormProps {
  orgId: string
  initialName: string
  initialTagline: string
  initialLogoUrl: string | null
  initialQrisUrl?: string | null
  initialLogRetentionDays: number
  initialWhatsAppNumber?: string | null
  initialBankName?: string | null
  initialBankAccountNumber?: string | null
  initialBankAccountName?: string | null
  initialCompanyAddress?: string | null
  initialCompanyEmail?: string | null
  initialMonthlySalesTarget?: number
}

// ── Component ────────────────────────────────────────────────────────────────
export default function OrgProfileForm({
  orgId,
  initialName,
  initialTagline,
  initialLogoUrl,
  initialQrisUrl,
  initialLogRetentionDays,
  initialWhatsAppNumber,
  initialBankName,
  initialBankAccountNumber,
  initialBankAccountName,
  initialCompanyAddress,
  initialCompanyEmail,
  initialMonthlySalesTarget = 0,
}: OrgProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [warningMsg, setWarningMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialLogoUrl)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [qrisPreviewUrl, setQrisPreviewUrl] = useState<string | null>(initialQrisUrl || null)
  const [selectedQrisFileName, setSelectedQrisFileName] = useState<string | null>(null)
  const qrisInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      setErrorMsg('Ukuran logo maksimal 500KB.')
      e.target.value = ''
      return
    }

    setSelectedFileName(file.name)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setErrorMsg(null)
  }

  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) { // 1MB
      setErrorMsg('Ukuran gambar QRIS maksimal 1MB.')
      e.target.value = ''
      return
    }

    setSelectedQrisFileName(file.name)
    const objectUrl = URL.createObjectURL(file)
    setQrisPreviewUrl(objectUrl)
    setErrorMsg(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const result = await updateOrganizationSettings(formData)
        if (result?.error) {
          setErrorMsg(result.error)
          setSuccessMsg(null)
          setWarningMsg(null)
        } else {
          setErrorMsg(null)
          setSelectedFileName(null)
          setSelectedQrisFileName(null)
          // Show warning (logo failed) or clean success
          if ('warning' in result && result.warning) {
            setWarningMsg(result.warning as string)
            setSuccessMsg(null)
          } else {
            setSuccessMsg('Pengaturan agensi berhasil disimpan!')
            setWarningMsg(null)
          }
        }
      } catch {
        setErrorMsg('Terjadi kesalahan yang tidak terduga. Coba lagi.')
        setSuccessMsg(null)
        setWarningMsg(null)
      }
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-4 p-6 border-b border-black/5">
        <div className="p-3 bg-[#EFF6FF] rounded-[14px] text-[#2563EB] shrink-0">
          <Building2 size={22} />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#111827] font-['Plus_Jakarta_Sans']">
            Profil &amp; Branding Agensi
          </h2>
          <p className="text-[#4B5563] text-xs mt-0.5">
            Ubah nama, tagline, dan logo yang tampil di seluruh platform.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="p-6 space-y-6"
      >
        {/* Hidden org id (not strictly needed by action but handy) */}
        <input type="hidden" name="orgId" value={orgId} />

        {/* Two-column layout on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Text fields */}
          <div className="space-y-5">
            {/* Agency Name */}
            <div>
              <label
                htmlFor="settings-name"
                className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
              >
                Nama Agensi / Studio
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                id="settings-name"
                name="name"
                type="text"
                required
                defaultValue={initialName}
                placeholder="Contoh: Vylogix Studio"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>

            {/* Tagline */}
            <div>
              <label
                htmlFor="settings-tagline"
                className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
              >
                Tagline Studio
              </label>
              <input
                id="settings-tagline"
                name="tagline"
                type="text"
                defaultValue={initialTagline || 'Bridging Design and Code'}
                placeholder="Bridging Design and Code"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
                Kalimat singkat yang menggambarkan agensi Anda.
              </p>
            </div>



            {/* Log Retention */}
            <div>
              <label
                htmlFor="settings-log-retention"
                className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
              >
                Masa Simpan Audit Log (Hari)
              </label>
              <input
                id="settings-log-retention"
                name="log_retention_days"
                type="number"
                min="1"
                defaultValue={initialLogRetentionDays}
                placeholder="Contoh: 30"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
                Log sistem otomatis dihapus setelah masa simpan lewat (default: 30 hari).
              </p>
            </div>
            
            {/* Target Penjualan Bulanan */}
            <div>
              <label
                htmlFor="settings-monthly-sales-target"
                className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
              >
                Target Penjualan Bulanan (Rp)
              </label>
              <input
                id="settings-monthly-sales-target"
                name="monthlySalesTarget"
                type="number"
                min="0"
                defaultValue={initialMonthlySalesTarget}
                placeholder="Contoh: 50000000"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
                Digunakan untuk grafik progress pada Dasbor.
              </p>
            </div>
          </div>

          {/* Right: Logo upload */}
          <div>
            <span className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">
              Logo Agensi
            </span>

            {/* Preview Box */}
            <div
              className="relative flex flex-col items-center justify-center gap-3 h-36 w-full bg-[#F8F9FA] border-2 border-dashed border-black/10 rounded-[14px] cursor-pointer hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/30 transition-all group overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload logo agensi"
            >
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="max-h-24 max-w-[80%] object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[11px] font-bold text-[#2563EB] bg-white/90 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                      Ganti Logo
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={28} className="text-black/20" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-[#4B5563]">
                      <span className="text-[#2563EB]">Klik untuk upload</span>
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                      PNG, JPG, SVG — Maks. 5MB
                    </p>
                  </div>
                  <UploadCloud size={16} className="text-[#9CA3AF]" />
                </>
              )}
            </div>

            {/* Hidden actual file input */}
            <input
              ref={fileInputRef}
              id="settings-logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFileName && (
              <p className="text-[11px] font-medium text-emerald-600 mt-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                {selectedFileName} dipilih
              </p>
            )}
          </div>
        </div>

        {/* Row: Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/5">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="settings-company-address"
                className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
              >
                Alamat Lengkap Kantor
              </label>
              <textarea
                id="settings-company-address"
                name="company_address"
                rows={3}
                defaultValue={initialCompanyAddress || ''}
                placeholder="Contoh: Jl. Sudirman No. 123, Jakarta Selatan"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all resize-none"
              />
            </div>
            <div>
              <label
                htmlFor="settings-whatsapp"
                className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
              >
                Nomor WhatsApp Agensi
              </label>
              <input
                id="settings-whatsapp"
                name="whatsapp_number"
                type="text"
                defaultValue={initialWhatsAppNumber || ''}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="settings-company-email"
              className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2"
            >
              Email Resmi Perusahaan
            </label>
            <input
              id="settings-company-email"
              name="company_email"
              type="email"
              defaultValue={initialCompanyEmail || ''}
              placeholder="Contoh: hello@vylogix.com"
              className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
              Alamat kantor, kontak WA, dan email akan dicantumkan pada bagian kop surat Invoice.
            </p>
          </div>
        </div>

        {/* Row: Bank Info */}
        <div className="pt-4 border-t border-black/5">
          <span className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-4">
            Informasi Rekening Bank (Muncul di Invoice)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5">
                Nama Bank
              </label>
              <input
                name="bank_name"
                type="text"
                defaultValue={initialBankName || ''}
                placeholder="Contoh: BCA / Mandiri"
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5">
                Nomor Rekening
              </label>
              <input
                name="bank_account_number"
                type="text"
                defaultValue={initialBankAccountNumber || ''}
                placeholder="Contoh: 1234567890"
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5">
                Atas Nama (A/N)
              </label>
              <input
                name="bank_account_name"
                type="text"
                defaultValue={initialBankAccountName || ''}
                placeholder="Contoh: PT Vylogix Studio"
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
            </div>
          </div>
        </div>
        
        {/* Row 2: QRIS Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/5">
          <div className="space-y-2">
            <span className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">
              Gambar QRIS Statis
            </span>
            <p className="text-[11px] text-[#9CA3AF] font-medium leading-relaxed">
              Upload foto/screenshot QRIS statis organisasi Anda di sini. Gambar ini akan otomatis 
              ditampilkan pada saat klien mencetak invoice Kasir (POS) agar mereka bisa memindai 
              kode QR dan melakukan pembayaran secara langsung.
            </p>
          </div>
          <div>
            {/* Preview Box QRIS */}
            <div
              className="relative flex flex-col items-center justify-center gap-3 h-48 w-full bg-[#F8F9FA] border-2 border-dashed border-black/10 rounded-[14px] cursor-pointer hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/30 transition-all group overflow-hidden"
              onClick={() => qrisInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && qrisInputRef.current?.click()}
              aria-label="Upload gambar QRIS"
            >
              {qrisPreviewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisPreviewUrl}
                    alt="QRIS preview"
                    className="h-full w-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[11px] font-bold text-[#2563EB] bg-white/90 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                      Ganti QRIS
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={28} className="text-black/20" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-[#4B5563]">
                      <span className="text-[#2563EB]">Klik untuk upload QRIS</span>
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                      PNG, JPG — Maks. 1MB
                    </p>
                  </div>
                  <UploadCloud size={16} className="text-[#9CA3AF]" />
                </>
              )}
            </div>

            {/* Hidden actual file input */}
            <input
              ref={qrisInputRef}
              id="settings-qris"
              name="qris"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleQrisChange}
            />

            {selectedQrisFileName && (
              <p className="text-[11px] font-medium text-emerald-600 mt-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                {selectedQrisFileName} dipilih
              </p>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-[12px]">
            <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
          </div>
        )}
        {warningMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-[12px]">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-amber-700">{warningMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-[12px]">
            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">{successMsg}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold text-sm px-6 py-3 rounded-[12px] transition-all shadow-sm shadow-[#2563EB]/20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
