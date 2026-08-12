/**
 * Utility helper untuk WhatsApp Integration & Message Formatting (Multi-Tenant)
 */

export interface InvoiceMessagePayload {
  orgName: string
  clientName: string
  invoiceNumber: string
  title: string
  amount: number
  dueDate?: string | null
  portalUrl?: string
  bankInfo?: string
}

export interface OrderStatusMessagePayload {
  orgName: string
  clientName: string
  projectTitle: string
  statusLabel: string
  progressPercentage: number
  trackingNumber?: string | null
  shippingCourier?: string | null
  previewUrl?: string | null
  portalUrl?: string
}

export interface PaymentSuccessPayload {
  orgName: string
  clientName: string
  invoiceNumber: string
  amount: number
  title: string
  portalUrl?: string
}

// ── Format Helper: Format Rupiah ─────────────────────────────────────────────
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ── Normalize Indonesian Phone Number ────────────────────────────────────────
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  let clean = phone.replace(/[^0-9]/g, '')
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1)
  } else if (clean.startsWith('8')) {
    clean = '62' + clean
  } else if (clean.startsWith('+62')) {
    clean = clean.slice(1)
  }
  return clean
}

// ── 1. Format Pesan Invoice Baru ─────────────────────────────────────────────
export function formatInvoiceMessage(data: InvoiceMessagePayload): string {
  const portalLink = data.portalUrl || 'https://vylogix-saas-crm.vercel.app/portal'
  
  let msg = `🔔 *NOTIFIKASI TAGIHAN / INVOICE*\n`
  msg += `*${data.orgName.toUpperCase()}*\n\n`
  msg += `Halo *${data.clientName}*,\n`
  msg += `Faktur tagihan untuk pesanan *${data.title}* telah terbit dengan rincian sebagai berikut:\n\n`
  msg += `📄 *No. Faktur:* ${data.invoiceNumber}\n`
  msg += `💰 *Total Tagihan:* ${formatRupiah(data.amount)}\n`
  if (data.dueDate) {
    msg += `⏳ *Jatuh Tempo:* ${data.dueDate}\n`
  }
  if (data.bankInfo) {
    msg += `💳 *Info Pembayaran:* ${data.bankInfo}\n`
  }
  msg += `\n🔗 *Lihat Detail & Konfirmasi Bayar:*\n${portalLink}\n\n`
  msg += `_Pesan otomatis dari Sistem CRM ${data.orgName}._`
  
  return msg
}

// ── 2. Format Pesan Update Status Pesanan ─────────────────────────────────────
export function formatOrderStatusMessage(data: OrderStatusMessagePayload): string {
  const portalLink = data.portalUrl || 'https://vylogix-saas-crm.vercel.app/portal'

  let msg = `📦 *UPDATE PROGRESS PESANAN*\n`
  msg += `*${data.orgName.toUpperCase()}*\n\n`
  msg += `Halo *${data.clientName}*,\n`
  msg += `Ada perkembangan terbaru untuk pesanan Anda:\n\n`
  msg += `📌 *Proyek:* ${data.projectTitle}\n`
  msg += `📊 *Status Saat Ini:* ${data.statusLabel} (${data.progressPercentage}%)\n`
  
  if (data.shippingCourier && data.trackingNumber) {
    msg += `🚚 *Ekspedisi:* ${data.shippingCourier}\n`
    msg += `🔖 *No. Resi:* ${data.trackingNumber}\n`
  }

  if (data.previewUrl) {
    msg += `🌐 *Link Preview:* ${data.previewUrl}\n`
  }

  msg += `\n🔗 *Pantau Progres Lengkap:*\n${portalLink}\n\n`
  msg += `_Terima kasih telah mempercayakan proyek Anda kepada ${data.orgName}._`

  return msg
}

// ── 3. Format Pesan Konfirmasi Lunas ──────────────────────────────────────────
export function formatPaymentSuccessMessage(data: PaymentSuccessPayload): string {
  const portalLink = data.portalUrl || 'https://vylogix-saas-crm.vercel.app/portal'

  let msg = `✅ *PEMBAYARAN DITERIMA & LUNAS*\n`
  msg += `*${data.orgName.toUpperCase()}*\n\n`
  msg += `Halo *${data.clientName}*,\n`
  msg += `Pembayaran Anda untuk *${data.title}* telah kami terima dan diverifikasi.\n\n`
  msg += `📄 *No. Faktur:* ${data.invoiceNumber}\n`
  msg += `💵 *Jumlah Diterima:* ${formatRupiah(data.amount)}\n`
  msg += `🏷️ *Status:* LUNAS (PAID)\n\n`
  msg += `🔗 *Unduh Kuitansi / Bukti Pembayaran:*\n${portalLink}\n\n`
  msg += `_Terima kasih atas kerjasamanya! — ${data.orgName}_`

  return msg
}

// ── 4. Generate 1-Click WhatsApp Direct Link (wa.me) ─────────────────────────
export function generateWhatsAppLink(phone: string | null | undefined, message: string): string {
  const cleanPhone = normalizePhoneNumber(phone)
  const encodedText = encodeURIComponent(message)
  
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`
  }
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

// ── 5. Send WhatsApp via Fonnte Gateway API (Server-Side) ─────────────────────
export async function sendWhatsAppViaFonnte({
  phone,
  message,
  token,
}: {
  phone: string
  message: string
  token: string
}): Promise<{ success: boolean; message: string; data?: any }> {
  const cleanPhone = normalizePhoneNumber(phone)
  
  if (!cleanPhone) {
    return { success: false, message: 'Nomor telepon tujuan tidak valid.' }
  }

  if (!token) {
    return { success: false, message: 'Token Fonnte belum dikonfigurasi untuk agensi ini.' }
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: cleanPhone,
        message: message,
        countryCode: '62',
      }),
    })

    const resJson = await response.json()

    if (resJson.status === true || resJson.status === 'true' || response.ok) {
      return { success: true, message: 'Pesan WhatsApp berhasil dikirim!', data: resJson }
    } else {
      return { success: false, message: resJson.reason || resJson.message || 'Gagal mengirim WhatsApp via Gateway.' }
    }
  } catch (error: any) {
    console.error('Fonnte API Error:', error)
    return { success: false, message: error.message || 'Terjadi kesalahan jaringan gateway WhatsApp.' }
  }
}
