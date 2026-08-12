'use client'

import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { updateProjectStatus } from './actions'
import Link from 'next/link'

interface ProjectData {
  id: string
  title: string
  status: string
  profiles: { full_name: string; email: string } | null
}

export default function RevisionNotificationWidget({ projects }: { projects: ProjectData[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pendingRevisions = projects.filter(p => p.status === 'revision_pending')

  if (pendingRevisions.length === 0) return null

  const handleApprove = async (projectId: string, progress: number) => {
    setLoadingId(projectId)
    await updateProjectStatus(projectId, 'revision', progress)
    setLoadingId(null)
  }

  return (
    <div className="mb-8 space-y-3">
      {pendingRevisions.map(proj => (
        <div key={proj.id} className="bg-amber-50 border border-amber-200 p-4 rounded-[16px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">Permintaan Revisi Baru</h4>
              <p className="text-xs text-amber-700 mt-1">
                Klien <span className="font-bold">{proj.profiles?.full_name}</span> meminta revisi pada proyek <Link href={`/dashboard/project/${proj.id}`} className="font-bold underline">{proj.title}</Link>.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleApprove(proj.id, 90)}
            disabled={loadingId === proj.id}
            className="shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-[10px] text-xs font-bold transition-all disabled:opacity-50"
          >
            {loadingId === proj.id ? 'Menyetujui...' : (
              <>
                <CheckCircle size={14} /> Setujui Revisi
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
