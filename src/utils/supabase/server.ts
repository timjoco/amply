// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  // NOTE: cookies() is synchronous
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // must be defined
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // must be defined
    {
      cookies: {
        async get(name) {
          return (await cookieStore).get(name)?.value;
        },
        // In a pure Server Component we can no-op setters.
        // For Route Handlers/Server Actions, use the Response cookie adapter per Supabase docs.
        set() {},
        remove() {},
      },
    }
  );
}
