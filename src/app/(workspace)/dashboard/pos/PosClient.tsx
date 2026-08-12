'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPosInvoice } from './actions'
import {
  Loader2, Plus, Trash2, ReceiptText, CheckCircle2,
  FolderOpen, FileText, ChevronDown, Info
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Helpers ─────────────────────────────────────────────
function formatRupiah(value: number | string): string {
  const num = typeof value === 'string'
    ? value.replace(/\D/g, '')
    : String(Math.floor(Number(value)))
  if (!num || num === '0') return ''
  return Number(num).toLocaleString('id-ID')
}
function parseRupiah(formatted: string): number {
  return Number(formatted.replace(/\D/g, '')) || 0
}

type Project = {
  id: string
  title: string
  client_id: string
  total_price: number
  termin_1: number
  termin_2: number
  termin_3: number
  update_price?: number
  payment_status: string
}

type ExistingInvoice = {
  id: string
  project_id: string | null
  termin_label: string | null
  status: string
}

type InvoiceQueueItem = {
  projectId: string
  projectTitle: string
  clientId: string
  clientName: string
  terminLabel: string
  amount: number
  totalPrice: number
}

// ─── Component ───────────────────────────────────────────
export default function PosClient({
  clients,
  projects = [],
  services = [],
  invoices = [],
  invoiceQueue = [],
  selectedQueueItem = null,
  onQueueItemProcessed,
}: {
  clients: any[]
  projects?: Project[]
  services?: any[]
  invoices?: ExistingInvoice[]
  invoiceQueue?: InvoiceQueueItem[]
  selectedQueueItem?: InvoiceQueueItem | null
  onQueueItemProcessed?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'project' | 'free'>('project')
  const [includeTax, setIncludeTax] = useState(false)

  // Project-based state
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [terminLabel, setTerminLabel] = useState('')
  const [overrideAmount, setOverrideAmount] = useState<number>(0)
  const [overrideDisplay, setOverrideDisplay] = useState<string>('')

  // Listen for selectedQueueItem changes
  useEffect(() => {
    // Legacy support, no-op since queue is removed
    if (selectedQueueItem && onQueueItemProcessed) {
      onQueueItemProcessed()
    }
  }, [selectedQueueItem, onQueueItemProcessed])

  // Free invoice state
  const [freeTitle, setFreeTitle] = useState('')
  const [freeClientId, setFreeClientId] = useState('')
  const [freeProjectId, setFreeProjectId] = useState('')
  const [freeItems, setFreeItems] = useState([{ name: '', price: 0, priceDisplay: '', quantity: 1 }])

  const addFreeItem = () => setFreeItems([...freeItems, { name: '', price: 0, priceDisplay: '', quantity: 1 }])
  const removeFreeItem = (i: number) => {
    if (freeItems.length > 1) setFreeItems(freeItems.filter((_, idx) => idx !== i))
  }
  const updateFreeItem = (index: number, field: string, value: any) => {
    const next = [...freeItems]
    if (field === 'price') {
      const raw = parseRupiah(value)
      next[index] = { ...next[index], price: raw, priceDisplay: formatRupiah(raw) }
    } else {
      next[index] = { ...next[index], [field]: value }
    }
    setFreeItems(next)
  }
  const freeTotalAmount = freeItems.reduce((s, item) => s + item.price * item.quantity, 0)

  // Termin options for selected project
  const getTerminOptions = (proj: Project) => {
    const usedLabels = invoices
      .filter(inv => inv.project_id === proj.id && inv.status !== 'CANCELLED')
      .map(inv => inv.termin_label)

    const opts = []
    opts.push({ label: 'Termin 1 (DP)', value: 'Termin 1', amount: proj.termin_1 || 0 })
    opts.push({ label: 'Termin 2', value: 'Termin 2', amount: proj.termin_2 || 0 })
    opts.push({ label: 'Termin 3 (Pelunasan)', value: 'Termin 3', amount: proj.termin_3 || 0 })
    opts.push({ label: 'Pembayaran Penuh', value: 'Penuh', amount: proj.total_price })
    
    if (proj.update_price && proj.update_price > 0) {
      opts.push({ label: 'Biaya Tambahan (Update)', value: 'Biaya Tambahan (Update)', amount: proj.update_price })
    }
    
    return opts.map(opt => ({ ...opt, taken: usedLabels.includes(opt.value) }))
  }

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedProject(null)
    setTerminLabel('')
    setOverrideAmount(0)
    setOverrideDisplay('')
  }

  const handleProjectSelect = (projId: string) => {
    if (!projId) { setSelectedProject(null); setTerminLabel(''); return }
    const proj = projects.find(p => p.id === projId) || null
    setSelectedProject(proj)
    setTerminLabel('')
    setOverrideAmount(0)
    setOverrideDisplay('')
  }

  const handleTerminSelect = (val: string) => {
    setTerminLabel(val)
    if (!selectedProject) return
    const opts = getTerminOptions(selectedProject)
    const found = opts.find(o => o.value === val)
    if (found) {
      setOverrideAmount(found.amount)
      setOverrideDisplay(formatRupiah(found.amount))
    } else {
      setOverrideAmount(0)
      setOverrideDisplay('')
    }
  }

  // Auto-fill from queue item
  const handleQueueItemClick = (item: InvoiceQueueItem) => {
    setMode('project')
    setSelectedClientId(item.clientId)
    const proj = projects.find(p => p.id === item.projectId)
    if (proj) {
      setSelectedProject(proj)
      setTerminLabel(item.terminLabel)
      setOverrideAmount(item.amount)
      setOverrideDisplay(formatRupiah(item.amount))
    }
  }

  const handleAmountInput = (val: string) => {
    const raw = parseRupiah(val)
    setOverrideAmount(raw)
    setOverrideDisplay(formatRupiah(raw))
  }

  // ─── Submit ──────────────────────────────────────────
  const reset = () => {
    setSelectedClientId('')
    setSelectedProject(null)
    setTerminLabel('')
    setOverrideAmount(0)
    setOverrideDisplay('')
    setFreeTitle('')
    setFreeClientId('')
    setFreeProjectId('')
    setFreeItems([{ name: '', price: 0, priceDisplay: '', quantity: 1 }])
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    if (freeTotalAmount <= 0) { toast.error('Total harga harus lebih dari 0'); return }
    formData.set('amount', freeTotalAmount.toString())

    if (includeTax) formData.set('include_tax', 'true')

    startTransition(async () => {
      const res = await createPosInvoice(formData)
      if (res?.error) {
        toast.error(res.error)
      } else if (res?.success) {
        reset()
        form.reset()
        toast.success('Invoice berhasil dibuat!', {
          description: 'Klik "Kelola" pada riwayat di bawah untuk melihat dan mencetak.',
          duration: 5000,
        })
      }
    })
  }

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-black/5 bg-[#F8F9FA]/50">
        <h2 className="font-extrabold text-lg text-[#111827] flex items-center gap-2">
          <ReceiptText size={20} className="text-[#2563EB]" />
          Buat Invoice Baru
        </h2>
        <p className="text-[#6B7280] text-xs font-medium mt-1">Isi detail di bawah untuk membuat invoice manual</p>
      </div>

      <form id="posForm" onSubmit={handleSubmit}>
        <div className="p-6 space-y-5">

              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Judul Invoice <span className="text-rose-500">*</span></label>
                <input
                  name="title"
                  required
                  value={freeTitle}
                  onChange={e => setFreeTitle(e.target.value)}
                  placeholder="Contoh: Jasa Konsultasi Desain Logo..."
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Klien (Opsional)</label>
                <select
                  name="client_id"
                  value={freeClientId}
                  onChange={e => setFreeClientId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                >
                  <option value="">-- Klien Eksternal / Tanpa Klien --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {freeClientId && (
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Proyek (Opsional)</label>
                  <select
                    name="project_id"
                    value={freeProjectId}
                    onChange={e => setFreeProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  >
                    <option value="">-- Tidak Ditautkan ke Proyek --</option>
                    {projects?.filter(p => p.client_id === freeClientId).map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}


              {/* Items */}
              <div className="pt-4 border-t border-black/5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Item / Layanan</label>
                  <button type="button" onClick={addFreeItem} className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-[8px] hover:bg-[#DBEAFE] transition-colors flex items-center gap-1">
                    <Plus size={13} /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {freeItems.map((item, i) => (
                    <div key={i} className="p-3 bg-[#F8F9FA] rounded-[10px] border border-black/5 space-y-2">
                      <input
                        name="item_name[]"
                        required
                        list="agency-services-list"
                        placeholder="Nama layanan..."
                        value={item.name}
                        onChange={e => updateFreeItem(i, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-[8px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                      />
                      <datalist id="agency-services-list">
                        {services.map(s => <option key={s.id} value={s.name} />)}
                      </datalist>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9CA3AF] pointer-events-none">Rp</span>
                          <input
                            name="item_price[]"
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="0"
                            value={item.priceDisplay}
                            onChange={e => updateFreeItem(i, 'price', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-white border border-black/10 rounded-[8px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                          />
                          <input type="hidden" name="item_price_raw[]" value={item.price} />
                        </div>
                        <div className="relative w-16">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9CA3AF]">×</span>
                          <input
                            name="item_quantity[]"
                            type="number" min="1" required
                            value={item.quantity || ''}
                            onChange={e => updateFreeItem(i, 'quantity', Number(e.target.value))}
                            className="w-full pl-5 pr-2 py-2 bg-white border border-black/10 rounded-[8px] text-xs font-medium text-center focus:outline-none"
                          />
                        </div>
                        {freeItems.length > 1 && (
                          <button type="button" onClick={() => removeFreeItem(i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-[8px] transition-colors flex-shrink-0">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      {item.price > 0 && (
                        <p className="text-[10px] font-bold text-[#2563EB] text-right">
                          = Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
        </div>

        {/* Opsi PPN */}
        <div className="px-6 py-4 bg-blue-50/50 border-t border-black/5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-900">Tambahkan PPN 12%</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Otomatis tambahkan pajak ke dalam rincian tagihan.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={includeTax} onChange={e => setIncludeTax(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 border-t border-black/5 pt-5 bg-[#F8F9FA]/30">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-[#4B5563]">Total Tagihan:</span>
            <span className={`text-xl font-extrabold ${freeTotalAmount > 0 ? 'text-[#111827]' : 'text-[#D1D5DB]'}`}>
              Rp {(freeTotalAmount * (includeTax ? 1.12 : 1)).toLocaleString('id-ID', {maximumFractionDigits: 0})}
            </span>
          </div>
          <button
            type="submit"
            disabled={isPending || freeTotalAmount <= 0}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-[12px] shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isPending
              ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              : <><CheckCircle2 size={16} /> Buat Invoice Sekarang</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
