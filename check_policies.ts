import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'mensagens' });
  // If get_policies doesn't exist, we can try to query pg_policies
  if (error) {
    const { data: policies, error: polError } = await supabase.from('pg_policies').select('*').eq('tablename', 'mensagens');
    if (polError) {
        console.log('Could not fetch policies via RPC or pg_policies. Trying direct query to pg_catalog...');
        const { data: direct, error: directError } = await supabase.from('pg_catalog.pg_policies').select('*').eq('tablename', 'mensagens');
        console.log('Direct:', direct, directError);
    } else {
        console.log('Policies:', policies);
    }
  } else {
    console.log('Policies:', data);
  }
}

run();
