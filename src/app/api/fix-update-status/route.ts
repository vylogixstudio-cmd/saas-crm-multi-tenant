import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Temporary fix route: updates status of 'completed' projects
// that have pending revisions to 'update_pengajuan'
// DELETE THIS FILE after running once!
export async function GET() {
  const supabase = createAdminClient()

  // Find all pending revisions
  const { data: pendingRevisions, error: revErr } = await supabase
    .from('project_revisions')
    .select('project_id')
    .eq('status', 'Pending')

  if (revErr) return NextResponse.json({ error: revErr.message }, { status: 500 })

  const projectIds = [...new Set((pendingRevisions || []).map((r: any) => r.project_id))]

  if (projectIds.length === 0) {
    return NextResponse.json({ message: 'No pending revisions found', updated: 0 })
  }

  // Get projects that are still 'completed' but have pending revisions
  const { data: stuckProjects, error: projErr } = await supabase
    .from('projects')
    .select('id, title, status')
    .in('id', projectIds)
    .eq('status', 'completed')

  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 })

  if (!stuckProjects || stuckProjects.length === 0) {
    return NextResponse.json({ message: 'No stuck projects found', projectIds, updated: 0 })
  }

  // Update them to update_pengajuan
  const stuckIds = stuckProjects.map((p: any) => p.id)
  const { error: updateErr } = await supabase
    .from('projects')
    .update({ status: 'update_pengajuan', updated_at: new Date().toISOString() })
    .in('id', stuckIds)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({
    message: 'Fixed successfully',
    updated: stuckProjects.length,
    projects: stuckProjects.map((p: any) => ({ id: p.id, title: p.title, oldStatus: p.status }))
  })
}
