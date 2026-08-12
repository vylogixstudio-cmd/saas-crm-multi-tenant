import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building2, CheckCircle, Clock,
  ExternalLink, AlertTriangle, ImageIcon, XCircle, Tag
} from 'lucide-react'
import PrintButton from './PrintButton'

export default async function ProjectInvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string, invoiceId: string }>
}) {
  const { id, invoiceId } = await params

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id
  const userRole = profile?.role

  if (!orgId && userRole !== 'super_admin') {
    redirect(`/dashboard/project/${id}`)
  }

  let invoiceQuery = supabase
    .from('fin_invoices')
    .select(`
      *,
      fin_invoice_items (*),
      organizations (name, logo_url, whatsapp_number, qris_image_url),
      profiles:client_id (full_name, email),
      projects (title, total_price)
    `)
    .eq('id', invoiceId)

  if (userRole !== 'super_admin' && orgId) {
    invoiceQuery = invoiceQuery.eq('organization_id', orgId)
  }

  const { data: invoice, error } = await invoiceQuery.maybeSingle()

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8">
        <div className="bg-white rounded-[20px] p-8 max-w-md w-full text-center shadow-sm border border-black/5">
          <AlertTriangle size={40} className="mx-auto text-amber-400 mb-4" />
          <h2 className="font-extrabold text-xl text-[#111827] mb-2">Gagal Memuat Invoice</h2>
          <p className="text-sm text-[#4B5563] mb-4 font-mono text-xs bg-[#F8F9FA] p-2 rounded">{error.message}</p>
          <Link href={`/dashboard/project/${id}`} className="inline-block bg-[#2563EB] text-white font-bold px-4 py-2 rounded-[10px] text-sm">
            Kembali ke Proyek
          </Link>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8">
        <div className="bg-white rounded-[20px] p-8 max-w-md w-full text-center shadow-sm border border-black/5">
          <AlertTriangle size={40} className="mx-auto text-[#D1D5DB] mb-4" />
          <h2 className="font-extrabold text-xl text-[#111827] mb-2">Invoice Tidak Ditemukan</h2>
          <Link href={`/dashboard/project/${id}`} className="inline-block bg-[#2563EB] text-white font-bold px-4 py-2 rounded-[10px] text-sm">
            Kembali ke Proyek
          </Link>
        </div>
      </div>
    )
  }

  const org = invoice.organizations as any
  const client = invoice.profiles as any
  const project = invoice.projects as any
  const items: any[] = (invoice as any).fin_invoice_items || []
  const terminLabel = (invoice as any).termin_label as string | null

  const maskWA = (wa: string | null | undefined) => {
    if (!wa) return '-'
    if (wa.length < 6) return wa
    return wa.substring(0, 4) + 'xxxxx' + wa.substring(wa.length - 2)
  }

  // Hitung total paid untuk proyek
  let totalPaidForProject = 0
  let sisaTagihan = 0
  if (project && invoice.project_id) {
    const { data: allProjInvoices } = await supabase
      .from('fin_invoices')
      .select('amount, status, id')
      .eq('project_id', invoice.project_id)
    totalPaidForProject = (allProjInvoices || [])
      .filter(inv => inv.status === 'PAID')
      .reduce((s, inv) => s + Number(inv.amount), 0)
    sisaTagihan = Math.max(0, Number(project.total_price) - totalPaidForProject)
  }

  const statusConfig = {
    PAID: { label: 'Lunas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={16} /> },
    PENDING: { label: 'Menunggu Pembayaran', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={16} /> },
    CANCELLED: { label: 'Dibatalkan', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <XCircle size={16} /> },
  }
  const statusCfg = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.PENDING

  return (
    <div className="min-h-screen bg-[#F8F9FA] print:bg-white">

      {/* Cancelled Banner */}
      {invoice.status === 'CANCELLED' && (
        <div className="bg-rose-50 border-b border-rose-100 p-4 sm:px-8 text-rose-700 text-sm font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <XCircle size={18} /> 
            <div>
              <p>Invoice ini telah DIBATALKAN oleh Tim Keuangan.</p>
              {invoice.cancel_reason && <p className="font-medium text-xs text-rose-600 mt-1">Alasan: {invoice.cancel_reason}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Action Bar ── */}
      <div className="p-4 sm:p-8 pb-6 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href={`/dashboard/project/${id}`}
            className="flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] px-4 py-2 bg-white border border-black/10 rounded-[10px] shadow-sm transition-all"
          >
            <ArrowLeft size={16} /> Kembali ke Kelola Proyek
          </Link>
          
          <PrintButton />
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-12 max-w-5xl mx-auto space-y-6 print:px-0 print:space-y-0">

        {/* ══════════════════════════════════════════════════
            SECTION A — PREVIEW INVOICE (Printable)
        ══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-[20px] sm:shadow-lg border border-black/5 print:shadow-none print:border-none print:rounded-none overflow-hidden">

          <div className="p-8 sm:p-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-black/10 pb-8 mb-8 gap-8">
              <div>
                {org?.logo_url
                  ? <img src={org.logo_url} alt="Logo" className="h-12 w-auto mb-4 object-contain" />
                  : <div className="flex items-center gap-2 text-[#111827] mb-4"><Building2 size={28} className="text-[#2563EB]" /><span className="font-extrabold text-xl">{org?.name}</span></div>
                }
                <p className="text-sm font-medium text-[#4B5563]">{org?.name}</p>
                <p className="text-sm text-[#4B5563]">WA: {maskWA(org?.whatsapp_number)}</p>
              </div>
              <div className="text-left sm:text-right">
                <h2 className="font-extrabold text-3xl text-[#111827] tracking-tight mb-1">INVOICE</h2>
                <p className="text-sm font-bold text-[#6B7280] mb-3">#{invoice.invoice_number}</p>
                {terminLabel && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2 py-1 rounded-full mb-2">
                    <Tag size={10} /> {terminLabel}
                  </span>
                )}
                <p className="text-sm text-[#4B5563]">
                  {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Klien & Keterangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Ditagihkan Kepada:</p>
                <p className="font-bold text-[#111827] text-base">{client?.full_name || 'Klien Eksternal'}</p>
                {client?.email && <p className="text-sm text-[#4B5563]">{client.email}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Keterangan:</p>
                <p className="font-bold text-[#111827]">{invoice.title}</p>
                {project && <p className="text-xs text-[#4B5563] mt-1">Proyek: {project.title}</p>}
              </div>
            </div>

            {/* Tabel Item */}
            <div className="mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black/10 text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="py-3 px-2">Deskripsi</th>
                    <th className="py-3 px-2 text-center w-20">Qty</th>
                    <th className="py-3 px-2 text-right w-36">Harga</th>
                    <th className="py-3 px-2 text-right w-40">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-[#111827]">
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="py-4 px-2">{item.item_name}</td>
                      <td className="py-4 px-2 text-center">{item.quantity}</td>
                      <td className="py-4 px-2 text-right">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                      <td className="py-4 px-2 text-right font-bold text-[#2563EB]">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-[#9CA3AF] italic text-sm">Tidak ada rincian item</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total + QRIS */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-8 border-t-2 border-black/10 pt-6">
              <div className="w-full sm:w-1/2 order-2 sm:order-1 flex gap-6">
                {org?.qris_image_url && (
                  <div className="shrink-0 p-2 border border-black/10 rounded-[12px] bg-[#F8F9FA]">
                    <img src={org.qris_image_url} alt="QRIS" className="w-24 h-24 object-contain" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Status Pembayaran:</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-3 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-64 order-1 sm:order-2 space-y-3">
                <div className="flex justify-between text-sm text-[#4B5563] font-medium px-2">
                  <span>Subtotal</span>
                  <span>Rp {Number(invoice.amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between bg-[#F8F9FA] p-3 rounded-[12px] font-extrabold text-lg">
                  <span className="text-[#111827]">Total</span>
                  <span className="text-[#2563EB]">Rp {Number(invoice.amount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-black/5 text-center text-[10px] text-[#9CA3AF]">
              <p>Invoice ini dibuat secara sah oleh sistem dan tidak memerlukan tanda tangan basah.</p>
              <p className="mt-1">Terima kasih telah mempercayakan layanan kepada {org?.name}.</p>
            </div>
          </div>
        </div>
        
        {/* ══════════════════════════════════════════════════
            SECTION B — BUKTI PEMBAYARAN KLIEN (print:hidden)
        ══════════════════════════════════════════════════ */}
        <div className="print:hidden">
          <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-8">
            <h3 className="font-extrabold text-sm text-[#111827] mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-[#2563EB]" /> Bukti Pembayaran dari Klien
            </h3>
            {invoice.payment_proof_url ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  <CheckCircle size={12} /> Klien sudah upload bukti transfer
                </div>
                <div className="border border-black/10 rounded-[12px] p-2 bg-[#F8F9FA] inline-block">
                  <a href={invoice.payment_proof_url} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={invoice.payment_proof_url}
                      alt="Bukti Transfer"
                      className="max-w-full max-h-[600px] rounded-[8px] hover:opacity-90 transition-opacity object-contain"
                    />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-[#F8F9FA] rounded-[12px] border border-dashed border-black/10">
                <ImageIcon size={32} className="text-[#D1D5DB] mb-3" />
                <p className="text-sm font-semibold text-[#9CA3AF]">Klien belum upload bukti pembayaran</p>
                <p className="text-xs text-[#D1D5DB] mt-1">Status akan diupdate oleh bagian Keuangan setelah bukti diterima.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
