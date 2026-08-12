import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, Building2, CheckCircle, Clock, AlertTriangle, Tag, ExternalLink } from 'lucide-react'
import PrintButton from './PrintButton'
import UploadProofForm from './UploadProofForm'
import SplitInvoiceClient from './SplitInvoiceClient'
import InvoicePaymentActions from './InvoicePaymentActions'

export default async function PublicInvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()
  
  // Ambil data invoice + items + org info + client info
  const { data: invoice, error } = await supabase
    .from('fin_invoices')
    .select(`
      *,
      fin_invoice_items (*),
      organizations (
        name,
        logo_url,
        whatsapp_number,
        qris_image_url
      ),
      profiles:client_id (
        full_name,
        email,
        whatsapp_number
      ),
      projects (
        title,
        total_price,
        project_category
      )
    `)
    .eq('id', id)
    .maybeSingle()

  // Tampilkan pesan error yang jelas — BUKAN redirect buta
  if (error) {
    console.error('[Public Invoice Error]', error.message)
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8">
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-8 max-w-md w-full text-center">
          <AlertTriangle size={40} className="mx-auto text-amber-400 mb-4" />
          <h2 className="font-extrabold text-xl text-[#111827] mb-2">Gagal Memuat Invoice</h2>
          <p className="text-[#4B5563] text-sm mb-4">Terjadi kesalahan saat mengambil data invoice.</p>
          <Link href="/dashboard" className="inline-block bg-[#2563EB] text-white font-bold px-4 py-2 rounded-[10px] text-sm hover:bg-[#1D4ED8] transition-all">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8">
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-8 max-w-md w-full text-center">
          <AlertTriangle size={40} className="mx-auto text-[#D1D5DB] mb-4" />
          <h2 className="font-extrabold text-xl text-[#111827] mb-2">Invoice Tidak Ditemukan</h2>
          <p className="text-[#4B5563] text-sm mb-4">Invoice ini tidak ada atau belum dibuat oleh agensi.</p>
          <Link href="/dashboard" className="inline-block bg-[#2563EB] text-white font-bold px-4 py-2 rounded-[10px] text-sm hover:bg-[#1D4ED8] transition-all">
            Kembali ke Dashboard
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

  // Hitung total yang sudah dibayar untuk proyek ini jika ada
  let totalPaidForProject = 0
  if (project && invoice.project_id) {
    const { data: allProjInvoices } = await supabase
      .from('fin_invoices')
      .select('amount, status, id')
      .eq('project_id', invoice.project_id)

    totalPaidForProject = (allProjInvoices || [])
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.amount), 0)
  }

  const sisaTagihan = project 
    ? Math.max(0, Number(project.total_price) - totalPaidForProject) 
    : 0

  const backLink = invoice.project_id ? `/portal/project/${invoice.project_id}` : '/portal'

  return (
    <div className="min-h-screen bg-[#F8F9FA] print:bg-white print:min-h-0">
      {/* ── Action Bar (Sembunyikan saat print) ── */}
      <div className="p-4 sm:p-8 pb-0 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Link 
            href={backLink}
            className="flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] px-4 py-2 bg-white border border-black/10 rounded-[10px] shadow-sm transition-all print:hidden"
          >
            <ArrowLeft size={16} /> Kembali ke Portal Proyek
          </Link>
          
          <div className="flex flex-wrap items-center gap-2">
            <InvoicePaymentActions
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoice_number}
              title={invoice.title || project?.title || 'Layanan Agensi'}
              amount={Number(invoice.amount)}
              status={invoice.status}
              dueDate={invoice.due_date}
              orgName={org?.name || 'Agensi'}
              clientName={client?.full_name || 'Klien'}
              clientPhone={client?.whatsapp_number || null}
            />
            <PrintButton />
          </div>
        </div>
      </div>

      {/* ── Area Cetak Invoice ── */}
      <div className="p-4 sm:p-8 pt-0 print:p-0">
        <div className="max-w-4xl mx-auto bg-white rounded-[20px] sm:shadow-lg border border-black/5 print:shadow-none print:border-none print:rounded-none overflow-hidden relative">
          
          {/* Status Banner */}
          <div className={`p-3 text-center print:hidden ${
            invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
            invoice.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
            'bg-amber-50 text-amber-700'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              {invoice.status === 'PAID' && <><CheckCircle size={14} /> Lunas</>}
              {invoice.status === 'CANCELLED' && <>Dibatalkan</>}
              {invoice.status === 'PENDING' && <><Clock size={14} /> Menunggu Pembayaran</>}
            </span>
          </div>

          <div className="p-8 sm:p-12">
            {/* Header Invoice */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-black/10 pb-8 mb-8 gap-8">
              <div>
                {org?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logo_url} alt="Logo" className="h-12 w-auto mb-4 object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-[#111827] mb-4">
                    <Building2 size={32} className="text-[#2563EB]" />
                    <span className="font-extrabold text-2xl">{org?.name}</span>
                  </div>
                )}
                <div className="text-sm font-medium text-[#4B5563] leading-relaxed">
                  <p className="font-bold text-[#111827]">{org?.name}</p>
                  <p>WA: {maskWA(org?.whatsapp_number)}</p>
                </div>
              </div>
              
              <div className="text-left sm:text-right">
                <h1 className="font-extrabold text-3xl text-[#111827] tracking-tight mb-2">INVOICE</h1>
                <p className="text-sm font-bold text-[#6B7280] mb-4">#{invoice.invoice_number}</p>
                <div className="text-sm font-medium text-[#4B5563]">
                  <p>Tanggal Dibuat: {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {invoice.due_date && (
                    <p className="mt-1">Jatuh Tempo: <span className="font-bold text-rose-500">{new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Info Klien & Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Ditagihkan Kepada:</p>
                <div className="text-sm font-medium text-[#4B5563] leading-relaxed">
                  <p className="font-bold text-[#111827] text-base">{client ? client.full_name : 'Klien Eksternal'}</p>
                  {client?.email && <p>{client.email}</p>}
                </div>
              </div>
              
              <div className="sm:text-right">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Keterangan / Judul:</p>
                <div className="text-sm font-bold text-[#111827] leading-relaxed">
                  <p>{invoice.title}</p>
                  {project && <p className="text-xs font-medium text-[#4B5563] mt-1">Proyek: {project.title}</p>}
                </div>
              </div>
            </div>

            {/* Tabel Item */}
            <div className="mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black/10 text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="py-3 px-2">Deskripsi Layanan / Item</th>
                    <th className="py-3 px-2 text-center w-20">Qty</th>
                    <th className="py-3 px-2 text-right w-32">Harga</th>
                    <th className="py-3 px-2 text-right w-40">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-[#111827]">
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="py-4 px-2">{item.item_name}</td>
                      <td className="py-4 px-2 text-center">{item.quantity}</td>
                      <td className="py-4 px-2 text-right">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                      <td className="py-4 px-2 text-right font-bold text-[#2563EB]">
                        Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#9CA3AF] font-medium text-sm italic">
                        Tidak ada rincian item (Invoice total)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Area */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-8 border-t-2 border-black/10 pt-6">
              
              {/* Instruksi Pembayaran (kiri) */}
              <div className="w-full sm:w-1/2 order-2 sm:order-1 flex gap-6">
                {org?.qris_image_url ? (
                  <div className="shrink-0 p-2 border border-black/10 rounded-[12px] bg-[#F8F9FA]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={org.qris_image_url} alt="QRIS" className="w-24 h-24 object-contain" />
                  </div>
                ) : null}
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Instruksi Pembayaran:</p>
                  <p className="text-[11px] font-medium text-[#4B5563] leading-relaxed">
                    Mohon lakukan pembayaran sesuai dengan total tagihan. 
                    {org?.qris_image_url ? ' Scan kode QRIS di samping untuk pembayaran instan.' : ''}
                  </p>
                </div>
              </div>

              {/* Kalkulasi (kanan) */}
              <div className="w-full sm:w-72 order-1 sm:order-2 space-y-3 text-sm">
                <div className="flex justify-between items-center text-[#4B5563] font-medium px-2">
                  <span>Subtotal</span>
                  <span>Rp {Number(invoice.amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center bg-[#F8F9FA] p-3 rounded-[12px] font-extrabold text-[#111827] text-lg mb-2">
                  <span>Total</span>
                  <span className="text-[#2563EB]">Rp {Number(invoice.amount).toLocaleString('id-ID')}</span>
                </div>
                {project && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-[12px] mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2">Ringkasan Proyek</p>
                    <div className="flex justify-between items-center text-blue-900 font-medium mb-1">
                      <span>Total Biaya Proyek</span>
                      <span>Rp {Number(project.total_price).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-900 font-bold">
                      <span>Sisa Tagihan</span>
                      <span>Rp {sisaTagihan.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-black/5 text-center text-[10px] font-medium text-[#9CA3AF]">
              <p>Invoice ini dibuat secara sah oleh sistem dan tidak memerlukan tanda tangan basah.</p>
              <p className="mt-1">Terima kasih telah mempercayakan layanan kepada {org?.name}.</p>
            </div>

          </div>
        </div>
        
        {/* Bukti Pembayaran */}
        {invoice.payment_proof_url && (
          <div className="max-w-4xl mx-auto mt-6 bg-white rounded-[20px] shadow-sm border border-black/5 p-6 print:hidden">
            <h3 className="font-extrabold text-sm text-[#111827] mb-4 flex items-center gap-2">
              <ExternalLink size={16} /> Lampiran Bukti Pembayaran
            </h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href={invoice.payment_proof_url} target="_blank" rel="noreferrer">
              <img src={invoice.payment_proof_url} alt="Bukti Transfer" className="max-h-64 rounded-[12px] border border-black/10 hover:opacity-80 transition-opacity" />
            </a>
          </div>
        )}
        {!invoice.parent_invoice_id && (
          <SplitInvoiceClient invoice={invoice} />
        )}

        {/* Upload Bukti Pembayaran — hanya tampil jika invoice masih PENDING */}
        {(invoice.status === 'PENDING' || invoice.status === 'WAITING_CONFIRMATION') && (
          <div className="max-w-4xl mx-auto mt-0 print:hidden">
            <UploadProofForm invoiceId={invoice.id} existingProofUrl={invoice.payment_proof_url ?? null} />
          </div>
        )}

        {/* Bukti sudah diupload tapi belum dikonfirmasi */}
        {invoice.status === 'PENDING' && invoice.payment_proof_url && (
          <div className="max-w-4xl mx-auto mt-0 print:hidden" />
        )}
      </div>
    </div>
  )
}
