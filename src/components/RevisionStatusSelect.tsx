'use client'

import { useTransition } from 'react'
import { updateRevisionStatus } from '@/app/(workspace)/dashboard/actions'

interface RevisionStatusSelectProps {
  revisionId: string
  currentStatus: string
  isReadOnly?: boolean
}

export default function RevisionStatusSelect({ revisionId, currentStatus, isReadOnly = false }: RevisionStatusSelectProps) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    startTransition(() => {
      updateRevisionStatus(revisionId, newStatus)
    })
  }

  if (isReadOnly) {
    return (
      <span className="px-3 py-1.5 bg-[#F8F9FA] border border-black/10 rounded-lg text-xs font-bold text-[#111827]">
        {currentStatus}
      </span>
    )
  }

  return (
    <select 
      value={currentStatus} 
      onChange={handleChange}
      disabled={isPending}
      className="px-3 py-1.5 bg-[#F8F9FA] border border-black/10 rounded-lg text-xs font-bold focus:border-[#2563EB] outline-none text-[#111827] cursor-pointer transition-all disabled:opacity-50"
    >
      <option value="Pending">Pending</option>
      <option value="On Progress">On Progress</option>
      <option value="Completed">Completed</option>
    </select>
  )
}
