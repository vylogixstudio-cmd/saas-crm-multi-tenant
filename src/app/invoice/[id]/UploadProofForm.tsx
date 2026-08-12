'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadPaymentProof } from './actions'
import { Upload, Loader2, CheckCircle, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'

export default function UploadProofForm({ invoiceId, existingProofUrl }: {
  invoiceId: string
  existingProofUrl: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(existingProofUrl)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | null) => {
    if (!file) return
    // Local preview
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const handleUpload = () => {
    const file = inputRef.current?.files?.[0]
    if (!file) { toast.error('Pilih file terlebih dahulu.'); return }

    const formData = new FormData()
    formData.append('proof', file)

    startTransition(async () => {
      const res = await uploadPaymentProof(invoiceId, formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Bukti pembayaran berhasil dikirim!', {
          description: 'Admin akan mengkonfirmasi pembayaran Anda.',
          duration: 6000,
        })
        if (res?.url) setPreview(res.url)
      }
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && inputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      inputRef.current.files = dt.files
      handleFile(file)
    }
  }

  if (existingProofUrl) {
    return (
      <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-[16px]">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-emerald-600" />
          <p className="text-sm font-bold text-emerald-700">Bukti pembayaran sudah dikirim</p>
        </div>
        <a href={existingProofUrl} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existingProofUrl}
            alt="Bukti Transfer"
            className="max-h-48 rounded-[10px] border border-emerald-200 hover:opacity-90 transition-opacity object-contain"
          />
        </a>
        <p className="text-xs text-emerald-600 mt-3 font-medium">
          Menunggu konfirmasi dari admin agensi. Anda akan dihubungi jika ada yang perlu diklarifikasi.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 p-5 bg-white border border-black/10 rounded-[16px] shadow-sm">
      <h3 className="font-extrabold text-sm text-[#111827] mb-1 flex items-center gap-2">
        <Upload size={15} className="text-[#2563EB]" /> Sudah Bayar? Upload Bukti Transfer
      </h3>
      <p className="text-xs text-[#6B7280] mb-4">Upload foto/screenshot bukti transfer. Admin akan mengkonfirmasi pembayaran Anda.</p>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-[12px] p-6 transition-all flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-[#2563EB] bg-[#EFF6FF]'
            : 'border-black/15 bg-[#F8F9FA] hover:border-[#2563EB]/40 hover:bg-blue-50/30'
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="max-h-48 rounded-[8px] object-contain" />
            <p className="text-xs text-[#6B7280] font-medium">Klik untuk ganti gambar</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-white border border-black/10 rounded-full flex items-center justify-center shadow-sm">
              <ImageIcon size={22} className="text-[#9CA3AF]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#111827]">Drag & drop, atau klik untuk pilih</p>
              <p className="text-xs text-[#9CA3AF] mt-1">JPG, PNG, WEBP — Maks. 5MB</p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0] || null)}
        />
      </div>

      {preview && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isPending}
          className="mt-3 w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-[12px] shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending
            ? <><Loader2 size={16} className="animate-spin" /> Mengupload...</>
            : <><Upload size={16} /> Kirim Bukti Pembayaran</>
          }
        </button>
      )}
    </div>
  )
}
