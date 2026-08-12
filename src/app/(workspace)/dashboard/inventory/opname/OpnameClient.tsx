'use client'

import { useState } from 'react'
import { ClipboardCheck, Save, CheckCircle, Package, History } from 'lucide-react'
import { recordInventoryTransaction } from '../actions'

export default function OpnameClient({ items, history = [] }: { items: any[], history?: any[] }) {
  const [formData, setFormData] = useState({
    item_id: '',
    actual_quantity: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const selectedItem = items.find(i => i.id === formData.item_id)
  
  // Calculate difference
  let difference = 0
  let isDiffNegative = false
  if (selectedItem && formData.actual_quantity !== '') {
    difference = Number(formData.actual_quantity) - Number(selectedItem.current_stock)
    isDiffNegative = difference < 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item_id || formData.actual_quantity === '') return

    setIsSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await recordInventoryTransaction({
        item_id: formData.item_id,
        type: 'ADJUST',
        quantity: difference, // Send the difference to be added/subtracted
        notes: formData.notes || `Stock Opname (Sistem: ${selectedItem?.current_stock}, Aktual: ${formData.actual_quantity})`
      })
      
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg(`Berhasil melakukan penyesuaian stok. Sisa stok saat ini: ${res.newStock}`)
        setFormData({ item_id: '', actual_quantity: '', notes: '' })
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem!")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
          <ClipboardCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Stock Opname</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Penyesuaian stok fisik gudang dengan data di sistem</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 text-rose-800 border border-rose-200 p-4 rounded-xl flex items-center gap-3 font-medium animate-in fade-in slide-in-from-top-4">
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          {errorMsg}
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="" disabled>-- Pilih Bahan --</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} (Tercatat di Sistem: {item.current_stock} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-gray-500">Stok Saat Ini (Sistem)</p>
              <p className="text-xl font-black text-gray-900">{selectedItem.current_stock} <span className="text-sm font-medium text-gray-500">{selectedItem.unit}</span></p>
            </div>
            {formData.actual_quantity !== '' && difference !== 0 && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">Selisih</p>
                <p className={`text-lg font-black ${isDiffNegative ? 'text-rose-600' : 'text-blue-600'}`}>
                  {difference > 0 ? '+' : ''}{difference}
                </p>
              </div>
            )}
            {formData.actual_quantity !== '' && difference === 0 && (
              <div className="text-right">
                <p className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> Sesuai</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Jumlah Fisik (Aktual)</label>
            <div className="relative">
              <input 
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.actual_quantity}
                onChange={e => setFormData({...formData, actual_quantity: e.target.value})}
                className="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                {selectedItem ? selectedItem.unit : 'Unit'}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Keterangan Tambahan</label>
            <input 
              type="text"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Opsional (cth: Barang hilang, dsb)"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            type="submit"
            disabled={isSubmitting || !formData.item_id || formData.actual_quantity === '' || difference === 0}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/30"
          >
            {isSubmitting ? 'Memproses...' : (
              <>
                <Save size={18} /> Simpan Penyesuaian
              </>
            )}
          </button>
        </div>

      </form>

      {/* HISTORY TABEL */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <History className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Riwayat Opname (Terbaru)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                <th className="py-3 px-6">Tanggal</th>
                <th className="py-3 px-6">Bahan Baku</th>
                <th className="py-3 px-6">Selisih</th>
                <th className="py-3 px-6">Staf</th>
                <th className="py-3 px-6">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx: any) => {
                const isNegative = tx.quantity < 0;
                return (
                  <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-3 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-6 text-sm font-bold text-gray-900">
                      {tx.inventory_items?.name || 'Item Terhapus'}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex px-2 py-1 font-black text-xs rounded-md border ${isNegative ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                        {isNegative ? '' : '+'}{tx.quantity} {tx.inventory_items?.unit || ''}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500">
                      {tx.actor_name || 'Staf'}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600 italic">
                      {tx.notes || '-'}
                    </td>
                  </tr>
                )
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    Belum ada riwayat stock opname.
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
