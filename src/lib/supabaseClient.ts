import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseBrowser = (): SupabaseClient =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true, // auto-reads #access_token from URL
        flowType: 'implicit', // ← switch from 'pkce' to 'implicit'
      },
    }
  );
