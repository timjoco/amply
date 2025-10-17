import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EventSheet from './EventSheet';

type Params = { id: string; eventId: string };

export default async function EventPage(
  { params }: { params: Promise<Params> } // 👈 note Promise<...>
) {
  const { id: bandId, eventId } = await params; // 👈 await before use

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: event, error } = await supabase
    .from('events')
    .select(
      `id, band_id, title, type, starts_at, location, band:bands ( id, name )`
    )
    .eq('id', eventId)
    .maybeSingle();

  if (error || !event) notFound();
  if (event.band_id !== bandId) notFound();

  return (
    <EventSheet
      eventId={event.id}
      bandId={bandId}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialEvent={event as any}
    />
  );
}
