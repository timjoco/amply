// lib/createEvent.ts
'use client';
import { supabaseBrowser } from '@/lib/supabaseClient';

export type EventType = 'show' | 'practice';

export async function createEvent(input: {
  bandId: string;
  title: string;
  type: EventType;
  startsAt: Date;
  endsAt?: Date | null;
  location?: string | null;
  notes?: string | null;
}) {
  const sb = supabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await sb
    .from('events')
    .insert({
      band_id: input.bandId,
      title: input.title.trim(),
      type: input.type, // ← your event_type enum
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt ? input.endsAt.toISOString() : null,
      location: input.location ?? null,
      notes: input.notes ?? null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data!.id as string;
}
