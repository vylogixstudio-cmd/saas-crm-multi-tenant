import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const res1 = await supabase.from('organizations').select('name, logo_url, whatsapp_number, custom_asset_categories, industry_type').limit(1);
  console.log('Query with custom_asset_categories:');
  console.log('Error:', res1.error);
  console.log('Data:', res1.data);

  const res2 = await supabase.from('organizations').select('name, logo_url, whatsapp_number, industry_type').limit(1);
  console.log('\nQuery without custom_asset_categories:');
  console.log('Error:', res2.error);
  console.log('Data:', res2.data);
}
test();
