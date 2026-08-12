'use client'

import React from 'react'
import BaseSidebar from './BaseSidebar'
import { getPhysicalNavigation } from './navigation'

interface SidebarProps {
  children: React.ReactNode
  userProfile: { name: string; email: string } | null
  role: string | null
  permissions: string[]
  updateCount: number
  splitRequestCount?: number
  org?: { name?: string; logo_url?: string } | null
}

export default function SidebarPhysical(props: SidebarProps) {
  const isStaffRole = ['staff_cs', 'staff_ops', 'staff_design', 'staff_warehouse', 'staff_production', 'staff_shipping'].includes(props.role || '');
  return (
    <BaseSidebar {...props} navigation={getPhysicalNavigation(props.role)} isPreFiltered={isStaffRole}>
      {props.children}
    </BaseSidebar>
  )
}
