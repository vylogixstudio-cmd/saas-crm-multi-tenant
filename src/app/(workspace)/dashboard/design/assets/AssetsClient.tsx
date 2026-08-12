'use client'

import { useState } from 'react'
import { Cloud, Search, Plus, Trash2, ExternalLink, Image as ImageIcon, Type, Layout, FileBox, X, UploadCloud, Link as LinkIcon, Clock } from 'lucide-react'
import { uploadAssetAndSave, deleteAsset } from '../actions'

const CATEGORIES = ['Logo', 'Font', 'Template Vektor', 'Elemen Grafis', 'Lainnya']

export default function AssetsClient({ assets: initialAssets }: { assets: any[] }) {
  const [assets, setAssets] = useState(initialAssets)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCat, setFilterCat] = useState('Semua')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadType, setUploadType] = useState<'FILE' | 'URL'>('FILE')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Lainnya')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const filteredAssets = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = filterCat === 'Semua' || a.category === filterCat
    return matchSearch && matchCat
  })

  const getIconForCategory = (cat: string) => {
    if (cat === 'Font') return <Type size={16} />
    if (cat === 'Logo') return <ImageIcon size={16} />
    if (cat === 'Template Vektor') return <Layout size={16} />
    return <FileBox size={16} />
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        alert("File melebihi batas 5MB! Silakan unggah ke Google Drive lalu gunakan opsi Tautan (URL).")
        e.target.value = ''
        setFile(null)
      } else {
        setFile(selected)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      
      if (uploadType === 'URL') {
        formData.append('url', url)
      } else if (file) {
        formData.append('file', file)
      } else {
        alert("Pilih file atau masukkan URL!")
        setIsSubmitting(false)
        return
      }

      const res = await uploadAssetAndSave(formData)
      if (res.error) {
        alert(res.error)
      } else {
        alert("Aset berhasil disimpan!")
        window.location.reload() // quick refresh to get new db rows
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, assetName: string) => {
    if (!confirm(`Hapus aset ${assetName}?`)) return
    try {
      await deleteAsset(id)
      setAssets(assets.filter(a => a.id !== id))
    } catch (err) {
      alert("Gagal menghapus aset.")
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Cloud className="text-purple-600" /> Aset File (Cloud)
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Simpan dan temukan resource desain Anda dengan cepat.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 justify-center"
        >
          <Plus size={18} /> Tambah Aset Baru
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama aset..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {['Semua', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  filterCat === cat 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group bg-gray-50/30">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                {getIconForCategory(asset.category)}
              </div>
              <h3 className="font-extrabold text-gray-900 mb-1 line-clamp-1" title={asset.name}>{asset.name}</h3>
              <p className="text-xs font-bold text-gray-500 mb-1">{asset.category} • {asset.size_mb > 0 ? `${asset.size_mb.toFixed(2)} MB` : 'Eksternal URL'}</p>
              <p className="text-[10px] text-gray-400 mb-4 flex items-center gap-1">
                <Clock size={10} />
                {new Date(asset.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <a 
                  href={asset.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  Buka File <ExternalLink size={12} />
                </a>
                <button 
                  onClick={() => handleDelete(asset.id, asset.name)}
                  className="text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredAssets.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400">
              <Cloud size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Tidak ada aset ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH ASET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900">Tambah Aset Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadType('FILE')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all ${
                    uploadType === 'FILE' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UploadCloud size={14} /> File (&le; 5MB)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('URL')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all ${
                    uploadType === 'URL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LinkIcon size={14} /> Tautan URL (&gt; 5MB)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nama Aset</label>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Contoh: Font Helvetica Bold"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kategori</label>
                <select 
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {uploadType === 'FILE' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Upload File (Max 5MB)</label>
                  <input 
                    required
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tautan Google Drive / Canva</label>
                  <input 
                    required
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengunggah...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
