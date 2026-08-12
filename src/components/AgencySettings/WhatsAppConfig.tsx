'use client'

import React, { useState, useTransition } from 'react'
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  Phone,
  Send,
  Sparkles,
  Zap,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { updateWhatsAppSettings } from '@/app/(workspace)/dashboard/settings/actions'
import { generateWhatsAppLink, normalizePhoneNumber } from '@/utils/whatsapp'

interface WhatsAppConfigProps {
  initialWhatsAppNumber: string | null | undefined
  orgName: string
}

export default function WhatsAppConfig({
  initialWhatsAppNumber,
  orgName,
}: WhatsAppConfigProps) {
  const [isPending, startTransition] = useTransition()
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsAppNumber || '')
  const [gatewayToken, setGatewayToken] = useState('')
  const [savedNumber, setSavedNumber] = useState(initialWhatsAppNumber || '')
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState(
    `Halo! Ini adalah pesan uji coba integrasi WhatsApp dari ${orgName}. Sistem otomatisasi siap digunakan.`
  )
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [isQrConnected, setIsQrConnected] = useState(Boolean(initialWhatsAppNumber))

  // Checklist states
  const [notifyInvoice, setNotifyInvoice] = useState(true)
  const [notifyStatus, setNotifyStatus] = useState(true)
  const [notifyPayment, setNotifyPayment] = useState(true)

  React.useEffect(() => {
    if (initialWhatsAppNumber) {
      setWhatsappNumber(initialWhatsAppNumber)
      setSavedNumber(initialWhatsAppNumber)
      setIsQrConnected(true)
    }
  }, [initialWhatsAppNumber])

  const handleSaveNumber = (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    startTransition(async () => {
      const res = await updateWhatsAppSettings(whatsappNumber)
      if (res?.error) {
        setStatusMsg({ type: 'error', text: res.error })
      } else {
        setSavedNumber(whatsappNumber)
        setIsQrConnected(Boolean(whatsappNumber))
        setStatusMsg({ type: 'success', text: 'Nomor WhatsApp resmi agensi berhasil diperbarui!' })
      }
    })
  }

  const handleSendTestDirect = () => {
    if (!testPhone.trim()) {
      setStatusMsg({ type: 'error', text: 'Masukkan nomor WhatsApp tujuan uji coba.' })
      return
    }

    const waLink = generateWhatsAppLink(testPhone, testMessage)
    window.open(waLink, '_blank')
    setStatusMsg({ type: 'success', text: 'Membuka WhatsApp untuk mengirim pesan uji coba...' })
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Integrasi WhatsApp Agensi
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                Multi-Tenant
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                Hanya Demo
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Kirim faktur tagihan dan pembaruan pesanan otomatis langsung ke nomor HP klien dari WhatsApp resmi {orgName}.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isQrConnected && savedNumber ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Terhubung (+{normalizePhoneNumber(savedNumber)})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Belum Terhubung</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Form Input Nomor CS Agensi */}
      <form onSubmit={handleSaveNumber} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Nomor WhatsApp CS / Hotline Kantor Agensi
          </label>
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              placeholder="Contoh: 081234567890 atau 628123456789"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Nomor ini digunakan sebagai identitas pengirim dan tujuan saat klien mengklik tombol kontak CS di portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>Simpan Nomor WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(!showQrModal)}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-2"
          >
            <QrCode className="w-3.5 h-3.5 text-gray-600" />
            <span>{showQrModal ? 'Tutup QR Simulator' : 'Tautkan Perangkat (Scan QR)'}</span>
          </button>
        </div>
      </form>

      {/* QR Code Simulator Box */}
      {showQrModal && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-gray-50 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <QrCode className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">
                Penyambungan Perangkat WhatsApp (1 Agensi = 1 Perangkat)
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Buka aplikasi WhatsApp di HP kantor {orgName} → ketuk <strong>Perangkat Tertaut (Linked Devices)</strong> → arahkan kamera ke kode QR ini untuk menghubungkan sesi pengiriman otomatis.
            </p>
            <p className="text-[11px] text-amber-700 italic">
              * (Fitur QR ini adalah antarmuka simulasi sandbox khusus demonstrasi & presentasi)
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsQrConnected(true)
                  setStatusMsg({ type: 'success', text: 'Perangkat WhatsApp berhasil ditautkan!' })
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulasi Scan Sukses</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-md flex flex-col items-center gap-2 shrink-0">
            {/* SVG QR Code Pattern Illustration */}
            <div className="w-36 h-36 bg-gray-900 rounded-xl p-2.5 flex items-center justify-center text-white relative overflow-hidden group">
              <div className="grid grid-cols-6 gap-1 w-full h-full opacity-90">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-emerald-400'
                        : 'bg-white/70'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-[1px]">
                <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
              Scan via WA HP
            </span>
          </div>
        </div>
      )}

      {/* Trigger Event Switches */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <span>Otomatisasi Pemicu Notifikasi (Trigger Events)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={notifyInvoice}
              onChange={e => setNotifyInvoice(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">Tagihan Baru</p>
              <p className="text-[11px] text-gray-500">Tembak link faktur saat invoice dibuat</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={notifyStatus}
              onChange={e => setNotifyStatus(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">Update Pesanan</p>
              <p className="text-[11px] text-gray-500">Kirim progres produksi & resi kirim</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={notifyPayment}
              onChange={e => setNotifyPayment(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">Pembayaran Lunas</p>
              <p className="text-[11px] text-gray-500">Kirim kuitansi setelah pelunasan</p>
            </div>
          </label>
        </div>
      </div>

      {/* Widget Kirim Pesan Uji Coba */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Kirim Pesan Uji Coba (Test WhatsApp Dispatch)</span>
        </h3>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Nomor WhatsApp Tujuan (HP Anda)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Isi Pesan Uji Coba
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSendTestDirect}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka Chat Uji Coba di WhatsApp</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
