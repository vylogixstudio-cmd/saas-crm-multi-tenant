import { NextResponse } from 'next/server'
import { getSystemSettings } from '@/lib/superAdminStore'

export async function GET() {
  try {
    const settings = getSystemSettings()
    return NextResponse.json({
      success: true,
      maintenance_mode: settings.maintenance_mode,
      maintenance_target: settings.maintenance_target || 'ALL',
      maintenance_message: settings.maintenance_message,
      platform_name: settings.platform_name,
      support_whatsapp: settings.support_whatsapp,
      support_email: settings.support_email
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
