'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { updateClientAccount } from '@/app/(workspace)/dashboard/actions'

export default function ClientSettings({ client }: { client: any }) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    const res = await updateClientAccount(client.id, formData)
    
    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      setSuccessMsg('Profil klien berhasil diperbarui.')
    }
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="mt-6 pt-6 border-t border-black/5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-4">Pengaturan Akun Klien</h3>
      
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Ubah Nomor WhatsApp</label>
        <input 
          type="text" 
          name="whatsapp_number" 
          defaultValue={client.whatsapp_number || ''}
          placeholder="Cth: 08123456789" 
          className="w-full px-4 py-2.5 rounded-[12px] bg-white border border-black/10 text-sm focus:outline-none focus:border-[#2563EB] transition-colors" 
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Reset Password Akses</label>
        <input 
          type="password" 
          name="password" 
          minLength={6} 
          placeholder="Isi jika ingin mereset password (Min 6 karakter)" 
          className="w-full px-4 py-2.5 rounded-[12px] bg-white border border-black/10 text-sm focus:outline-none focus:border-[#2563EB] transition-colors" 
        />
        <p className="text-[10px] text-[#6B7280] mt-1">Biarkan kosong jika tidak ingin mengubah password.</p>
      </div>

      {errorMsg && (
        <div className="text-rose-500 text-xs font-bold bg-rose-50 p-2 rounded-md">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="text-emerald-500 text-xs font-bold bg-emerald-50 p-2 rounded-md">
          {successMsg}
        </div>
      )}

      <div>
        <button 
          disabled={loading} 
          type="submit" 
          className="bg-[#111827] hover:bg-black text-white font-bold py-2.5 px-4 rounded-[12px] text-xs transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={14} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
