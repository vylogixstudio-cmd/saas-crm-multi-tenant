import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  return <InventoryClient initialItems={items || []} />
}
