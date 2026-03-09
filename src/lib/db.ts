import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _db: SupabaseClient | null = null;

/**
 * Lazy-initialized Supabase client.
 * Avoids crashing at module evaluation during Cloudflare build
 * when env vars are not yet available.
 */
function getDb(): SupabaseClient {
  if (_db) return _db;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  _db = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return _db;
}

// Proxy so existing `db.from(...)` calls keep working unchanged
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});