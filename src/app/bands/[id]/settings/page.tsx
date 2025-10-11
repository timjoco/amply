// app/bands/[id]/settings/page.tsx
import { createClient } from '@/utils/supabase/server'; // your server helper
import { notFound, redirect } from 'next/navigation';

export default async function BandSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();
  if (!user) redirect('/login');

  // Basic fetch + admin check (server-side)
  const { data: band } = await (await supabase)
    .from('bands')
    .select('id, name')
    .eq('id', params.id)
    .single();
  if (!band) notFound();

  const { data: isAdmin } = await (
    await supabase
  ).rpc('is_band_admin', { p_band_id: params.id });
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Band Settings</h1>
      <DangerZone bandId={params.id} bandName={band.name} isAdmin={!!isAdmin} />
    </div>
  );
}

// Client island for actions
import DangerZone from './DangerZone';
