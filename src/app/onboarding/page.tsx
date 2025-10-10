import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export default async function Page({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next || '/dashboard';
  const sb = await supabaseServer();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent('/onboarding')}`);

  const { data: profile } = await sb
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle();

  // If already onboarded, go to next
  if (profile?.onboarded === true) {
    redirect(next);
  }

  return <OnboardingClient next={next} />;
}
