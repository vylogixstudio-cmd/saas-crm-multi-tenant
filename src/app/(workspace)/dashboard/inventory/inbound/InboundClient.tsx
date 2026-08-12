'use client'

import { useState, useEffect } from 'react'
import { ArrowDownToLine, Save, CheckCircle, Package, History } from 'lucide-react'
import { recordInventoryTransaction } from '../actions'

export default function InboundClient({ items, history = [] }: { items: any[], history?: any[] }) {
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: '',
    notes: ''
  })
  const [isCalcMode, setIsCalcMode] = useState(false)
  const [calcData, setCalcData] = useState({
    length: '',
    width: '',
    pcs: '',
    isDoubleSided: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const selectedItem = items.find(i => i.id === formData.item_id)

  useEffect(() => {
    if (isCalcMode) {
      const l = parseFloat(calcData.length) || 0
      const w = parseFloat(calcData.width) || 0
      const p = parseInt(calcData.pcs) || 0
      let total = l * w * p
      if (calcData.isDoubleSided) total *= 2
      
      setFormData(prev => ({
        ...prev,
        quantity: total > 0 ? total.toFixed(2) : ''
      }))
    }
  }, [calcData, isCalcMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item_id || !formData.quantity) return

    setIsSubmitting(true)
    setSuccessMsg('')

    try {
      let finalNotes = formData.notes
      if (isCalcMode) {
        finalNotes = `${formData.notes ? formData.notes + ' ' : ''}[Ukur: ${calcData.length}x${calcData.width}m, ${calcData.pcs}pcs${calcData.isDoubleSided ? ', 2 Sisi' : ''}]`
      }

      const res = await recordInventoryTransaction({
        item_id: formData.item_id,
        type: 'IN',
        quantity: Number(formData.quantity),
        notes: finalNotes
      })
      
      if (res.error) {
        alert(res.error)
      } else {
        setSuccessMsg(`Berhasil menambah stok. Total stok saat ini: ${res.newStock}`)
        setFormData({ item_id: '', quantity: '', notes: '' })
      }
    } catch (err) {
      alert("Terjadi kesalahan!")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
          <ArrowDownToLine size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Barang Masuk (Inbound)</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Catat penambahan stok bahan baku ke gudang</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Package size={14} /> Pilih Bahan Baku
          </label>
          <select 
            required
            value={formData.item_id}
            onChange={e => setFormData({...formData, item_id: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="" disabled>-- Pilih Bahan --</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} (Sisa: {item.current_stock} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Kalkulator Mode Toggle */}
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="calcMode" 
            checked={isCalcMode}
            onChange={(e) => setIsCalcMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="calcMode" className="text-sm font-bold text-gray-700 cursor-pointer">
            Gunakan Kalkulator Ukuran (Panjang x Lebar)
          </label>
        </div>

        {isCalcMode && (
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-blue-900 mb-1 uppercase tracking-wider">Panjang</label>
              <input type="number" step="0.01" min="0" value={calcData.length} onChange={e => setCalcData({...calcData, length: e.target.value})} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-blue-900 mb-1 uppercase tracking-wider">Lebar</label>
              <input type="number" step="0.01" min="0" value={calcData.width} onChange={e => setCalcData({...calcData, width: e.target.value})} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-blue-900 mb-1 uppercase tracking-wider">Jml Kuantitas</label>
              <input type="number" step="1" min="1" value={calcData.pcs} onChange={e => setCalcData({...calcData, pcs: e.target.value})} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={calcData.isDoubleSided} onChange={e => setCalcData({...calcData, isDoubleSided: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-xs font-bold text-blue-900">2 Sisi (Bolak-Balik)</span>
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Jumlah Masuk</label>
            <div className="relative">
              <input 
                required
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                readOnly={isCalcMode}
                className={`w-full pl-4 pr-16 py-3 border rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isCalcMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-blue-600 focus:bg-white'}`}
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                {selectedItem ? selectedItem.unit : 'Unit'}
              </div>
            </div>
            {isCalcMode && (
              <p className="text-[10px] font-bold text-blue-600 mt-2">
                *Otomatis dihitung: {calcData.length || 0} x {calcData.width || 0} x {calcData.pcs || 0} pcs {calcData.isDoubleSided ? 'x 2 Sisi' : ''}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Nomor Nota / Catatan</label>
            <input 
              type="text"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Cth: PO-2026/08, Beli dari Suplier X"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            type="submit"
            disabled={isSubmitting || !formData.item_id || !formData.quantity}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/30"
          >
            {isSubmitting ? 'Memproses...' : (
              <>
                <Save size={18} /> Simpan Barang Masuk
              </>
            )}
          </button>
        </div>

      </form>

      {/* HISTORY TABEL */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <History className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Riwayat Barang Masuk (Terbaru)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                <th className="py-3 px-6">Tanggal</th>
                <th className="py-3 px-6">Bahan Baku</th>
                <th className="py-3 px-6">Jumlah Masuk</th>
                <th className="py-3 px-6">Staf</th>
                <th className="py-3 px-6">Keterangan / Nota</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-6 text-sm font-bold text-gray-900">
                    {tx.inventory_items?.name || 'Item Terhapus'}
                  </td>
                  <td className="py-3 px-6">
                    <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-md border border-blue-100">
                      +{tx.quantity} {tx.inventory_items?.unit || ''}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-500">
                    {tx.actor_name || 'Staf'}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-600 italic">
                    {tx.notes || '-'}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    Belum ada riwayat barang masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
