import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Checking settings...');
  const { data: settings, error } = await supabase.from('settings').select('*');
  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }
  console.log('Current settings:', settings);

  const requiredSettings = [
    { key: 'RESPONSE_MODE', value: 'chat' },
    { key: 'WEBHOOK_URL', value: '' },
    { key: 'AI_CRM_ENABLED', value: 'true' }
  ];

  for (const s of requiredSettings) {
    const exists = settings.find(set => set.key === s.key);
    if (!exists) {
      console.log(`Adding missing setting: ${s.key}=${s.value}`);
      await supabase.from('settings').insert(s);
    }
  }

  console.log('Done.');
}

run();
