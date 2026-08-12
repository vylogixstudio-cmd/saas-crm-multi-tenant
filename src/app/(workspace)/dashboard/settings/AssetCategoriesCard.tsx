'use client'

import { useState, useTransition } from 'react'
import { Layers, Plus, Trash2, CheckCircle2, XCircle, RotateCcw, Tag } from 'lucide-react'
import { updateCustomAssetCategories } from './actions'

interface AssetCategoriesCardProps {
  organizationId: string
  initialCategories?: string[] | null
  industryType?: string | null
}

const DEFAULT_DIGITAL = [
  'Logo & Branding',
  'Font & Tipografi',
  'Desain Siap Cetak',
  'Dokumen & Copywriting',
  'Gambar Konten Web/App',
  'Database / File Teknis',
  'Lainnya'
]

const DEFAULT_PHYSICAL = [
  'Desain Siap Cetak (AI / PDF / CDR)',
  'File Logo / Sablon',
  'Data Ukuran & Pola',
  'Foto Sampel / Referensi Warna',
  'Dokumen / Nota Pembelian',
  'Lainnya'
]

export default function AssetCategoriesCard({
  organizationId,
  initialCategories,
  industryType = 'DIGITAL',
}: AssetCategoriesCardProps) {
  const defaultList = industryType === 'PHYSICAL' ? DEFAULT_PHYSICAL : DEFAULT_DIGITAL
  const [categories, setCategories] = useState<string[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : defaultList
  )
  const [newCat, setNewCat] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCat.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) {
      setFeedback({ type: 'error', msg: `Kategori "${trimmed}" sudah ada!` })
      return
    }
    const updated = [...categories, trimmed]
    setCategories(updated)
    setNewCat('')
    saveCategories(updated)
  }

  const handleRemove = (catToRemove: string) => {
    if (categories.length <= 1) {
      setFeedback({ type: 'error', msg: 'Minimal harus ada 1 kategori aset.' })
      return
    }
    const updated = categories.filter(c => c !== catToRemove)
    setCategories(updated)
    saveCategories(updated)
  }

  const handleReset = (type: 'DIGITAL' | 'PHYSICAL') => {
    const list = type === 'PHYSICAL' ? DEFAULT_PHYSICAL : DEFAULT_DIGITAL
    setCategories(list)
    saveCategories(list)
  }

  const saveCategories = (cats: string[]) => {
    startTransition(async () => {
      const res = await updateCustomAssetCategories(cats)
      if (res?.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setFeedback({ type: 'success', msg: 'Kategori aset berhasil disimpan untuk agensi Anda!' })
        setTimeout(() => setFeedback(null), 4000)
      }
    })
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-[#111827] flex items-center gap-2">
            <Tag size={20} className="text-indigo-600" /> Kategori Aset Klien (Kustom Tenant)
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Atur pilihan kategori dropdown yang muncul saat klien mengunggah file atau materi di portal mereka.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleReset('DIGITAL')}
            className="text-[10px] font-bold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
            title="Reset ke opsi standar Agensi Digital"
          >
            Reset Digital
          </button>
          <button
            type="button"
            onClick={() => handleReset('PHYSICAL')}
            className="text-[10px] font-bold px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-all"
            title="Reset ke opsi standar Agensi Fisik"
          >
            Reset Fisik
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Category Tags List */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Daftar Kategori Aktif ({categories.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8F9FA] border border-black/10 text-xs font-bold text-[#111827] shadow-sm hover:border-indigo-200 transition-all group"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemove(cat)}
                disabled={isPending}
                className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded transition-all"
                title={`Hapus kategori "${cat}"`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleAdd} className="flex gap-2 pt-4 border-t border-black/5">
        <input
          type="text"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          placeholder="Tambah kategori baru (Contoh: File Pola Jahit, Audio Voiceover, Mockup 3D)..."
          className="flex-1 px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={isPending || !newCat.trim()}
          className="px-5 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <Plus size={14} /> Tambah
        </button>
      </form>
    </div>
  )
}
