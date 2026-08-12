import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
  const supabaseAuth = await createClient()
  const supabase = createAdminClient()

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  if (!orgId) redirect('/login')

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  return <InventoryClient initialItems={items || []} />
}
