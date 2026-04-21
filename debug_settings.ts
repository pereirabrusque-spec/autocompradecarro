
import { supabase } from './src/lib/supabase';

async function debugSettings() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }
  console.log('--- SETTINGS DUMP ---');
  console.log(JSON.stringify(data, null, 2));
  console.log('---------------------');
}

debugSettings();
