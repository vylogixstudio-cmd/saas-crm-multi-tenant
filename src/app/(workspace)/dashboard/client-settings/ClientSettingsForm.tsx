'use client'

import { useState } from 'react'
import { updateClientProfile } from './actions'
import { Check, Lock, Phone, User } from 'lucide-react'

export default function ClientSettingsForm({ 
  initialName, 
  initialWhatsapp 
}: { 
  initialName: string
  initialWhatsapp: string 
}) {
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    setSuccess(false)
    
    const res = await updateClientProfile(formData)
    
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      // Reset password field
      const form = document.getElementById('client-settings-form') as HTMLFormElement
      if (form) form.password.value = ''
    }
    setIsPending(false)
  }

  return (
    <form id="client-settings-form" action={handleSubmit} className="space-y-6">
      {/* Name Field (Read-only) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2 flex items-center gap-2">
          <User size={14} /> Nama Lengkap (Dikunci)
        </label>
        <div className="relative">
          <input 
            type="text" 
            value={initialName} 
            disabled 
            className="w-full px-4 py-3 bg-gray-100/50 border border-black/5 rounded-[12px] text-sm font-medium text-gray-500 cursor-not-allowed"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={14} />
          </div>
        </div>
      </div>

      {/* WhatsApp Field */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2 flex items-center gap-2">
          <Phone size={14} /> Nomor WhatsApp
        </label>
        <input 
          type="tel" 
          name="whatsapp_number" 
          defaultValue={initialWhatsapp} 
          placeholder="Contoh: 08123456789"
          className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
        />
      </div>

      <div className="h-px bg-gray-100 my-6"></div>

      {/* Password Field */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2 flex items-center gap-2">
          <Lock size={14} /> Ganti Password
        </label>
        <p className="text-[10px] text-gray-400 mb-2">Kosongkan jika tidak ingin mengubah password saat ini.</p>
        <input 
          type="password" 
          name="password" 
          placeholder="Password Baru (min 6 karakter)"
          className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-[12px] text-rose-600 text-xs font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-[12px] text-emerald-600 text-xs font-medium flex items-center gap-2">
          <Check size={16} /> Profil berhasil diperbarui.
        </div>
      )}

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-[12px] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
