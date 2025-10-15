/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  SwipeableDrawer,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

// function AttendanceBar({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [mine, setMine] = useState<
//     'pending' | 'accepted' | 'declined' | 'tentative'
//   >('pending');
//   const [counts, setCounts] = useState<{ accepted: number; total: number }>({
//     accepted: 0,
//     total: 0,
//   });
//   const [saving, setSaving] = useState(false);

//   const load = useCallback(async () => {
//     // current user’s row
//     const { data: meRow } = await sb
//       .from('event_attendance')
//       .select('status')
//       .eq('event_id', eventId)
//       .limit(1);
//     if (meRow?.[0]?.status) setMine(meRow[0].status as typeof mine);

//     // counts
//     const { data: agg } = await sb
//       .rpc('event_attendance_counts', { p_event_id: eventId }) // OPTIONAL RPC (see below)
//       .match(() => null as any);

//     if (
//       agg &&
//       typeof agg.accepted === 'number' &&
//       typeof agg.total === 'number'
//     ) {
//       setCounts({ accepted: agg.accepted, total: agg.total });
//     } else {
//       // fallback if you didn’t add the helper RPC
//       const { data: all } = await sb
//         .from('event_attendance')
//         .select('status')
//         .eq('event_id', eventId);
//       const total = all?.length ?? 0;
//       const accepted = (all ?? []).filter(
//         (r) => r.status === 'accepted'
//       ).length;
//       setCounts({ accepted, total });
//     }
//   }, [sb, eventId]);

//   useEffect(() => {
//     load();
//     const ch = sb
//       .channel(`event:${eventId}:attendance`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'event_attendance',
//           filter: `event_id=eq.${eventId}`,
//         },
//         () => load()
//       )
//       .subscribe();
//     return () => {
//       sb.removeChannel(ch);
//     };
//   }, [sb, eventId, load]);

//   const update = async (next: typeof mine) => {
//     try {
//       setSaving(true);
//       const {
//         data: { user },
//       } = await sb.auth.getUser();
//       if (!user) return;

//       await sb.from('event_attendance').upsert({
//         event_id: eventId,
//         user_id: user.id,
//         status: next,
//         responded_at: new Date().toISOString(),
//       });
//       setMine(next);
//       load();
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Stack
//       direction="row"
//       alignItems="center"
//       spacing={1}
//       sx={{
//         py: 1,
//         borderBottom: '1px solid rgba(255,255,255,0.08)',
//         mb: 1.5,
//       }}
//     >
//       <Typography variant="body2" sx={{ opacity: 0.85 }}>
//         Attendance: {counts.accepted}/{counts.total} accepted
//       </Typography>
//       <Box sx={{ flex: 1 }} />
//       <Button
//         size="small"
//         variant={mine === 'accepted' ? 'contained' : 'outlined'}
//         onClick={() => update('accepted')}
//         disabled={saving}
//       >
//         Accept
//       </Button>
//       <Button
//         size="small"
//         variant={mine === 'tentative' ? 'contained' : 'outlined'}
//         onClick={() => update('tentative')}
//         disabled={saving}
//       >
//         Tentative
//       </Button>
//       <Button
//         size="small"
//         variant={mine === 'declined' ? 'contained' : 'outlined'}
//         onClick={() => update('declined')}
//         disabled={saving}
//       >
//         Decline
//       </Button>
//     </Stack>
//   );
// }

