'use client'

import React, { useState } from 'react'
import {
  Zap,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import PaymentModal from '@/components/payment/PaymentModal'
import { generateWhatsAppLink, formatInvoiceMessage } from '@/utils/whatsapp'

interface InvoicePaymentActionsProps {
  invoiceId: string
  invoiceNumber: string
  title: string
  amount: number
  status: string
  dueDate?: string | null
  orgName: string
  clientName: string
  clientPhone?: string | null
}

export default function InvoicePaymentActions({
  invoiceId,
  invoiceNumber,
  title,
  amount,
  status,
  dueDate,
  orgName,
  clientName,
  clientPhone,
}: InvoicePaymentActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaidLocal, setIsPaidLocal] = useState(status === 'PAID')

  const handleOpenWhatsApp = () => {
    const message = formatInvoiceMessage({
      orgName,
      clientName,
      invoiceNumber,
      title,
      amount,
      dueDate,
      portalUrl: `https://vylogix-saas-crm.vercel.app/invoice/${invoiceId}`,
    })
    const link = generateWhatsAppLink(clientPhone, message)
    window.open(link, '_blank')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      {/* Tombol Kirim ke WhatsApp */}
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all active:scale-95 shadow-sm"
      >
        <MessageSquare size={16} className="text-emerald-600" />
        <span>Kirim ke WhatsApp</span>
      </button>

      {/* Tombol Bayar Online Sandbox / Lunas Badge */}
      {!isPaidLocal ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Zap size={16} />
          <span>⚡ Bayar Online (QRIS / VA Sandbox)</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Invoice Telah Lunas</span>
        </div>
      )}

      {/* Payment Modal Sandbox */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        title={title}
        amount={amount}
        orgName={orgName}
        clientName={clientName}
        clientPhone={clientPhone}
        onPaymentSuccess={() => {
          setIsPaidLocal(true)
        }}
      />
    </div>
  )
}
