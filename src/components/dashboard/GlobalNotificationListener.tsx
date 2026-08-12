'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import React from 'react'

interface GlobalNotificationListenerProps {
  organizationId: string
  currentUserId: string
}

export default function GlobalNotificationListener({ organizationId, currentUserId }: GlobalNotificationListenerProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Use state to hold supabase client across renders to prevent unnecessary re-subscriptions
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!organizationId || !currentUserId) return

    const channel = supabase
      .channel('global_notification_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_messages',
          filter: `organization_id=eq.${organizationId}`
        },
        async (payload) => {
          // If the new message is from the current user, ignore
          if (payload.new.author_id === currentUserId) return
          
          // If the user is currently looking at the chat page, don't show the toast
          if (window.location.pathname.includes('/dashboard/messages')) return

          // Fetch the author's name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.author_id)
            .single()

          const senderName = profile?.full_name || 'Tim Agensi'

          // Show a custom toast notification that is clickable
          toast(`Pesan baru dari ${senderName}`, {
            description: payload.new.content ? (payload.new.content.length > 50 ? payload.new.content.substring(0, 50) + '...' : payload.new.content) : 'Mengirim lampiran',
            icon: React.createElement(MessageSquare, { size: 16, className: 'text-emerald-500' }),
            action: {
              label: 'Buka',
              onClick: () => router.push('/dashboard/messages')
            },
            duration: 6000
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, currentUserId, router, supabase])

  return null
}
