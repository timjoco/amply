/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string;
  location: string | null;
  // NEW:
  is_booked?: boolean; // computed in view
  cnt_members?: number; // optional debug/UX
  cnt_accepted?: number; // optional debug/UX
};

function AttendanceBar({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [mine, setMine] = useState<
    'pending' | 'accepted' | 'declined' | 'tentative'
  >('pending');
  const [counts, setCounts] = useState<{ accepted: number; total: number }>({
    accepted: 0,
    total: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    // current user’s row
    const { data: meRow } = await sb
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .limit(1);
    if (meRow?.[0]?.status) setMine(meRow[0].status as typeof mine);

    // counts
    const { data: agg } = await sb
      .rpc('event_attendance_counts', { p_event_id: eventId }) // OPTIONAL RPC (see below)
      .match(() => null as any);

    if (
      agg &&
      typeof agg.accepted === 'number' &&
      typeof agg.total === 'number'
    ) {
      setCounts({ accepted: agg.accepted, total: agg.total });
    } else {
      // fallback if you didn’t add the helper RPC
      const { data: all } = await sb
        .from('event_attendance')
        .select('status')
        .eq('event_id', eventId);
      const total = all?.length ?? 0;
      const accepted = (all ?? []).filter(
        (r) => r.status === 'accepted'
      ).length;
      setCounts({ accepted, total });
    }

    // tell parent (EventSheet) it might want to refetch header data if you prefer;
    // or keep header status purely from initialEvent. (Optional)
  }, [sb, eventId]);

  useEffect(() => {
    load();
    const ch = sb
      .channel(`event:${eventId}:attendance`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, eventId, load]);

  const update = async (next: typeof mine) => {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;

      await sb.from('event_attendance').upsert({
        event_id: eventId,
        user_id: user.id,
        status: next,
        responded_at: new Date().toISOString(),
      });
      setMine(next);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        mb: 1.5,
      }}
    >
      <Typography variant="body2" sx={{ opacity: 0.85 }}>
        Attendance: {counts.accepted}/{counts.total} accepted
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Button
        size="small"
        variant={mine === 'accepted' ? 'contained' : 'outlined'}
        onClick={() => update('accepted')}
        disabled={saving}
      >
        Accept
      </Button>
      <Button
        size="small"
        variant={mine === 'tentative' ? 'contained' : 'outlined'}
        onClick={() => update('tentative')}
        disabled={saving}
      >
        Tentative
      </Button>
      <Button
        size="small"
        variant={mine === 'declined' ? 'contained' : 'outlined'}
        onClick={() => update('declined')}
        disabled={saving}
      >
        Decline
      </Button>
    </Stack>
  );
}

