'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPosInvoice(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid.' }
  }

  const supabase = createAdminClient()

  // Dapatkan org_id dari admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Organisasi tidak ditemukan.' }
  }
  const orgId = profile.organization_id

  const title = (formData.get('title') as string)?.trim()
  const clientId = formData.get('client_id') as string || null
  const projectId = formData.get('project_id') as string || null
  const terminLabel = formData.get('termin_label') as string || null
  const amountStr = formData.get('amount') as string
  const baseAmount = Number(amountStr) || 0
  
  const includeTax = formData.get('include_tax') === 'true'
  const taxAmount = includeTax ? Math.round(baseAmount * 0.12) : 0
  const finalAmount = baseAmount + taxAmount

  if (!title) {
    return { error: 'Judul invoice wajib diisi.' }
  }

  if (baseAmount <= 0) {
    return { error: 'Total harga harus lebih dari 0.' }
  }

  // Generate Invoice Number
  const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const invoiceNumber = `INV-${dateStr}`

  // 1. Insert ke fin_invoices
  const { data: invoice, error: invoiceError } = await supabase
    .from('fin_invoices')
    .insert({
      organization_id: orgId,
      client_id: clientId || null,
      project_id: projectId || null,
      termin_label: terminLabel || null,
      invoice_number: invoiceNumber,
      title,
      amount: finalAmount,
      status: 'PENDING'
    })
    .select()
    .single()

  if (invoiceError) {
    console.error('Create POS Invoice Error:', invoiceError)
    return { error: 'Gagal membuat invoice.' }
  }

  // (Optional) jika ada detail item
  const itemNames = formData.getAll('item_name[]') as string[]
  // Gunakan item_price_raw[] yang berisi angka murni (item_price[] berisi teks terformat mis. "1.500.000")
  const itemPricesRaw = formData.getAll('item_price_raw[]') as string[]
  const itemPricesFallback = formData.getAll('item_price[]') as string[]
  const itemQuantities = formData.getAll('item_quantity[]') as string[]

  if (itemNames.length > 0) {
    const itemsToInsert = itemNames.map((name, index) => {
      // Prioritaskan raw value, fallback ke formatted (hapus semua non-digit)
      const rawPrice = itemPricesRaw[index]
        ? Number(itemPricesRaw[index])
        : Number((itemPricesFallback[index] || '0').replace(/\D/g, ''))
      return {
        invoice_id: invoice.id,
        item_name: name,
        price: rawPrice || 0,
        quantity: Number(itemQuantities[index]) || 1
      }
    }).filter(item => item.item_name && item.price >= 0)

    if (includeTax && taxAmount > 0) {
      itemsToInsert.push({
        invoice_id: invoice.id,
        item_name: 'PPN 12%',
        price: taxAmount,
        quantity: 1
      })
    }

    if (itemsToInsert.length > 0) {
      await supabase.from('fin_invoice_items').insert(itemsToInsert)
    }
  } else if (projectId && terminLabel && baseAmount > 0) {
    // Otomatis buat 1 item jika Ops minta invoice tanpa rincian
    const itemsToInsert = [{
      invoice_id: invoice.id,
      item_name: title,
      price: baseAmount,
      quantity: 1
    }]
    
    if (includeTax && taxAmount > 0) {
      itemsToInsert.push({
        invoice_id: invoice.id,
        item_name: 'PPN 12%',
        price: taxAmount,
        quantity: 1
      })
    }

    await supabase.from('fin_invoice_items').insert(itemsToInsert)
  }

  // Jika ini invoice project dengan termin, hapus dari antrean invoice_requests
  if (projectId && terminLabel) {
    const { data: proj } = await supabase
      .from('projects')
      .select('invoice_requests')
      .eq('id', projectId)
      .single()
    
    if (proj) {
      const currentRequests: string[] = (proj.invoice_requests as string[]) || []
      const updatedRequests = currentRequests.filter(r => r !== terminLabel)
      await supabase
        .from('projects')
        .update({ invoice_requests: updatedRequests })
        .eq('id', projectId)
    }
  }

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard')
  return { success: true, invoiceId: invoice.id }
}

