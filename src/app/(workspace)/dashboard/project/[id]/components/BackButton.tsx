'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ userRole, isReadOnly }: { userRole?: string; isReadOnly?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source')

  const getDefaultBackUrl = () => {
    if (source === 'completed' || isReadOnly) {
      return '/dashboard/projects/completed'
    }
    switch (userRole) {
      case 'staff_shipping':
        return '/dashboard/shipping/history'
      case 'staff_design':
      case 'staff_physical':
        return '/dashboard/projects/completed'
      case 'staff_production':
        return '/dashboard/production'
      case 'staff_warehouse':
        return '/dashboard/warehouse/orders'
      case 'staff_cs':
        return '/dashboard/cs/orders'
      default:
        return '/dashboard/projects'
    }
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back()
    } else {
      router.push(getDefaultBackUrl())
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] bg-white px-4 py-2 rounded-[12px] shadow-sm border border-black/5 transition-all hover:bg-gray-50 cursor-pointer"
    >
      <ArrowLeft size={16} /> Kembali
    </button>
  )
}
