'use client'

import { useState, useTransition } from 'react'
import { Settings, Power, Phone, Mail, Globe, MessageSquare, Save, Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { updateSystemSettingsAction, toggleMaintenanceModeAction } from './actions'
import { SystemSettings } from '@/lib/superAdminStore'

interface PlatformSettingsPanelProps {
  initialSettings: SystemSettings
}

export default function PlatformSettingsPanel({ initialSettings }: PlatformSettingsPanelProps) {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function showFeedback(type: 'ok' | 'err', text: string) {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 3500)
  }

  function handleSaveSettings(formData: FormData) {
    startTransition(async () => {
      const res = await updateSystemSettingsAction(formData)
      if (res?.error) {
        showFeedback('err', res.error)
      } else if (res?.success) {
        if (res.settings) setSettings(res.settings as SystemSettings)
        showFeedback('ok', 'Pengaturan platform berhasil disimpan!')
      }
    })
  }

  function handleToggleMaintenance() {
    if (settings.maintenance_mode) {
      if (!confirm('Matikan Maintenance Mode? Platform akan kembali dapat diakses semua user.')) return
    } else {
      if (!confirm('⚠️ Aktifkan Maintenance Mode? Semua tenant & klien TIDAK bisa mengakses platform selama mode ini aktif!')) return
    }

    setIsTogglingMaintenance(true)
    startTransition(async () => {
      const res = await toggleMaintenanceModeAction(!settings.maintenance_mode)
      if (res?.success) {
        setSettings(prev => ({ ...prev, maintenance_mode: res.maintenance_mode ?? !prev.maintenance_mode }))
        showFeedback('ok', res.maintenance_mode
          ? '🔧 Maintenance Mode AKTIF. Platform dalam perawatan.'
          : '✅ Maintenance Mode NONAKTIF. Platform kembali normal.')
      }
      setIsTogglingMaintenance(false)
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 text-gray-700 rounded-[14px]">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#111827]">Platform Settings & Maintenance</h2>
          <p className="text-xs text-gray-500">Atur identitas platform, kontak support, dan mode pemeliharaan</p>
        </div>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────────────── */}
      {feedbackMsg && (
        <div className={`text-sm font-semibold px-4 py-3 rounded-[12px] ${feedbackMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedbackMsg.type === 'ok' ? '✅' : '❌'} {feedbackMsg.text}
        </div>
      )}

      {/* ── Maintenance Mode Toggle ───────────────────────────────────────── */}
      <div className={`rounded-[24px] p-6 border-2 transition-all ${settings.maintenance_mode ? 'bg-rose-50 border-rose-300' : 'bg-white border-black/5'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-[16px] ${settings.maintenance_mode ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-base">
                Maintenance Mode
                {settings.maintenance_mode && (
                  <span className="ml-2 text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">🔴 AKTIF</span>
                )}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Saat aktif, semua tenant & klien akan melihat halaman pemeliharaan</p>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={isTogglingMaintenance}
            className={`flex items-center gap-2 text-sm font-extrabold px-6 py-3 rounded-[14px] transition-all shadow-sm ${
              settings.maintenance_mode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            } disabled:opacity-50`}
          >
            {isTogglingMaintenance
              ? <Loader2 size={16} className="animate-spin" />
              : <Power size={16} />}
            {settings.maintenance_mode ? 'Matikan Maintenance' : 'Aktifkan Maintenance'}
          </button>
        </div>

        {settings.maintenance_mode && (
          <div className="mt-4 p-3 bg-rose-100 rounded-[12px] border border-rose-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium">
                <strong>Pesan Maintenance:</strong> {settings.maintenance_message || 'Sistem sedang dalam perawatan.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Platform Identity Form ────────────────────────────────────────── */}
      <form action={handleSaveSettings} className="bg-white rounded-[24px] border border-black/5 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 mb-2">
          <Globe size={16} className="text-gray-400" />
          Identitas & Kontak Platform
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Platform</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
              <Globe size={14} className="text-gray-400 shrink-0" />
              <input
                name="platform_name"
                defaultValue={settings.platform_name}
                className="flex-1 bg-transparent text-sm text-[#111827] focus:outline-none"
                placeholder="Vylogix SaaS CRM"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">WhatsApp Support</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <input
                name="support_whatsapp"
                defaultValue={settings.support_whatsapp}
                className="flex-1 bg-transparent text-sm text-[#111827] focus:outline-none"
                placeholder="6281234567890"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Support</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <input
                name="support_email"
                defaultValue={settings.support_email}
                className="flex-1 bg-transparent text-sm text-[#111827] focus:outline-none"
                placeholder="support@vylogix.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pesan Maintenance</label>
            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
              <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <textarea
                name="maintenance_message"
                defaultValue={settings.maintenance_message}
                rows={2}
                className="flex-1 bg-transparent text-sm text-[#111827] focus:outline-none resize-none"
                placeholder="Sistem sedang dalam peningkatan performa..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Pemeliharaan (Maintenance Target)</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
              <ShieldAlert size={14} className="text-gray-400 shrink-0" />
              <select
                name="maintenance_target"
                defaultValue={settings.maintenance_target || 'ALL'}
                className="flex-1 bg-transparent text-sm text-[#111827] focus:outline-none"
              >
                <option value="ALL">🌍 Semua (Agensi & Klien)</option>
                <option value="AGENCY">🏢 Hanya Agensi (/dashboard)</option>
                <option value="CLIENT">👤 Hanya Klien (/portal)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 text-sm font-bold text-white bg-[#111827] hover:bg-gray-800 disabled:opacity-60 px-6 py-3 rounded-[14px] transition-all shadow-sm"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Pengaturan
          </button>
        </div>
      </form>

      {/* ── Registration Toggle ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-black/5 shadow-sm p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className={settings.allow_new_registrations ? 'text-emerald-500' : 'text-gray-400'} />
          <div>
            <p className="text-sm font-bold text-[#111827]">Registrasi Agensi Baru</p>
            <p className="text-xs text-gray-500">Izinkan Super Admin mendaftarkan tenant baru ke platform</p>
          </div>
        </div>
        <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${settings.allow_new_registrations ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-gray-500 bg-gray-100'}`}>
          {settings.allow_new_registrations ? '✅ Terbuka' : '🔒 Ditutup'}
        </span>
      </div>

    </div>
  )
}