export async function markInvoiceAsPaid(invoiceId: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) return { error: 'Sesi tidak valid.' }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) return { error: 'Organisasi tidak ditemukan.' }
  const orgId = profile.organization_id

  // 1. Ambil invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('fin_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single()

  if (invoiceError || !invoice) {
    return { error: 'Invoice tidak ditemukan.' }
  }

  if (invoice.status === 'PAID') {
    return { error: 'Invoice sudah lunas.' }
  }

  // 2. Update status invoice
  const { error: updateError } = await supabase
    .from('fin_invoices')
    .update({ status: 'PAID' })
    .eq('id', invoiceId)
    .eq('organization_id', orgId)

  if (updateError) {
    return { error: 'Gagal update status invoice.' }
  }

  // 3. (Otomatisasi) Insert ke fin_transactions sebagai INCOME
  
  // a. Cari kategori default (atau buat jika tidak ada)
  let categoryId = null
  const { data: cat } = await supabase
    .from('fin_categories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', 'Pemasukan Kasir (POS)')
    .single()
    
  if (cat) {
    categoryId = cat.id
  } else {
    const { data: newCat } = await supabase
      .from('fin_categories')
      .insert({
        organization_id: orgId,
        name: 'Pemasukan Kasir (POS)',
        type: 'INCOME'
      })
      .select('id')
      .single()
    categoryId = newCat?.id
  }

  // b. Catat transaksi
  const { error: txError } = await supabase
    .from('fin_transactions')
    .insert({
      organization_id: orgId,
      category_id: categoryId,
      type: 'INCOME',
      amount: invoice.amount,
      description: `Pembayaran Lunas untuk Invoice ${invoice.invoice_number} - ${invoice.title}`,
      reference_id: invoice.id,
      reference_type: 'POS_INVOICE'
    })

  if (txError) {
    console.error('Auto-insert transaction error:', txError)
    // Walaupun gagal catat mutasi, invoice sudah diset PAID.
    // Idealnya pakai Postgres function untuk atomic transaction.
  }

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/finance')
  revalidatePath('/dashboard')
  if (invoice.project_id) {
    await recalculateProjectPaymentStatus(invoice.project_id, orgId)
    revalidatePath(`/dashboard/project/${invoice.project_id}`)
  }
  return { success: true }
}

export async function uploadPaymentProof(invoiceId: string, formData: FormData) {
  const file = formData.get('proof') as File | null
  
  // Note: RLS in storage should handle security, or we just rely on admin client here for simplicity,
  // BUT this function can be called by Client. Let's make it secure for whoever is logged in.
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user || !file) return { error: 'Invalid request.' }

  const supabase = createAdminClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `receipts/inv-${invoiceId}-${Date.now()}.${fileExt}`
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: urlData } = supabase.storage
    .from('assets')
    .getPublicUrl(fileName)

  // Update invoice
  await supabase
    .from('fin_invoices')
    .update({ payment_proof_url: urlData.publicUrl })
    .eq('id', invoiceId)

  revalidatePath(`/dashboard/pos/invoice/${invoiceId}`)
  return { success: true }
}

export async function cancelInvoice(invoiceId: string, reason?: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return { error: 'Sesi tidak valid.' }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'Organisasi tidak ditemukan.' }

  // Pastikan invoice milik org ini sebelum dibatalkan
  const { data: invoice } = await supabase
    .from('fin_invoices')
    .select('id, status, project_id, termin_label')
    .eq('id', invoiceId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  if (!invoice) return { error: 'Invoice tidak ditemukan.' }
  if (invoice.status === 'PAID') return { error: 'Invoice yang sudah lunas tidak bisa dibatalkan.' }
  if (invoice.status === 'CANCELLED') return { error: 'Invoice sudah dibatalkan sebelumnya.' }

  const { error: updateError } = await supabase
    .from('fin_invoices')
    .update({ status: 'CANCELLED', cancel_reason: reason || null })
    .eq('id', invoiceId)

  if (updateError) return { error: 'Gagal membatalkan invoice.' }

  // Kembalikan termin_label ke antrean invoice_requests jika ini invoice proyek
  if (invoice.project_id && invoice.termin_label) {
    const { data: proj } = await supabase
      .from('projects')
      .select('invoice_requests')
      .eq('id', invoice.project_id)
      .single()
      
    if (proj) {
      const currentRequests: string[] = (proj.invoice_requests as string[]) || []
      if (!currentRequests.includes(invoice.termin_label)) {
        currentRequests.push(invoice.termin_label)
        await supabase
          .from('projects')
          .update({ invoice_requests: currentRequests })
          .eq('id', invoice.project_id)
      }
    }
  }

  revalidatePath(`/dashboard/pos/invoice/${invoiceId}`)
  revalidatePath('/dashboard/pos')
  if (invoice.project_id) {
    await recalculateProjectPaymentStatus(invoice.project_id, profile.organization_id)
    revalidatePath(`/dashboard/project/${invoice.project_id}`)
  }
  return { success: true }
}

/**
 * Helper to recalculate a project's payment_status based on its PAID invoices.
 */
export async function recalculateProjectPaymentStatus(projectId: string, orgId: string) {
  const supabase = createAdminClient()

  // Ambil total_price dari proyek
  const { data: project } = await supabase
    .from('projects')
    .select('total_price')
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .single()
    
  if (!project) return

  // Jumlahkan semua invoice PAID untuk proyek ini
  const { data: invoices } = await supabase
    .from('fin_invoices')
    .select('amount')
    .eq('project_id', projectId)
    .eq('organization_id', orgId)
    .eq('status', 'PAID')

  const totalPaid = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0)
  
  let newStatus = 'pending'
  if (totalPaid > 0) {
    if (totalPaid >= project.total_price && project.total_price > 0) {
      newStatus = 'paid'
    } else {
      newStatus = 'partial'
    }
  }

  await supabase
    .from('projects')
    .update({ payment_status: newStatus })
    .eq('id', projectId)
    .eq('organization_id', orgId)
}
