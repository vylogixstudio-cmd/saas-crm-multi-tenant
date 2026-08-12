'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function uploadPaymentProof(invoiceId: string, formData: FormData) {
  const file = formData.get('proof') as File | null
  if (!file || file.size === 0) return { error: 'Pilih file terlebih dahulu.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Ukuran file maksimal 5MB.' }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) return { error: 'Format hanya JPG, PNG, WEBP, atau GIF.' }

  // Pastikan user terautentikasi
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return { error: 'Sesi tidak valid. Silakan login kembali.' }

  const supabase = createAdminClient()

  // Upload ke bucket 'assets' subfolder 'payment-proofs/'
  const fileExt = file.name.split('.').pop()
  const fileName = `payment-proofs/inv-${invoiceId}-${Date.now()}.${fileExt}`
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('[Upload Proof Error]', uploadError)
    return { error: 'Gagal mengupload file. Pastikan storage tersedia.' }
  }

  const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName)

  // Simpan URL ke invoice
  const { error: updateError } = await supabase
    .from('fin_invoices')
    .update({ 
      payment_proof_url: urlData.publicUrl,
      status: 'WAITING_CONFIRMATION' 
    })
    .eq('id', invoiceId)

  if (updateError) {
    return { error: 'Gagal menyimpan bukti pembayaran.' }
  }

  revalidatePath(`/invoice/${invoiceId}`)
  return { success: true, url: urlData.publicUrl }
}

export async function requestInvoiceSplit(invoiceId: string, splitCount: number, reason: string) {
  if (!reason.trim()) return { error: 'Alasan pengajuan wajib diisi.' }
  if (splitCount < 2 || splitCount > 12) return { error: 'Jumlah cicilan tidak valid.' }

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return { error: 'Sesi tidak valid. Silakan login kembali.' }

  const supabase = createAdminClient()

  // Ambil invoice dan pastikan milik user yang sedang login
  const { data: invoice, error: fetchError } = await supabase
    .from('fin_invoices')
    .select('status, client_id')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) return { error: 'Invoice tidak ditemukan.' }
  if (invoice.client_id && invoice.client_id !== user.id) {
    return { error: 'Akses ditolak.' }
  }
  if (invoice.status !== 'PENDING') return { error: 'Hanya invoice berstatus PENDING yang bisa diajukan cicilannya.' }

  const details = {
    split_count: splitCount,
    client_reason: reason.trim(),
    pos_rejection_reason: null
  }

  const { error: updateError } = await supabase
    .from('fin_invoices')
    .update({ 
      status: 'SPLIT_REQUESTED',
      split_request_details: details 
    })
    .eq('id', invoiceId)

  if (updateError) {
    console.error('Update Split Error:', updateError)
    return { error: 'Gagal mengirim pengajuan cicilan: ' + updateError.message }
  }

  revalidatePath(`/invoice/${invoiceId}`)
  return { success: true }
}
