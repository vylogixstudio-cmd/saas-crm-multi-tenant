'use client'

import { useState, useTransition, useRef } from 'react'
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Megaphone, Info, AlertTriangle, XCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { createBroadcastAction, toggleBroadcastAction, deleteBroadcastAction } from './actions'
import { SystemBroadcast } from '@/lib/superAdminStore'

// ── Type helpers ──────────────────────────────────────────────────────────────
const TYPE_STYLES: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; badge: string }> = {
  info:    { label: 'Info',     icon: <Info size={14} />,         bg: 'bg-blue-50',   text: 'text-blue-700',  badge: 'bg-blue-100 text-blue-700' },
  warning: { label: 'Peringatan', icon: <AlertTriangle size={14} />, bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  danger:  { label: 'Bahaya',   icon: <XCircle size={14} />,      bg: 'bg-red-50',    text: 'text-red-700',   badge: 'bg-red-100 text-red-700' },
  success: { label: 'Sukses',   icon: <CheckCircle2 size={14} />, bg: 'bg-emerald-50',text: 'text-emerald-700',badge: 'bg-emerald-100 text-emerald-700' },
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface BroadcastPanelProps {
  initialBroadcasts: SystemBroadcast[]
  agencies: { id: string; name: string }[]
}

export default function BroadcastPanel({ initialBroadcasts, agencies }: BroadcastPanelProps) {
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>(initialBroadcasts)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function showFeedback(type: 'ok' | 'err', text: string) {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 3500)
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createBroadcastAction(formData)
      if (res?.error) {
        showFeedback('err', res.error)
      } else if (res?.success && res.broadcast) {
        setBroadcasts(prev => [res.broadcast as SystemBroadcast, ...prev])
        showFeedback('ok', 'Pengumuman berhasil dipublikasikan!')
        formRef.current?.reset()
        setShowForm(false)
      }
    })
  }

  function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id)
    startTransition(async () => {
      await toggleBroadcastAction(id, !currentActive)
      setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentActive } : b))
      setTogglingId(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteBroadcastAction(id)
      setBroadcasts(prev => prev.filter(b => b.id !== id))
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-[14px]">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">Broadcast Pengumuman</h2>
            <p className="text-xs text-gray-500">Kirim pesan sistem ke semua atau sebagian tenant agensi</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-[12px] transition-all shadow-sm"
        >
          {showForm ? <ChevronUp size={14} /> : <Plus size={14} />}
          {showForm ? 'Tutup Form' : 'Buat Pengumuman'}
        </button>
      </div>

      {/* ── Feedback ───────────────────────────────────────────────────────── */}
      {feedbackMsg && (
        <div className={`text-sm font-semibold px-4 py-3 rounded-[12px] ${feedbackMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedbackMsg.type === 'ok' ? '✅' : '❌'} {feedbackMsg.text}
        </div>
      )}

      {/* ── Create Form ────────────────────────────────────────────────────── */}
      {showForm && (
        <form
          ref={formRef}
          action={handleCreate}
          className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-[20px] border border-indigo-100 space-y-4"
        >
          <h3 className="text-sm font-extrabold text-indigo-800 mb-2 flex items-center gap-2">
            <Bell size={16} /> Buat Pengumuman Baru
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Judul</label>
              <input
                name="title"
                required
                placeholder="cth. Update Sistem v2.6"
                className="w-full bg-white border border-indigo-200 rounded-[10px] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tipe</label>
              <select
                name="type"
                className="w-full bg-white border border-indigo-200 rounded-[10px] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Sukses / Update</option>
                <option value="warning">⚠️ Peringatan</option>
                <option value="danger">🚨 Bahaya / Kritis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Isi Pesan</label>
            <textarea
              name="message"
              required
              rows={3}
              placeholder="Tulis detail pengumuman di sini..."
              className="w-full bg-white border border-indigo-200 rounded-[10px] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Target Agensi</label>
            <select
              name="target_agency_id"
              className="w-full bg-white border border-indigo-200 rounded-[10px] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ALL">🌍 Semua Tenant (Global)</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 py-3 rounded-[12px] transition-all"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
            Publikasikan Pengumuman
          </button>
        </form>
      )}

      {/* ── Broadcasts List ────────────────────────────────────────────────── */}
      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
          <Bell size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada pengumuman aktif</p>
          <p className="text-xs mt-1">Buat pengumuman pertama untuk dikirim ke tenant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((bc) => {
            const style = TYPE_STYLES[bc.type] || TYPE_STYLES.info
            const targetName = bc.target_agency_id
              ? agencies.find(a => a.id === bc.target_agency_id)?.name || 'Agensi Tertentu'
              : 'Semua Tenant'

            return (
              <div
                key={bc.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-[16px] border transition-all ${bc.is_active ? style.bg + ' border-' + style.text.replace('text-', '') + '/20' : 'bg-gray-50 border-gray-200 opacity-60'}`}
              >
                <div className={`shrink-0 p-2 rounded-[10px] ${style.badge} self-start`}>
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-extrabold text-[#111827] text-sm">{bc.title}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
                    {!bc.is_active && <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">NONAKTIF</span>}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{bc.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">📍 {targetName} • {new Date(bc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(bc.id, bc.is_active)}
                    disabled={togglingId === bc.id}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-[10px] transition-all ${bc.is_active ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-gray-600 bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {togglingId === bc.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : bc.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {bc.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(bc.id)}
                    disabled={deletingId === bc.id}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-[10px] transition-all"
                  >
                    {deletingId === bc.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
