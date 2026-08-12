'use client'

import React, { useState, useTransition } from 'react'
import {
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  X,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { payInvoiceWithGatewaySandbox } from '@/app/(portal)/portal/actions'
import { generateWhatsAppLink, formatPaymentSuccessMessage } from '@/utils/whatsapp'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId: string
  invoiceNumber: string
  title: string
  amount: number
  orgName: string
  clientName: string
  clientPhone?: string | null
  onPaymentSuccess?: () => void
}

type PaymentMethod = 'QRIS' | 'BCA_VA' | 'MANDIRI_VA' | 'BNI_VA'

export default function PaymentModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  title,
  amount,
  orgName,
  clientName,
  clientPhone,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QRIS')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val)
  }

  const getVaNumber = (method: PaymentMethod) => {
    switch (method) {
      case 'BCA_VA':
        return '800129847120938'
      case 'MANDIRI_VA':
        return '700128392109481'
      case 'BNI_VA':
        return '988128391029384'
      default:
        return ''
    }
  }

  const handleCopyVa = (va: string) => {
    navigator.clipboard.writeText(va)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSimulatePayment = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await payInvoiceWithGatewaySandbox(invoiceId, selectedMethod)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setIsSuccess(true)
        if (onPaymentSuccess) {
          onPaymentSuccess()
        }
      }
    })
  }

  const handleOpenWhatsAppReceipt = () => {
    const msg = formatPaymentSuccessMessage({
      orgName,
      clientName,
      invoiceNumber,
      amount,
      title,
    })
    const link = generateWhatsAppLink(clientPhone, msg)
    window.open(link, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Payment Gateway Sandbox
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  Simulator
                </span>
              </div>
              <p className="text-xs text-gray-300">
                {orgName} • {invoiceNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isSuccess ? (
            /* Success State */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-gray-900 font-['Plus_Jakarta_Sans']">
                  Pembayaran Berhasil!
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Tagihan untuk pesanan <strong>{title}</strong> telah lunas diverifikasi dan tercatat di sistem pembukuan agensi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-2 max-w-xs mx-auto text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>No. Faktur</span>
                  <span className="font-mono font-bold text-gray-900">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Metode</span>
                  <span className="font-bold text-gray-900">{selectedMethod}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total Bayar</span>
                  <span className="font-extrabold text-emerald-600">{formatRupiah(amount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    LUNAS (PAID)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleOpenWhatsAppReceipt}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim Tanda Terima ke WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                >
                  Tutup & Kembali
                </button>
              </div>
            </div>
          ) : (
            /* Payment In-Progress State */
            <>
              {/* Total Amount Card */}
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    Total Tagihan
                  </span>
                  <div className="text-2xl font-black text-gray-900 mt-0.5 font-['Plus_Jakarta_Sans']">
                    {formatRupiah(amount)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>23:59:50</span>
                </div>
              </div>

              {/* Method Selector Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('QRIS')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      selectedMethod === 'QRIS'
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">QRIS Instan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('BCA_VA')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      selectedMethod === 'BCA_VA'
                        ? 'border-blue-500 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">BCA VA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MANDIRI_VA')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      selectedMethod === 'MANDIRI_VA'
                        ? 'border-amber-500 bg-amber-50/60 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">Mandiri VA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('BNI_VA')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      selectedMethod === 'BNI_VA'
                        ? 'border-teal-500 bg-teal-50/60 text-teal-900 ring-2 ring-teal-500/20 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <span className="text-xs">BNI / BRI VA</span>
                  </button>
                </div>
              </div>

              {/* Method Details Box */}
              {selectedMethod === 'QRIS' ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-3">
                  <div className="inline-block p-3 bg-white rounded-2xl border border-gray-300 shadow-md">
                    <div className="w-40 h-40 bg-gray-900 rounded-xl p-2 flex items-center justify-center text-white relative">
                      <div className="grid grid-cols-6 gap-1 w-full h-full opacity-90">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-xs ${
                              (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                                ? 'bg-emerald-400'
                                : 'bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30">
                        <span className="px-2 py-1 bg-white text-gray-900 font-extrabold text-[10px] rounded-md shadow">
                          QRIS
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Scan dengan BCA Mobile, GoPay, OVO, Dana, atau ShopeePay
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Merchant: <strong>{orgName}</strong> • Nominal: {formatRupiah(amount)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Nomor Virtual Account
                      </span>
                      <div className="text-base font-mono font-black text-gray-900 tracking-wider">
                        {getVaNumber(selectedMethod)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyVa(getVaNumber(selectedMethod))}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Tersalin!' : 'Salin VA'}</span>
                    </button>
                  </div>
                  <ul className="text-[11px] text-gray-600 space-y-1 pl-4 list-disc">
                    <li>Buka m-Banking atau ATM bank terkait.</li>
                    <li>Pilih menu <strong>Transfer $\rightarrow$ Virtual Account</strong>.</li>
                    <li>Masukkan nomor VA di atas dan konfirmasi nama merchant: <strong>{orgName}</strong>.</li>
                  </ul>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Sandbox Simulator Action */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    <strong>Mode Simulasi Sandbox:</strong> Klik tombol di bawah untuk mensimulasikan pembayaran instan tanpa potong saldo nyata.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isPending}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white text-sm font-extrabold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Simulasi Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>⚡ Simulasi Bayar Sukses (Instant Settle)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
