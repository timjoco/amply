/* eslint-disable @typescript-eslint/no-explicit-any */
// components/BandEventsList.tsx
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string; // ISO
  ends_at: string | null;
  location: string | null;
};

export default function BandEventsList({
  bandId,
}: {
  bandId: string;
  showCreate?: boolean;
}) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // initial fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await sb
        .from('events')
        .select('id, band_id, title, type, starts_at, ends_at, location')
        .eq('band_id', bandId)
        .order('starts_at', { ascending: true });

      if (!alive) return;
      if (!error) setRows((data ?? []) as EventRow[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [sb, bandId]);

  // realtime (insert/update/delete)
  useEffect(() => {
    const ch = sb
      .channel(`events:${bandId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (p) =>
          setRows((prev) =>
            [...prev, p.new as EventRow].sort((a, b) =>
              a.starts_at.localeCompare(b.starts_at)
            )
          )
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (p) =>
          setRows((prev) =>
            prev
              .map((r) =>
                r.id === (p.new as any).id ? (p.new as EventRow) : r
              )
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
          )
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (p) => setRows((prev) => prev.filter((r) => r.id !== (p.old as any).id))
      )
      .subscribe();

    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, bandId]);

  return (
    <Stack gap={1.5}>
      {loading && (
        <Stack direction="row" gap={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography color="text.secondary">Loading…</Typography>
        </Stack>
      )}

      {!loading && rows.length === 0 && (
        <Typography color="text.secondary">
          No events yet. Use “New Event” to add one.
        </Typography>
      )}

      {!loading && rows.length > 0 && (
        <Stack gap={1.25}>
          {rows.map((ev) => (
            <Paper
              key={ev.id}
              variant="outlined"
              onClick={() => router.push(`/bands/${bandId}/events/${ev.id}`)}
              sx={(t) => ({
                cursor: 'pointer',
                p: 1.25,
                borderRadius: 2,
                borderColor: alpha(t.palette.primary.main, 0.14),
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                transition:
                  'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 12px 28px rgba(0,0,0,.28)',
                  borderColor: alpha(t.palette.primary.main, 0.28),
                },
              })}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                sx={{ mb: 0.25 }}
              >
                <Typography
                  sx={{ fontWeight: 800, flex: '1 1 auto', minWidth: 0 }}
                  noWrap
                >
                  {ev.title}
                </Typography>
                <Chip
                  size="small"
                  label={ev.type}
                  variant="outlined"
                  sx={(t) => ({
                    textTransform: 'capitalize',
                    borderColor: alpha(t.palette.primary.main, 0.3),
                  })}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {new Date(ev.starts_at).toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {ev.location ? ` · ${ev.location}` : ''}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
