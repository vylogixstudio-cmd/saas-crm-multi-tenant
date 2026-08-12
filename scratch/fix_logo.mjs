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

async function fixLogo() {
  console.log("🔍 Mencari file logo di Supabase Storage...")
  
  const { data: files, error: listError } = await supabase.storage.from('assets').list('logos', {
    limit: 10,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  })
  
  if (listError || !files || files.length === 0) {
    console.error("❌ Gagal mencari file logo atau folder kosong.", listError)
    return
  }
  
  // Ambil file pertama yang ada (asumsi itu logo lama mereka)
  // Filter out folder placeholders (like .emptyFolderPlaceholder)
  const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder')
  
  if (validFiles.length === 0) {
     console.error("❌ Tidak ada file logo yang valid.")
     return
  }

  const logoFilename = validFiles[0].name
  console.log("✅ Menemukan file logo:", logoFilename)
  
  const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(`logos/${logoFilename}`)
  const logoUrl = publicUrlData.publicUrl
  
  console.log("✅ URL Publik Logo:", logoUrl)

  // Update organisasi
  const { data: org } = await supabase.from('organizations').select('id').eq('slug', 'vylogix-demo').single()
  if (org) {
      await supabase.from('organizations').update({ logo_url: logoUrl }).eq('id', org.id)
      console.log("🎉 Logo berhasil dipasang ke database!")
  } else {
      console.log("❌ Organisasi tidak ditemukan.")
  }
}

fixLogo()