function RosterPanel({ bandId, eventId }: { bandId: string; eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<
    {
      user_id: string;
      name: string;
      avatar_url: string | null;
      status: 'accepted' | 'declined' | 'tentative' | 'pending';
    }[]
  >([]);

  const load = useCallback(async () => {
    // Pull band members and left-join their attendance for this event
    // Adjust table/column names to your schema.
    const { data, error } = await sb
      .from('band_members_view') // <-- see note below if you don't have a view
      .select(
        `
        user_id,
        name,
        avatar_url,
        attendance:event_attendance(status)
      `
      )
      .eq('band_id', bandId)
      .eq('attendance.event_id', eventId); // left join still returns nulls

    if (!error) {
      const mapped =
        (data ?? []).map((r: any) => ({
          user_id: r.user_id,
          name: r.name ?? 'Member',
          avatar_url: r.avatar_url ?? null,
          status: (r.attendance?.[0]?.status ?? 'pending') as
            | 'accepted'
            | 'declined'
            | 'tentative'
            | 'pending',
        })) ?? [];
      setRows(mapped);
    }
  }, [sb, bandId, eventId]);

  useEffect(() => {
    load();
    const ch = sb
      .channel(`event:${eventId}:attendance-roster`)
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

  const chipColor = (s: string) =>
    s === 'accepted'
      ? 'success'
      : s === 'declined'
      ? 'error'
      : s === 'tentative'
      ? 'warning'
      : 'default';

  return (
    <Paper
      variant="outlined"
      sx={(t) => ({
        p: 1,
        borderRadius: 2,
        borderColor: alpha(t.palette.primary.main, 0.14),
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      <Typography
        variant="subtitle2"
        sx={{ px: 1, pt: 1, pb: 0.5, opacity: 0.9 }}
      >
        Roster
      </Typography>
      <List dense disablePadding>
        {rows.map((r) => (
          <ListItem key={r.user_id} sx={{ px: 1 }}>
            <ListItemAvatar>
              <Avatar src={r.avatar_url ?? undefined}>
                {r.name?.slice(0, 1).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography noWrap sx={{ fontWeight: 600 }}>
                  {r.name}
                </Typography>
              }
              secondary={
                <Tooltip
                  title={r.status === 'pending' ? 'No response yet' : r.status}
                  arrow
                >
                  <Chip
                    size="small"
                    label={r.status}
                    color={chipColor(r.status)}
                  />
                </Tooltip>
              }
              secondaryTypographyProps={{ component: 'span' }}
            />
          </ListItem>
        ))}
        {rows.length === 0 && (
          <Typography variant="body2" sx={{ opacity: 0.7, px: 1.5, py: 1 }}>
            No members found.
          </Typography>
        )}
      </List>
    </Paper>
  );
}

export default function EventSheet({
  eventId,
  bandId,
  initialEvent,
}: {
  eventId: string;
  bandId: string;
  bandName?: string;
  initialEvent: EventRow;
}) {
  const [, setBandName] = useState<string>('Band');
  const [, setError] = useState<string | null>(null);
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rosterOpen, setRosterOpen] = useState(false);
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [tab, setTab] = useState<'chat' | 'setlist' | 'notes' | 'files'>(
    'chat'
  );

  const startsAtLabel = useMemo(() => {
    try {
      const d = new Date(initialEvent.starts_at);
      // Force a specific locale + timeZone for identical SSR/CSR output
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Chicago',
        hour12: true,
      }).format(d);
    } catch {
      return initialEvent.starts_at;
    }
  }, [initialEvent.starts_at]);

  useEffect(() => {
    (async () => {
      const { data: band, error: bandErr } = await sb
        .from('bands')
        .select('id,name')
        .eq('id', bandId)
        .maybeSingle();

      if (bandErr) {
        setError(bandErr.message);
        return;
      }
      if (!band) {
        setError('Band not found or you do not have access.');
        return;
      }
      setBandName(band.name);
    })();
  }, [bandId, sb]);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#0B0A10', color: 'white' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 } }}>
        {/* Header */}
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            mb: 1.5,
          }}
        >
          {/* TOP ROW Event title + status chip */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ mt: 0.5, flexWrap: 'wrap' }}
          >
            <Typography
              variant="h5"
              fontWeight={800}
              noWrap
              title={initialEvent.title}
            >
              {initialEvent.title}
            </Typography>

            {typeof initialEvent.is_booked === 'boolean' && (
              <Chip
                size="small"
                label={initialEvent.is_booked ? 'Booked' : 'Unconfirmed'}
                color={initialEvent.is_booked ? 'success' : 'warning'}
              />
            )}
          </Stack>

          {/* Subtitle: type • starts at • location */}
          <Typography
            variant="body2"
            sx={{ opacity: 0.72, mt: 0.25 }}
            suppressHydrationWarning
          >
            {initialEvent.type} · {startsAtLabel}
            {initialEvent.location ? ` · ${initialEvent.location}` : ''}
          </Typography>
        </Box>
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'flex-end',
            mb: 1,
          }}
        ></Box>

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

        {tab === 'chat' &&
          (mdUp ? (
            // --- DESKTOP/TABLET (md+): chat left, roster right ---
            <Grid
              container
              columnSpacing={2}
              sx={{ mt: 0.5, alignItems: 'flex-start' }}
            >
              <Grid size={8} sx={{ minHeight: 0 }}>
                {' '}
                {/* <-- add this */}
                <ChatTab eventId={eventId} />
              </Grid>

              <Grid
                size={4}
                sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}
              >
                <Stack gap={1.5} sx={{ position: 'sticky', top: 88 }}>
                  <RosterPanel bandId={bandId} eventId={eventId} />
                </Stack>
              </Grid>
            </Grid>
          ) : (
            // --- MOBILE (sm/xs): chat + swipeable roster ---
            <>
              <ChatTab eventId={eventId} />

              {/* Edge Puller (flush to right; hidden when open) */}
              <Box
                role="button"
                aria-label="Open roster"
                onClick={() => setRosterOpen(true)}
                onTouchStart={() => setRosterOpen(true)}
                sx={(t) => ({
                  position: 'fixed',
                  top: '50%',
                  right: 0, // flush to the right edge
                  transform: 'translateY(-50%)',
                  zIndex: t.zIndex.drawer + 1,
                  width: 16, // slim puller
                  height: 72,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  // no border so there’s no 1px line "gap"
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
                  display: { xs: rosterOpen ? 'none' : 'flex', md: 'none' }, // hide when open
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&::after': {
                    content: '""',
                    display: 'block',
                    width: 3,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.55)',
                  },
                })}
              />

              <SwipeableDrawer
                anchor="right"
                open={rosterOpen}
                onOpen={() => setRosterOpen(true)}
                onClose={() => setRosterOpen(false)}
                disableSwipeToOpen={false}
                swipeAreaWidth={16} // invisible edge hot-zone; flush to edge
                PaperProps={{
                  sx: {
                    width: '90vw',
                    maxWidth: 420,
                    p: 1.5,
                    right: 0, // ensure flush
                    margin: 0, // no margin gap
                    borderLeft: '1px solid', // optional divider line
                    borderColor: 'divider',
                    position: 'fixed',
                    // left-edge grab handle *inside* the drawer; aligned to edge (no -1px)
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.45)',
                    },
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Roster
                  </Typography>
                  <Button onClick={() => setRosterOpen(false)}>Close</Button>
                </Stack>
                <RosterPanel bandId={bandId} eventId={eventId} />
              </SwipeableDrawer>
            </>
          ))}

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

  const HEADER_OFFSET_XS = 148;
  const HEADER_OFFSET_MD = 192;
  const COMPOSER_LIFT = 24;

  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerH, setComposerH] = useState(72); // default guess

  useLayoutEffect(() => {
    const measure = () => {
      if (composerRef.current)
        setComposerH(composerRef.current.offsetHeight || 72);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: {
          xs: `calc(100dvh - ${HEADER_OFFSET_XS}px)`,
          md: `calc(100dvh - ${HEADER_OFFSET_MD}px)`,
        },
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Messages scroll area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2,
          pr: 0.5,
          pb: `${composerH + 8}px`,
          scrollPaddingBottom: `${composerH + 8}px`,
        }}
      >
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

      {/* Composer pinned at the bottom (measured) */}
      <Box
        ref={composerRef}
        sx={{
          pt: 1,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          pb: `${composerH + 8 + COMPOSER_LIFT}px`,
          scrollPaddingBottom: `${composerH + 8 + COMPOSER_LIFT}px`,
          position: 'relative',
          mb: `${COMPOSER_LIFT}px`,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
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
