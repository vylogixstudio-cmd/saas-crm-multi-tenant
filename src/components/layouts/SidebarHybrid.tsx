'use client'

import React from 'react'
import BaseSidebar from './BaseSidebar'
import { getHybridNavigation } from './navigation'

interface SidebarProps {
  children: React.ReactNode
  userProfile: { name: string; email: string } | null
  role: string | null
  permissions: string[]
  updateCount: number
  splitRequestCount?: number
  org?: { name?: string; logo_url?: string } | null
}

// Role staf yang mendapat menu pre-filtered (bukan menu master admin)
const HYBRID_STAFF_ROLES = [
  'staff_cs',
  'staff_ops',
  'staff_executor',
  'staff_digital',
  'staff_design',
  'staff_warehouse',
  'staff_production',
  'staff_shipping',
]

export default function SidebarHybrid(props: SidebarProps) {
  const isStaffRole = HYBRID_STAFF_ROLES.includes(props.role || '')
  return (
    <BaseSidebar
      {...props}
      navigation={getHybridNavigation(props.role)}
      isPreFiltered={isStaffRole}
    >
      {props.children}
    </BaseSidebar>
  )
}
