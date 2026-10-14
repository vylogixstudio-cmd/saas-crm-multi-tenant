import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import GlobalChatClient from '@/components/dashboard/GlobalChatClient'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const { user, profile, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) {
    redirect('/login')
  }

  if (isSuspended) {
    redirect('/suspended')
  }

  if (!orgId) {
    redirect('/dashboard')
  }

  // 2. Fetch Initial Messages
  // Mengambil 50 pesan terakhir
  const { data: messages } = await supabase
    .from('global_messages')
    .select(`
      id,
      content,
      file_url,
      created_at,
      tagged_projects,
      author_id,
      author:profiles!global_messages_author_id_fkey(full_name, role)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  // 3. Fetch Active Projects for Tagging
  // Hanya ambil project yang belum selesai (bukan COMPLETED / DELIVERED)
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('id, title, status')
    .eq('organization_id', orgId)
    .not('status', 'in', '("COMPLETED", "DELIVERED")')
    .order('created_at', { ascending: false })
    .limit(100)

  // Reverse messages so the oldest is at the top (WhatsApp style)
  const initialMessages = messages ? (messages as unknown as any[]).reverse() : []

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-90px)] bg-[#F8F9FA] rounded-[32px] overflow-hidden shadow-sm border border-black/5 mx-2 my-2 sm:mx-8 sm:my-4">
      <GlobalChatClient 
        currentUser={profile}
        initialMessages={initialMessages}
        activeProjects={activeProjects || []}
      />
    </div>
  )
}
