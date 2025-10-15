'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import SendIcon from '@mui/icons-material/Send';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  created_by: string;
};

type Msg = {
  id: number;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export default function EventClient({
  eventId,
  initialEvent,
}: {
  eventId: string;
  bandId: string; // equals params.id
  initialEvent: EventRow;
}) {
  const sb = supabaseBrowser();
  const [event] = useState(initialEvent);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await sb
        .from('event_messages')
        .select('id,event_id,user_id,body,created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(500);

      if (!alive) return;
      if (error) {
        console.error('[messages:load] error', error);
        setMessages([]); // show empty, but we logged why
      } else {
        console.log('[messages:load] rows', data?.length ?? 0);
        setMessages((data ?? []) as Msg[]);
      }
      setLoading(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'auto' }),
        0
      );
    })();
    return () => {
      alive = false;
    };
  }, [sb, eventId]);

  // realtime inserts
  useEffect(() => {
    const chan = sb
      .channel(`event:${eventId}`, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row = payload.new as Msg;
          setMessages((prev) => [...prev, row]);
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }
      )
      .subscribe((status) => {
        console.log('[realtime] event channel status:', status);
      });

    return () => {
      sb.removeChannel(chan);
    };
  }, [sb, eventId]);

  const send = useCallback(async () => {
    const body = input.trim();
    if (!body) return;
    setInput('');
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const { error } = await sb
      .from('event_messages')
      .insert({ event_id: eventId, user_id: user.id, body });

    if (error) {
      console.error('[messages:send] error', error);
      setInput(body);
    } else {
    }
  }, [input, eventId, sb]);

  return (
    // Page background stays full-bleed dark
    <Box sx={{ minHeight: '100dvh', bgcolor: '#0B0A10', color: 'white' }}>
      {/* Centered column matching BandSheet tab width */}
      <Box
        sx={{
          maxWidth: 900, // <- match your BandSheet tab width here
          mx: 'auto',
          px: { xs: 2, md: 3 },
          py: { xs: 1, md: 2 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
        }}
      >
        {/* Header */}
        <Box sx={{ pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" fontWeight={800}>
            {event.title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            {event.type} · {new Date(event.starts_at).toLocaleString()}
            {event.location ? ` · ${event.location}` : ''}
          </Typography>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ py: 4, opacity: 0.7 }}
            >
              <CircularProgress size={22} />
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              {messages.map((m) => (
                <Stack
                  key={m.id}
                  direction="row"
                  gap={1.25}
                  alignItems="flex-start"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {m.user_id.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {new Date(m.created_at).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {m.body}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
              <div ref={bottomRef} />
            </Stack>
          )}
        </Box>

        {/* Composer */}
        <Box
          sx={{
            pt: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Message the band…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
          />
          <IconButton color="primary" onClick={send} aria-label="Send">
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