export default function EventSheet({
  eventId,
  // bandId,
  initialEvent,
}: {
  eventId: string;
  bandId: string;
  initialEvent: EventRow;
}) {
  // const sb = useMemo(() => supabaseBrowser(), []);
  const [tab, setTab] = useState<'chat' | 'setlist' | 'notes' | 'files'>(
    'chat'
  );

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#0B0A10', color: 'white' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 } }}>
        {/* Header */}
        <Box sx={{ pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" fontWeight={800}>
            {initialEvent.title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            {initialEvent.type} ·{' '}
            {new Date(initialEvent.starts_at).toLocaleString()}
            {initialEvent.location ? ` · ${initialEvent.location}` : ''}
          </Typography>
          <Box
            sx={{ pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Typography variant="h6" fontWeight={800}>
              {initialEvent.title}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ opacity: 0.9, flexWrap: 'wrap' }}
            >
              <Typography variant="body2" sx={{ opacity: 0.72 }}>
                {initialEvent.type} ·{' '}
                {new Date(initialEvent.starts_at).toLocaleString()}
                {initialEvent.location ? ` · ${initialEvent.location}` : ''}
              </Typography>

              {/* NEW: booking chip */}
              <Chip
                size="small"
                label={initialEvent.is_booked ? 'Booked' : 'Unconfirmed'}
                color={initialEvent.is_booked ? 'success' : 'warning'}
                sx={{ ml: 1 }}
              />
            </Stack>
          </Box>
        </Box>
        <AttendanceBar eventId={eventId} />

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            mt: 1,
            mb: 2,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Tab label="Chat" value="chat" />
          <Tab label="Setlist" value="setlist" />
          <Tab label="Notes" value="notes" />
          <Tab label="Files" value="files" />
        </Tabs>

        {tab === 'chat' && <ChatTab eventId={eventId} />}
        {tab === 'setlist' && <SetlistTab eventId={eventId} />}
        {tab === 'notes' && <NotesTab eventId={eventId} />}
        {tab === 'files' && <FilesTab eventId={eventId} />}
      </Box>
    </Box>
  );
}

/* ---------- Chat (re-using your minimal EventClient logic) ---------- */
function ChatTab({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await sb
        .from('event_messages')
        .select('id,event_id,user_id,body,created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (!alive) return;
      setMessages(data ?? []);
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

  useEffect(() => {
    const ch = sb
      .channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
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
    if (error) setInput(body);
  }, [input, eventId, sb]);

  return (
    <Stack sx={{ minHeight: '60vh' }}>
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
              <Stack key={m.id} direction="row" gap={1.25}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {String(m.user_id).slice(0, 2).toUpperCase()}
                </Box>
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
    </Stack>
  );
}

/* ---------- Setlist (MVP) ---------- */
function SetlistTab({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await sb
        .from('event_setlist_items')
        .select('id, title, position, notes, created_at')
        .eq('event_id', eventId)
        .order('position', { ascending: true });
      if (!alive) return;
      setItems(data ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [sb, eventId]);

  useEffect(() => {
    const ch = sb
      .channel(`setlist:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_setlist_items',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // refresh on any change
          sb.from('event_setlist_items')
            .select('id, title, position, notes, created_at')
            .eq('event_id', eventId)
            .order('position', { ascending: true })
            .then(({ data }) => setItems(data ?? []));
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, eventId]);

  const addItem = useCallback(async () => {
    const t = title.trim();
    if (!t) return;
    setTitle('');
    await sb.from('event_setlist_items').insert({
      event_id: eventId,
      title: t,
      position: (items.at(-1)?.position ?? 0) + 10,
    });
  }, [sb, eventId, title, items]);

  const move = useCallback(
    async (id: string, dir: -1 | 1) => {
      const idx = items.findIndex((i) => i.id === id);
      const swapIdx = idx + dir;
      if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
      const a = items[idx],
        b = items[swapIdx];
      // simple swap of positions
      await sb
        .from('event_setlist_items')
        .update({ position: b.position })
        .eq('id', a.id);
      await sb
        .from('event_setlist_items')
        .update({ position: a.position })
        .eq('id', b.id);
    },
    [items, sb]
  );

  const remove = useCallback(
    async (id: string) => {
      await sb.from('event_setlist_items').delete().eq('id', id);
    },
    [sb]
  );

  return (
    <Stack gap={1.25} sx={{ mt: 1 }}>
      <Stack direction="row" gap={1}>
        <TextField
          fullWidth
          size="small"
          label="Add song"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem();
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
        />
        <Button variant="contained" onClick={addItem} startIcon={<AddIcon />}>
          Add
        </Button>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading setlist…</Typography>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">
          No setlist yet. Add your first song.
        </Typography>
      ) : (
        <Stack gap={1.25}>
          {items.map((it, i) => (
            <Paper
              key={it.id}
              variant="outlined"
              sx={(t) => ({
                p: 1,
                borderRadius: 2,
                borderColor: alpha(t.palette.primary.main, 0.14),
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              })}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography
                  sx={{ fontWeight: 800, flex: 1, minWidth: 0 }}
                  noWrap
                >
                  {i + 1}. {it.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => move(it.id, -1)}
                  disabled={i === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => move(it.id, +1)}
                  disabled={i === items.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove(it.id)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              {it.notes && (
                <>
                  <Divider sx={{ my: 0.75, opacity: 0.08 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {it.notes}
                  </Typography>
                </>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

/* ---------- Notes (autosave) ---------- */
function NotesTab({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await sb
        .from('event_notes')
        .select('body')
        .eq('event_id', eventId)
        .maybeSingle();
      if (!alive) return;
      setBody(data?.body ?? '');
    })();
    return () => {
      alive = false;
    };
  }, [sb, eventId]);

  const save = useCallback(
    async (next: string) => {
      setSaving('saving');
      await sb.from('event_notes').upsert({ event_id: eventId, body: next });
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 800);
    },
    [sb, eventId]
  );

  const onChange = (v: string) => {
    setBody(v);
    setSaving('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(v), 600);
  };

  return (
    <Stack gap={1.25} sx={{ mt: 1 }}>
      <TextField
        multiline
        minRows={6}
        fullWidth
        placeholder="Shared notes for this event…"
        value={body}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
      />
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ' '}
      </Typography>
    </Stack>
  );
}

/* ---------- Files (private storage: event-files bucket) ---------- */
function FilesTab({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [paths, setPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const list = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.storage
      .from('event-files')
      .list(eventId, { limit: 100, offset: 0 });
    if (!error) setPaths((data ?? []).map((o) => `${eventId}/${o.name}`));
    setLoading(false);
  }, [sb, eventId]);

  useEffect(() => {
    list();
  }, [list]);

  const onUpload = async (file: File) => {
    const path = `${eventId}/${crypto.randomUUID()}.${
      file.name.split('.').pop() ?? 'dat'
    }`;
    const { error } = await sb.storage
      .from('event-files')
      .upload(path, file, { upsert: true });
    if (!error) list();
  };

  const downloadUrl = async (path: string) => {
    const { data, error } = await sb.storage
      .from('event-files')
      .createSignedUrl(path, 60 * 60);
    if (!error && data?.signedUrl)
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Stack gap={1.25} sx={{ mt: 1 }}>
      <Button
        variant="outlined"
        component="label"
        sx={{ alignSelf: 'flex-start' }}
      >
        Upload file
        <input
          hidden
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            (e.currentTarget as HTMLInputElement).value = '';
          }}
        />
      </Button>

      {loading ? (
        <Typography color="text.secondary">Loading files…</Typography>
      ) : paths.length === 0 ? (
        <Typography color="text.secondary">No files yet.</Typography>
      ) : (
        <Stack gap={1}>
          {paths.map((p) => (
            <Paper
              key={p}
              variant="outlined"
              sx={(t) => ({
                p: 1,
                borderRadius: 2,
                borderColor: alpha(t.palette.primary.main, 0.14),
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              })}
            >
              <Typography sx={{ wordBreak: 'break-all' }}>
                {p.split('/').slice(1).join('/')}
              </Typography>
              <Button size="small" onClick={() => downloadUrl(p)}>
                Open
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
