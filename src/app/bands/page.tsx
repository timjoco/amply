import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import BandGridClient from './BandGridClient';

export const revalidate = 0;

export default async function BandsPage() {
  const cookieStore = cookies(); // ← no await
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => (await cookieStore).get(name)?.value,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div>Sign in to view your bands.</div>;

  return <BandGridClient />;
}
