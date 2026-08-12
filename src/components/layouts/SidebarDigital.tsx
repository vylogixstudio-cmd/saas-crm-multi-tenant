'use client'

import React from 'react'
import BaseSidebar from './BaseSidebar'
import { DIGITAL_NAVIGATION } from './navigation'

interface SidebarProps {
  children: React.ReactNode
  userProfile: { name: string; email: string } | null
  role: string | null
  permissions: string[]
  updateCount: number
  splitRequestCount?: number
  org?: { name?: string; logo_url?: string } | null
}

export default function SidebarDigital(props: SidebarProps) {
  return (
    <BaseSidebar {...props} navigation={DIGITAL_NAVIGATION}>
      {props.children}
    </BaseSidebar>
  )
}
