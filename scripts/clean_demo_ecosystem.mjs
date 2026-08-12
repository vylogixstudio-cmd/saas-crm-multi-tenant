import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

let env = {}
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].replace(/^["']|["']$/g, '').trim()
    }
  })
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const SUPER_ADMIN_EMAIL = 'vylogixstudio@gmail.com'

async function runClean() {
  console.log('════════════════════════════════════════════════════════════════════')
  console.log('🧹 PEMBERSIHAN DATA DEMO & AKUN DUMMY (KECUALI SUPER ADMIN)')
  console.log(`👑 Super Admin Terproteksi: ${SUPER_ADMIN_EMAIL}`)
  console.log('════════════════════════════════════════════════════════════════════\n')

  // 1. Bersihkan tabel-tabel transaksi & operasional
  console.log('🗑️  [1/3] Menghapus data transaksi, proyek, invoice, dan gudang...')
  
  const tables = [
    'fin_transactions',
    'fin_invoice_items',
    'fin_invoices',
    'internal_notes',
    'project_assets',
    'project_revisions',
    'project_digital_details',
    'project_physical_details',
    'projects',
    'inventory_transactions',
    'inventory_items',
    'maintenance_tickets',
    'agency_sheet_configs',
    'agency_services',
    'audit_logs',
  ]

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) {
        console.warn(`  ⚠️  Tabel ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ Tabel ${table} dikosongkan.`)
      }
    } catch (e) {
      console.warn(`  ⚠️  Lewati tabel ${table} (${e.message})`)
    }
  }

  // 2. Hapus User Auth Dummy dari auth.users (KECUALI super admin)
  console.log('\n👥 [2/3] Menghapus akun staf & klien dari auth.users...')
  const { data: userData, error: userListErr } = await supabaseAdmin.auth.admin.listUsers()

  if (userListErr) {
    console.error('❌ Gagal mengambil daftar auth user:', userListErr.message)
  } else {
    const usersToDelete = userData.users.filter(
      u => u.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()
    )

    console.log(`  🔍 Ditemukan ${usersToDelete.length} akun dummy untuk dihapus...`)

    for (const u of usersToDelete) {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(u.id)
      if (delErr) {
        console.warn(`  ⚠️  Gagal hapus ${u.email}: ${delErr.message}`)
      } else {
        console.log(`  🗑️  Akun auth dihapus: ${u.email}`)
      }
    }
  }

  // 3. Hapus Organisasi Dummy
  console.log('\n🏢 [3/3] Menghapus organisasi dummy...')
  const { error: orgErr } = await supabaseAdmin.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (orgErr) {
    console.warn(`  ⚠️  Hapus organisasi: ${orgErr.message}`)
  } else {
    console.log(`  ✅ Semua data organisasi dummy berhasil dihapus.`)
  }

  console.log('\n════════════════════════════════════════════════════════════════════')
  console.log('✨ PEMBERSIHAN SELESAI!')
  console.log(`👑 Akun ${SUPER_ADMIN_EMAIL} tetap AMAN dan aktif sebagai Super Admin.`)
  console.log('════════════════════════════════════════════════════════════════════\n')
}

runClean().catch(err => {
  console.error('❌ Terjadi kesalahan saat pembersihan:', err)
  process.exit(1)
})
