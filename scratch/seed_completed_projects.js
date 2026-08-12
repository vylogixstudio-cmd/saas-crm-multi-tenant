const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/"/g, '').trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Fetching first organization...');
  const { data: orgs, error: orgErr } = await supabaseAdmin.from('organizations').select('id').limit(1);
  if (orgErr || !orgs.length) return console.error('No org found', orgErr);
  const orgId = orgs[0].id;

  console.log('Fetching first client...');
  const { data: clients, error: cliErr } = await supabaseAdmin.from('profiles').select('id').eq('role', 'client').limit(1);
  if (cliErr || !clients.length) return console.error('No client found', cliErr);
  const clientId = clients[0].id;

  console.log('Creating completed projects...');
  const projects = [
    {
      organization_id: orgId,
      client_id: clientId,
      title: 'Pembuatan Website Company Profile (Toko Kue)',
      service_type: 'PEMBUATAN WEBSITE',
      total_price: 15000000,
      payment_status: 'paid',
      progress_percentage: 100,
      status: 'completed',
      domain_name: 'tokokuemanis.com',
      domain_expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
      hosting_info: 'Server SG-1 (cPanel login sent via email)',
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      organization_id: orgId,
      client_id: clientId,
      title: 'Pembuatan Website E-Commerce Fashion',
      service_type: 'PEMBUATAN WEBSITE',
      total_price: 35000000,
      payment_status: 'paid',
      progress_percentage: 100,
      status: 'completed',
      domain_name: 'gayarusticfashion.id',
      domain_expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now (Red/Warning)
      hosting_info: 'VPS AWS Lightsail',
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { data, error } = await supabaseAdmin.from('projects').insert(projects).select();
  if (error) {
    console.error('Error inserting projects:', error);
  } else {
    console.log('Successfully inserted completed projects:', data.length);
  }
}

seed();
