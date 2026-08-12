'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, CheckCircle, Save, X } from 'lucide-react'
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from './actions'

export default function InventoryClient({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState(initialItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Umum',
    current_stock: 0,
    unit: 'Pcs',
    min_stock_alert: 5
  })
  const [isCalcMode, setIsCalcMode] = useState(false)
  const [calcData, setCalcData] = useState({
    length: '',
    width: '',
    pcs: '',
    isDoubleSided: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isCalcMode) {
      const l = parseFloat(calcData.length) || 0
      const w = parseFloat(calcData.width) || 0
      const p = parseInt(calcData.pcs) || 0
      let total = l * w * p
      if (calcData.isDoubleSided) total *= 2
      
      setFormData(prev => ({
        ...prev,
        current_stock: total > 0 ? parseFloat(total.toFixed(2)) : 0
      }))
    }
  }, [calcData, isCalcMode])

  const handleOpenModal = (item?: any) => {
    if (item) {
      setIsEdit(true)
      setSelectedId(item.id)
      setFormData({
        name: item.name,
        category: item.category,
        current_stock: item.current_stock,
        unit: item.unit,
        min_stock_alert: item.min_stock_alert
      })
    } else {
      setIsEdit(false)
      setSelectedId(null)
      setFormData({
        name: '',
        category: 'Umum',
        current_stock: 0,
        unit: 'Pcs',
        min_stock_alert: 5
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isEdit && selectedId) {
        await updateInventoryItem(selectedId, formData)
        // Refresh local logic
        setItems(items.map(i => i.id === selectedId ? { ...i, ...formData } : i))
      } else {
        const res = await createInventoryItem(formData)
        if (res.data) {
          setItems([...items, res.data])
        }
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${name}? Data mutasinya akan terhapus juga.`)) return
    
    try {
      await deleteInventoryItem(id)
      setItems(items.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
      alert("Gagal menghapus.")
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="text-emerald-600" /> Master Material
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Kelola daftar bahan baku utama gudang Anda</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 justify-center"
        >
          <Plus size={18} /> Tambah Bahan Baru
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama bahan atau kategori..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="text-sm font-medium text-gray-500">
            Total <span className="font-bold text-gray-900">{filteredItems.length}</span> item
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50">
                <th className="py-4 px-6">Nama Bahan & Kategori</th>
                <th className="py-4 px-6">Sisa Stok</th>
                <th className="py-4 px-6">Satuan</th>
                <th className="py-4 px-6">Status / Alert</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isLow = Number(item.current_stock) <= Number(item.min_stock_alert)
                return (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-gray-900">{item.name}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">{item.category}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`text-lg font-black ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                        {item.current_stock}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold">{item.unit}</span>
                    </td>
                    <td className="py-4 px-6">
                      {isLow ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertTriangle size={12} /> Menipis
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">Min: {item.min_stock_alert}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle size={12} /> Aman
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">Min: {item.min_stock_alert}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Master"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Master"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Tidak ada bahan baku yang ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900">
                {isEdit ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nama Bahan</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Contoh: Flexi Korea 440gsm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kategori</label>
                  <input 
                    required
                    type="text" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Contoh: Spanduk"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Satuan</label>
                  <input 
                    required
                    type="text" 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Contoh: Roll / Meter / Pcs"
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Stok Awal</label>
                
                {/* Kalkulator Mode Toggle */}
                {!isEdit && (
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="calcModeInv" 
                      checked={isCalcMode}
                      onChange={(e) => setIsCalcMode(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="calcModeInv" className="text-xs font-bold text-gray-700 cursor-pointer">
                      Hitung Ukuran (P x L)
                    </label>
                  </div>
                )}

                {isCalcMode && !isEdit && (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl grid grid-cols-2 gap-3 mb-3 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 mb-1">Panjang</label>
                      <input type="number" step="0.01" min="0" value={calcData.length} onChange={e => setCalcData({...calcData, length: e.target.value})} className="w-full px-2 py-1.5 bg-white border border-emerald-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 mb-1">Lebar</label>
                      <input type="number" step="0.01" min="0" value={calcData.width} onChange={e => setCalcData({...calcData, width: e.target.value})} className="w-full px-2 py-1.5 bg-white border border-emerald-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 mb-1">Pcs</label>
                      <input type="number" step="1" min="1" value={calcData.pcs} onChange={e => setCalcData({...calcData, pcs: e.target.value})} className="w-full px-2 py-1.5 bg-white border border-emerald-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="1" />
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={calcData.isDoubleSided} onChange={e => setCalcData({...calcData, isDoubleSided: e.target.checked})} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                        <span className="text-[10px] font-bold text-emerald-900">2 Sisi</span>
                      </label>
                    </div>
                  </div>
                )}

                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.current_stock}
                  onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})}
                  readOnly={isCalcMode && !isEdit}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${isCalcMode && !isEdit ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white'}`}
                  placeholder="0"
                />
              </div>)}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" /> Peringatan Stok Minimum
                </label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_stock_alert}
                  onChange={e => setFormData({...formData, min_stock_alert: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="Batas peringatan merah"
                />
              </div>

              <div className="pt-4 flex gap-3">
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
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : (
                    <>
                      <Save size={16} /> Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
