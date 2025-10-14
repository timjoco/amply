// app/bands/[id]/settings/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import SettingsDialog from './SettingsDialog';

export default async function BandSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();
  const { id } = await params;

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Band (exists?)
  const { data: band } = await supabase
    .from('bands')
    .select('id, name, avatar_url')
    .eq('id', id)
    .maybeSingle();
  if (!band) notFound();

  // Membership (must be a member to access settings at all)
  const { data: mem } = await supabase
    .from('band_members')
    .select('role')
    .eq('band_id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!mem) redirect(`/bands/${id}`); // not a member → bounce back

  const isAdmin = mem.role === 'admin';

  return (
    <SettingsDialog
      bandId={band.id}
      bandName={band.name}
      avatarPath={band.avatar_url ?? undefined}
      isAdmin={isAdmin}
    />
  );
}
