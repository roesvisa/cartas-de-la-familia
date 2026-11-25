import { createClient } from '@supabase/supabase-js';
// Publishable key: safe for browsers; authorization is enforced in Postgres.
export const supabase = createClient(
  'https://bkkyustjpclrssqrkrck.supabase.co',
  'sb_publishable_n8jtRAG_J69le4Fx2ktwCw_hmU-7CRY',
);
