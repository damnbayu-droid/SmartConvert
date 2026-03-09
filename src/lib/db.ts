import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined;
};

// Create a globally cached Supabase REST client instead of Prisma for strict Edge compatibility
export const db = (
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
) as any;

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = db;