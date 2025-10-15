import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EventSheet from './EventSheet';

export default async function EventPage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  const { id: bandId, eventId } = params;
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
