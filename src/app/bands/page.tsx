import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import BandGridClient from './BandGridClient';

export const revalidate = 0;

type MembershipRow = {
  band_id: string;
  role: 'admin' | 'member';
  band: { id: string; name: string | null } | null;
};

type BandCardItem = {
  id: string;
  name: string;
  role: 'admin' | 'member';
};

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

  const { data: membershipsData, error: mErr } = await supabase
    .from('band_members')
    .select(
      `
      band_id,
      role,
      band:bands ( id, name )
    `
    )
    .eq('user_id', user.id)
    .returns<MembershipRow[]>();
  if (mErr) {
    console.error(mErr);
    return <div>Failed to load bands.</div>;
  }

  const memberships = membershipsData ?? [];

  // Filter out null bands to avoid non-null assertions
  const bands: BandCardItem[] = memberships
    .filter(
      (m): m is MembershipRow & { band: { id: string; name: string | null } } =>
        !!m.band
    )
    .map((m) => ({
      id: m.band.id,
      name: m.band.name ?? 'Untitled Band',
      role: m.role,
    }));

  if (bands.length === 0) {
    return <div>No bands yet — create or join one!</div>;
  }

  return <BandGridClient />;
}
