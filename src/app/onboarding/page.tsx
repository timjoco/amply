// src/app/onboarding/page.tsx
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

type SP = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>; // 👈 make it async
}) {
  const sp = await searchParams; // 👈 await before using
  const next =
    (typeof sp?.next === 'string'
      ? sp.next
      : Array.isArray(sp?.next)
      ? sp.next[0]
      : undefined) || '/dashboard';

  const sb = await supabaseServer();

  const {
    data: { user },
  } = await sb.auth.getUser();

  // If not logged in, send to login and preserve intended destination
  if (!user) redirect(`/login?next=${encodeURIComponent('/onboarding')}`);

  const { data: profile } = await sb
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle();

  // If already onboarded, go to the intended page
  if (profile?.onboarded === true) {
    redirect(next);
  }

  return <OnboardingClient next={next} />;
}
