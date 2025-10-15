import BandEventsList from '@/components/Bands/BandEventsList';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';

export default async function BandEventsIndex({
  params,
}: {
  params: { id: string };
}) {
  const { id: bandId } = params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Ensure user has access to this band (RLS will also enforce on list)
  const { data: band } = await supabase
    .from('bands')
    .select('id, name')
    .eq('id', bandId)
    .maybeSingle();

  if (!band) notFound();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px' }}>
      <BandEventsList bandId={bandId} />
    </div>
  );
}
