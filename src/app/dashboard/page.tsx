import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const sb = await supabaseServer();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    redirect('/login?next=/dashboard');
  }

  const { data: profile, error } = await sb
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle();

  // If no profile yet or not onboarded, send to onboarding
  if (error || !profile || profile.onboarded !== true) {
    redirect(`/onboarding?next=${encodeURIComponent('/dashboard')}`);
  }

  return <DashboardClient />;
}
