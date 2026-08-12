'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createPhysicalOrder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) return { success: false, error: 'No org' }

  const clientId = formData.get('client_id') as string
  const title = formData.get('title') as string
  const serviceType = formData.get('service_type') as string
  const totalPrice = Number(formData.get('total_price')) || 0
  
  const itemType = formData.get('item_type') as string
  const quantity = Number(formData.get('quantity')) || 1
  const materialNotes = formData.get('material_notes') as string
  const sizeNotes = formData.get('size_notes') as string
  const colorNotes = formData.get('color_notes') as string
  const productionDeadline = formData.get('production_deadline') as string

  const designFlow = formData.get('design_flow') as string
  const initialStatus = designFlow === 'ready_print' ? 'production' : 'briefing'

  if (!clientId || !title) return { success: false, error: 'Missing required fields' }

  // 1. Create Project Master
  const { data: project, error: pError } = await supabase
    .from('projects')
    .insert({
      organization_id: profile.organization_id,
      client_id: clientId,
      title,
      service_type: serviceType,
      project_category: 'PHYSICAL',
      status: initialStatus,
      total_price: totalPrice,
      payment_status: 'pending',
      deadline: productionDeadline ? new Date(productionDeadline).toISOString() : null
    })
    .select('id')
    .single()

  if (pError) return { success: false, error: pError.message }

  const shippingAddress = formData.get('shipping_address') as string

  // 2. Create Physical Details
  const { error: detailError } = await supabase
    .from('project_physical_details')
    .insert({
      project_id: project.id,
      item_type: itemType,
      quantity,
      material_notes: materialNotes,
      size_notes: sizeNotes,
      color_notes: colorNotes,
      production_deadline: productionDeadline ? new Date(productionDeadline).toISOString() : null,
      shipping_status: 'WAITING',
      shipping_address: shippingAddress || null
    })

  if (detailError) {
    // Rollback project if detail fails
    await supabase.from('projects').delete().eq('id', project.id)
    return { success: false, error: detailError.message }
  }

  // 3. Opsi Kasir & Penagihan (Fase 5)
  const billingType = formData.get('billing_type') as string
  let invoiceId = null

  if (billingType === 'dp' || billingType === 'full') {
    const isDp = billingType === 'dp'
    const terminLabel = isDp ? 'Termin 1 (DP)' : 'Pembayaran Penuh'
    const invoiceAmount = isDp ? (totalPrice / 2) : totalPrice
    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const invoiceNumber = `INV-${dateStr}`

    // Update project invoice_requests agar POS tahu
    await supabase.from('projects')
      .update({ invoice_requests: [terminLabel] })
      .eq('id', project.id)

    // Insert Invoice PENDING
    const { data: invoice, error: invError } = await supabase
      .from('fin_invoices')
      .insert({
        organization_id: profile.organization_id,
        client_id: clientId,
        project_id: project.id,
        termin_label: terminLabel,
        invoice_number: invoiceNumber,
        title: `${terminLabel} - ${title}`,
        amount: invoiceAmount,
        status: 'PENDING'
      })
      .select('id').single()

    if (invoice && !invError) {
      invoiceId = invoice.id
      // Insert Invoice Item
      await supabase.from('fin_invoice_items').insert({
        invoice_id: invoiceId,
        item_name: `${itemType} (Qty: ${quantity})`,
        price: invoiceAmount,
        quantity: 1
      })
      
      // Karena invoice langsung digenerate, kita bisa hapus lagi dari invoice_requests (seperti di Pos actions)
      await supabase.from('projects')
        .update({ invoice_requests: [] })
        .eq('id', project.id)
    }
  }

  // 4. Log Activity
  await supabase.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'CREATE_PHYSICAL_ORDER',
    target_type: 'Project',
    target_id: project.id,
    target_name: title
  })

  revalidatePath('/dashboard/production')
  revalidatePath('/dashboard/pos')
  return { success: true, projectId: project.id, invoiceId }
}

export async function updateOrderStatus(projectId: string, newStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return { success: false, error: 'No org' }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('organization_id', profile.organization_id)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/production')
  return { success: true }
}

export async function addInternalNote(projectId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const supabaseAdmin = createAdminClient()
  const { data: note, error } = await supabaseAdmin
    .from('internal_notes')
    .insert({
      project_id: projectId,
      organization_id: profile?.organization_id,
      author_id: user.id,
      content
    })
    .select(`
      *,
      author:author_id (
        full_name,
        email
      )
    `)
    .single()

  if (error) {
    console.error('Error in addInternalNote:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/production')
  return { success: true, note }
}
