'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// MASTER MATERIAL ACTIONS
export async function createInventoryItem(data: { name: string, category: string, current_stock: number, unit: string, min_stock_alert: number }) {
  const supabase = await createClient()
  
  // Ambil org id dari user login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return { error: 'No organization' }

  const { data: newItem, error } = await supabase
    .from('inventory_items')
    .insert({
      organization_id: profile.organization_id,
      name: data.name,
      category: data.category || 'Umum',
      current_stock: data.current_stock || 0,
      unit: data.unit || 'Pcs',
      min_stock_alert: data.min_stock_alert || 5
    })
    .select()
    .single()

  if (error) {
    console.error('Create item error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard')
  return { data: newItem }
}

export async function updateInventoryItem(id: string, data: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return { error: 'No organization' }
  
  const { data: updated, error } = await supabase
    .from('inventory_items')
    .update({
      name: data.name,
      category: data.category,
      unit: data.unit,
      min_stock_alert: data.min_stock_alert
    })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard')
  return { data: updated }
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return { error: 'No organization' }

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard')
  return { success: true }
}

// INVENTORY TRANSACTIONS (IN, OUT, ADJUST)
export async function recordInventoryTransaction(data: { item_id: string, type: 'IN'|'OUT'|'ADJUST', quantity: number, notes?: string }) {
  const supabaseAuth = await createClient()
  const supabase = createAdminClient()
  
  // Get org and user
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('organization_id, full_name').eq('id', user.id).single()
  if (!profile?.organization_id) return { error: 'No organization' }

  // Check current item
  const { data: item, error: itemErr } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', data.item_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (itemErr || !item) return { error: 'Item not found' }

  let newStock = Number(item.current_stock)
  
  if (data.type === 'IN') {
    newStock += Number(data.quantity)
  } else if (data.type === 'OUT') {
    if (newStock < Number(data.quantity)) {
      return { error: 'Stok tidak mencukupi untuk pengeluaran ini!' }
    }
    newStock -= Number(data.quantity)
  } else if (data.type === 'ADJUST') {
    // For adjust, the quantity IS the new stock (from client's perspective usually)
    // But wait, the transaction table's "quantity" column usually records the *diff* or the *new total*?
    // Let's store the DIFF in the transaction, but let the user input the NEW ACTUAL STOCK.
    // So the client sends data.quantity as the DIFF (e.g. +5 or -2).
    newStock += Number(data.quantity) // client should calculate the diff
  }

  // 1. Update master stok
  const { error: updateErr } = await supabase
    .from('inventory_items')
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', data.item_id)
    .eq('organization_id', profile.organization_id)

  if (updateErr) return { error: updateErr.message }

  // 2. Catat riwayat
  const { error: txErr } = await supabase
    .from('inventory_transactions')
    .insert({
      item_id: data.item_id,
      organization_id: profile.organization_id,
      type: data.type,
      quantity: Math.abs(Number(data.quantity)), // always store positive diff in tx history or leave as is? Let's just store what was passed.
      notes: data.notes,
      actor_id: user.id,
      actor_name: profile.full_name
    })

  if (txErr) return { error: txErr.message }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/inventory/inbound')
  revalidatePath('/dashboard/inventory/outbound')
  revalidatePath('/dashboard/inventory/opname')
  revalidatePath('/dashboard')
  
  return { success: true, newStock }
}
