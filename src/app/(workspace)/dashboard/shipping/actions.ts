'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processShipping(projectId: string, formData: FormData) {
  const supabase = await createClient()
  
  const courier = formData.get('shipping_courier') as string
  const trackingNumber = formData.get('tracking_number') as string
  const deliveryType = formData.get('delivery_type') as string // 'courier' or 'pickup'

  const actualCourier = deliveryType === 'pickup' ? 'Diambil Klien' : courier

  // 1. Update project status to 'shipped' and progress to 95%
  const { error: projError } = await supabase
    .from('projects')
    .update({ 
      status: 'shipped',
      progress_percentage: 95,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (projError) return { error: 'Gagal update status proyek: ' + projError.message }

  // 2. Update physical detail (set shipping_status to SHIPPED)
  const { error } = await supabase
    .from('project_physical_details')
    .update({ 
      shipping_status: 'SHIPPED',
      shipping_courier: actualCourier,
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  if (error) return { error: error.message }

  // 3. Add internal note
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    let noteContent = `[SISTEM] Pesanan dalam perjalanan.`
    if (deliveryType === 'pickup') noteContent = `[SISTEM] Pesanan siap dan menunggu diambil oleh klien.`
    else if (actualCourier) noteContent = `[SISTEM] Dikirim via ${actualCourier} (Resi: ${trackingNumber || '-'})`

    await supabase.from('internal_notes').insert({
      project_id: projectId,
      organization_id: profile?.organization_id,
      author_id: user.id,
      content: noteContent,
      visible_to_client: true
    })
  }

  revalidatePath('/dashboard/shipping')
  revalidatePath('/dashboard/shipping/confirmation')
  revalidatePath('/dashboard/shipping/history')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  return { success: true }
}

export async function confirmDelivery(projectId: string) {
  const supabase = await createClient()

  // Update project status to completed
  const { error: projectError } = await supabase
    .from('projects')
    .update({ 
      status: 'completed',
      progress_percentage: 100,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (projectError) return { error: projectError.message }

  // Update physical detail (set shipping_status to DELIVERED)
  const { error: detailError } = await supabase
    .from('project_physical_details')
    .update({ 
      shipping_status: 'DELIVERED',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  if (detailError) return { error: detailError.message }

  // Add internal note
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    await supabase.from('internal_notes').insert({
      project_id: projectId,
      organization_id: profile?.organization_id,
      author_id: user.id,
      content: '[SISTEM] Pesanan telah DITERIMA oleh klien. Proyek SELESAI.',
      visible_to_client: true
    })
  }

  revalidatePath('/dashboard/shipping/confirmation')
  revalidatePath('/dashboard/shipping/history')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// reshipReturnOrder — Staf setujui retur dan input resi baru untuk pengiriman ulang
// ─────────────────────────────────────────────────────────────────────────────
export async function reshipReturnOrder(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const courier = formData.get('shipping_courier') as string
  const trackingNumber = formData.get('tracking_number') as string
  const notes = (formData.get('reship_notes') as string) || ''

  if (!courier?.trim()) return { error: 'Nama kurir / ekspedisi wajib diisi.' }

  // 1. Update project status back to shipped
  const { error: projError } = await supabase
    .from('projects')
    .update({
      status: 'shipped',
      progress_percentage: 95,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (projError) return { error: projError.message }

  // 2. Update physical details with new courier and tracking number
  const { error: detailError } = await supabase
    .from('project_physical_details')
    .update({
      shipping_status: 'SHIPPED',
      shipping_courier: courier,
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  if (detailError) return { error: detailError.message }

  // 3. Add internal note
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const content = `[PENGIRIMAN ULANG RETUR] Retur disetujui. Barang pengganti telah dikirim via ${courier} (Resi Baru: ${trackingNumber || '-'}). ${notes ? `Catatan: ${notes}` : ''}`
    await supabase.from('internal_notes').insert({
      project_id: projectId,
      organization_id: profile?.organization_id,
      author_id: user.id,
      content,
      visible_to_client: true
    })
  }

  revalidatePath('/dashboard/shipping/confirmation')
  revalidatePath('/dashboard/shipping/history')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// cancelAndRefundOrder — Batalkan pesanan karena komplain / refund
// ─────────────────────────────────────────────────────────────────────────────
export async function cancelAndRefundOrder(projectId: string, reason: string) {
  const supabase = await createClient()

  // 1. Update project status to cancelled
  const { error: projError } = await supabase
    .from('projects')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (projError) return { error: projError.message }

  // 2. Update physical detail
  await supabase
    .from('project_physical_details')
    .update({
      shipping_status: 'CANCELLED',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  // 3. Add internal note
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    await supabase.from('internal_notes').insert({
      project_id: projectId,
      organization_id: profile?.organization_id,
      author_id: user.id,
      content: `[PESANAN DIBATALKAN / REFUND] Pesanan dibatalkan atas kesepakatan komplain & pengembalian dana. Alasan: ${reason || 'Komplain Klien'}`,
      visible_to_client: true
    })
  }

  revalidatePath('/dashboard/shipping/confirmation')
  revalidatePath('/dashboard/shipping/history')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/projects/completed')
  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  return { success: true }
}
