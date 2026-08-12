import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envPath = 'C:\\Users\\DELL\\Documents\\Perkuliahan\\VScode\\Vylogix_Saas _demo_project\\.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')

let supabaseUrl = ''
let supabaseKey = ''

envContent.split('\n').forEach(line => {
  const matchUrl = line.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)/)
  if (matchUrl) supabaseUrl = matchUrl[1].trim().replace(/['"]/g, '')
  
  const matchKey = line.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)/)
  if (matchKey) supabaseKey = matchKey[1].trim().replace(/['"]/g, '')
})

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixDpPaid() {
  console.log("🔍 Memperbaiki nilai dp_paid pada proyek...")
  
  const { data: projects } = await supabase.from('projects').select('*')
  
  if (projects) {
    for (const proj of projects) {
        // Kalkulasi dp_paid dari termin
        const dp = Number(proj.termin_1 || 0) + Number(proj.termin_2 || 0) + Number(proj.termin_3 || 0)
        
        await supabase.from('projects').update({ dp_paid: dp }).eq('id', proj.id)
        console.log(`✅ Update Proyek "${proj.title.substring(0, 20)}..." -> Pemasukan: Rp ${dp.toLocaleString('id-ID')}`)
    }
  }
  console.log("🎉 Selesai! Silakan refresh dashboard Anda.")
}

fixDpPaid()
