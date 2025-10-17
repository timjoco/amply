/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import SendIcon from '@mui/icons-material/Send';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import Grid from '@mui/material/Grid';
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
  is_booked?: boolean;
  cnt_members?: number;
  cnt_accepted?: number;
};

type AttStatus = 'accepted' | 'tentative' | 'declined' | 'pending';

function useAttendance(eventId: string) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [mine, setMine] = useState<AttStatus>('pending');
  const [counts, setCounts] = useState<{ accepted: number; total: number }>({
    accepted: 0,
    total: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    // my status
    const { data: me, error: meErr } = await sb
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .limit(1);
    if (!meErr && me?.[0]?.status) setMine(me[0].status as AttStatus);
    if (meErr) setError(meErr.message);

    // counts
    const { data: all, error: cErr } = await sb
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId);
    if (!cErr) {
      const total = all?.length ?? 0;
      const accepted = (all ?? []).filter(
        (r) => r.status === 'accepted'
      ).length;
      setCounts({ accepted, total });
    } else {
      setError(cErr.message);
    }
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

  const update = useCallback(
    async (next: AttStatus) => {
      if (next === 'pending' || next === mine) return; // no-op
      setSaving(true);
      setError(null);

      // snapshot for rollback
      const prevMine = mine;
      const prevCounts = counts;

      // optimistic counts: only the accepted tally changes
      const applyCounts = (from: AttStatus, to: AttStatus) => {
        let accepted = counts.accepted;
        if (from === 'accepted') accepted -= 1;
        if (to === 'accepted') accepted += 1;
        setCounts({ accepted, total: counts.total }); // total unchanged
      };

      // optimistic UI
      setMine(next);
      applyCounts(prevMine, next);

      try {
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) throw new Error('Sign in to respond');

        const { error: upErr } = await sb.from('event_attendance').upsert(
          {
            event_id: eventId,
            status: next,
            responded_at: new Date().toISOString(),
            // let DEFAULT auth.uid() set user_id
          },
          { onConflict: 'event_id,user_id' }
        );

        if (upErr) throw upErr;
        // success: realtime will eventually refresh counts/roster too
      } catch (e: any) {
        // rollback optimistic UI
        setMine(prevMine);
        setCounts(prevCounts);

        const msg = /row[- ]level security|RLS|42501/i.test(e?.message)
          ? "You don't have permission to respond for this event."
          : e?.message ?? 'Failed to update attendance.';
        setError(msg);
      } finally {
        setSaving(false);
      }
    },
    [sb, eventId, mine, counts]
  );

  return { mine, counts, saving, error, update };
}

function AttendanceBar({ eventId }: { eventId: string }) {
  const { mine, counts, saving, error, update } = useAttendance(eventId);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        mb: 1.5,
        flexWrap: 'wrap',
        gap: 1,
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
      {error && (
        <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
function RosterPanel({ bandId, eventId }: { bandId: string; eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<
    {
      user_id: string;
      name: string;
      status: 'accepted' | 'declined' | 'tentative' | 'pending';
    }[]
  >([]);

  const load = useCallback(async () => {
    // 1) Band members → user_id list
    const { data: members, error: mErr } = await sb
      .from('band_members')
      .select('user_id')
      .eq('band_id', bandId);

    if (mErr) return; // optionally set error UI

    const ids = (members ?? []).map((m: any) => m.user_id);
    if (ids.length === 0) {
      setRows([]);
      return;
    }

    // 2) Profiles for those users
    const { data: profiles, error: pErr } = await sb
      .from('profiles')
      .select('id, display_name, first_name')
      .in('id', ids);

    if (pErr) return;

    // 3) Attendance for this event
    const { data: att, error: aErr } = await sb
      .from('event_attendance')
      .select('user_id, status')
      .eq('event_id', eventId);

    if (aErr) return;

    const statusByUser = new Map<
      string,
      'accepted' | 'declined' | 'tentative' | 'pending'
    >((att ?? []).map((a: any) => [a.user_id, a.status]));

    // 4) Merge
    const merged =
      (profiles ?? []).map((p: any) => ({
        user_id: p.id,
        name: p.display_name ?? p.first_name ?? 'Member',
        status: statusByUser.get(p.id) ?? 'pending',
      })) ?? [];

    // Optional: keep original band_members order
    const orderIndex = new Map(ids.map((id, i) => [id, i]));
    merged.sort(
      (a, b) => orderIndex.get(a.user_id)! - orderIndex.get(b.user_id)!
    );

    setRows(merged);
  }, [sb, bandId, eventId]);

  useEffect(() => {
    load();
    // Realtime: update when attendance rows change for this event
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
              {/* <Avatar src={r.avatar_url ?? undefined}>
                {r.name?.slice(0, 1).toUpperCase()}
              </Avatar> */}
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
  const [tab, setTab] = useState<'chat' | 'setlist' | 'notes' | 'files'>(
    'chat'
  );

  // top of EventSheet()
  const theme = useTheme();

  // Always call the hook (fixed order). It's OK if we don't use the value yet.
  const mdUp = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Only *use* the media query after mount so SSR and first client paint match
  const showDesktop = mounted && mdUp;

  const startsAtLabel = useMemo(() => {
    try {
      const d = new Date(initialEvent.starts_at);
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
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#0B0A10',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER (natural height, no scrolling) */}
      <Box
        component="header"
        sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 } }}
      >
        {/* Header */}
        <Box sx={{ flex: '1 1 auto', minWidth: 0, mb: 1.5 }}>
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

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{ opacity: 0.72, mt: 0.25 }}
            suppressHydrationWarning
          >
            {initialEvent.type} · {startsAtLabel}
            {initialEvent.location ? ` · ${initialEvent.location}` : ''}
          </Typography>

          <AttendanceBar eventId={eventId} />
        </Box>

        {/* Tabs (still in header) */}
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            mt: 1,
            mb: 0, // tighter since content below has own spacing
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Tab label="Chat" value="chat" />
          <Tab label="Setlist" value="setlist" />
          <Tab label="Notes" value="notes" />
          <Tab label="Files" value="files" />
        </Tabs>
      </Box>

      {/* MAIN (fills remaining viewport; hosts internal scroll only) */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0, // 👈 critical for nested flex scroll
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
          overflow: 'hidden', // the children manage their own scroll
        }}
      >
        {tab === 'chat' &&
          (showDesktop ? (
            // DESKTOP
            <Grid
              container
              columnSpacing={2}
              sx={{ alignItems: 'stretch', height: '100%' }}
            >
              <Grid size={{ xs: 12, md: 8 }} sx={{ minHeight: 0 }}>
                <ChatTab eventId={eventId} />
              </Grid>

              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{
                  borderLeft: { md: '1px solid', xs: 'none' },
                  borderColor: 'divider',
                  pl: { md: 2, xs: 0 },
                  minHeight: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack
                  gap={1.5}
                  sx={{ position: { md: 'sticky' as const }, top: { md: 88 } }}
                >
                  <RosterPanel bandId={bandId} eventId={eventId} />
                </Stack>
              </Grid>
            </Grid>
          ) : (
            // MOBILE
            <>
              <ChatTab eventId={eventId} />

              {/* Edge Puller */}
              <Box
                role="button"
                aria-label="Open roster"
                onClick={() => setRosterOpen(true)}
                onTouchStart={() => setRosterOpen(true)}
                sx={(t) => ({
                  position: 'fixed',
                  top: '50%',
                  right: 0,
                  transform: 'translateY(-50%)',
                  zIndex: t.zIndex.drawer + 1,
                  width: 16,
                  height: 72,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
                  display: { xs: rosterOpen ? 'none' : 'flex', md: 'none' },
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
                swipeAreaWidth={16}
                PaperProps={{
                  sx: {
                    width: '90vw',
                    maxWidth: 420,
                    p: 1.5,
                    right: 0,
                    margin: 0,
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    position: 'fixed',
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

        {/* {tab === 'setlist' && <SetlistTab eventId={eventId} />}
        {tab === 'notes' && <NotesTab eventId={eventId} />}
        {tab === 'files' && <FilesTab eventId={eventId} />} */}
      </Box>
    </Box>
  );
}

function ChatTab({ eventId }: { eventId: string }) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  const sb = useMemo(() => supabaseBrowser(), []);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // — Composer measurement —
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerH, setComposerH] = useState(72);
  const BOTTOM_NAV_H = mdUp ? 0 : 56; // adjust if your BottomNavigation differs

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Chicago',
        hour12: true,
      }),
    []
  );

  useLayoutEffect(() => {
    const measure = () => {
      if (composerRef.current)
        setComposerH(composerRef.current.offsetHeight || 72);
    };
    measure();
    const obs = new ResizeObserver(measure);
    if (composerRef.current) obs.observe(composerRef.current);
    window.addEventListener('resize', measure);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // — Initial load —
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
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      );
    })();
    return () => {
      alive = false;
    };
  }, [sb, eventId]);

  // — Realtime inserts —
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
    if (error) setInput(body); // naive retry UX
  }, [input, eventId, sb]);

  return (
    <Box
      sx={{
        height: '100%', // fills EventSheet main area
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // internal scroll only
      }}
    >
      {/* Scroll area for messages */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          py: 2,
          pr: 0.5,
          pb: `calc(${composerH}px + ${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + 8px)`,
          scrollPaddingBottom: `calc(${composerH}px + ${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + 8px)`,
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
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.7 }}
                    suppressHydrationWarning
                  >
                    {timeFmt.format(new Date(m.created_at))}
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

      {/* Fixed composer above BottomNav */}
      <Box
        ref={composerRef}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: (t) => t.zIndex.appBar + 1,
          bgcolor: 'rgba(11,10,16,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: 1 }}>
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
    </Box>
  );
}

// /* ---------- Setlist (MVP) ---------- */
// function SetlistTab({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [items, setItems] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [title, setTitle] = useState('');

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       setLoading(true);
//       const { data } = await sb
//         .from('event_setlist_items')
//         .select('id, title, position, notes, created_at')
//         .eq('event_id', eventId)
//         .order('position', { ascending: true });
//       if (!alive) return;
//       setItems(data ?? []);
//       setLoading(false);
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [sb, eventId]);

//   useEffect(() => {
//     const ch = sb
//       .channel(`setlist:${eventId}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'event_setlist_items',
//           filter: `event_id=eq.${eventId}`,
//         },
//         () => {
//           sb.from('event_setlist_items')
//             .select('id, title, position, notes, created_at')
//             .eq('event_id', eventId)
//             .order('position', { ascending: true })
//             .then(({ data }) => setItems(data ?? []));
//         }
//       )
//       .subscribe();
//     return () => {
//       sb.removeChannel(ch);
//     };
//   }, [sb, eventId]);

//   const addItem = useCallback(async () => {
//     const t = title.trim();
//     if (!t) return;
//     setTitle('');
//     await sb.from('event_setlist_items').insert({
//       event_id: eventId,
//       title: t,
//       position: (items.at(-1)?.position ?? 0) + 10,
//     });
//   }, [sb, eventId, title, items]);

//   const move = useCallback(
//     async (id: string, dir: -1 | 1) => {
//       const idx = items.findIndex((i) => i.id === id);
//       const swapIdx = idx + dir;
//       if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
//       const a = items[idx],
//         b = items[swapIdx];
//       await sb
//         .from('event_setlist_items')
//         .update({ position: b.position })
//         .eq('id', a.id);
//       await sb
//         .from('event_setlist_items')
//         .update({ position: a.position })
//         .eq('id', b.id);
//     },
//     [items, sb]
//   );

//   const remove = useCallback(
//     async (id: string) => {
//       await sb.from('event_setlist_items').delete().eq('id', id);
//     },
//     [sb]
//   );

//   return (
//     <Stack gap={1.25} sx={{ mt: 1 }}>
//       <Stack direction="row" gap={1}>
//         <TextField
//           fullWidth
//           size="small"
//           label="Add song"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === 'Enter') addItem();
//           }}
//           InputLabelProps={{ shrink: true }}
//           InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
//         />
//         <Button variant="contained" onClick={addItem} startIcon={<AddIcon />}>
//           Add
//         </Button>
//       </Stack>

//       {loading ? (
//         <Typography color="text.secondary">Loading setlist…</Typography>
//       ) : items.length === 0 ? (
//         <Typography color="text.secondary">
//           No setlist yet. Add your first song.
//         </Typography>
//       ) : (
//         <Stack gap={1.25}>
//           {items.map((it, i) => (
//             <Paper
//               key={it.id}
//               variant="outlined"
//               sx={(t) => ({
//                 p: 1,
//                 borderRadius: 2,
//                 borderColor: alpha(t.palette.primary.main, 0.14),
//                 background:
//                   'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
//               })}
//             >
//               <Stack direction="row" alignItems="center" gap={1}>
//                 <Typography
//                   sx={{ fontWeight: 800, flex: 1, minWidth: 0 }}
//                   noWrap
//                 >
//                   {i + 1}. {it.title}
//                 </Typography>
//                 <IconButton
//                   size="small"
//                   onClick={() => move(it.id, -1)}
//                   disabled={i === 0}
//                 >
//                   <ArrowUpwardIcon fontSize="small" />
//                 </IconButton>
//                 <IconButton
//                   size="small"
//                   onClick={() => move(it.id, +1)}
//                   disabled={i === items.length - 1}
//                 >
//                   <ArrowDownwardIcon fontSize="small" />
//                 </IconButton>
//                 <IconButton size="small" onClick={() => remove(it.id)}>
//                   <DeleteOutlineIcon fontSize="small" />
//                 </IconButton>
//               </Stack>
//               {it.notes && (
//                 <>
//                   <Divider sx={{ my: 0.75, opacity: 0.08 }} />
//                   <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                     {it.notes}
//                   </Typography>
//                 </>
//               )}
//             </Paper>
//           ))}
//         </Stack>
//       )}
//     </Stack>
//   );
// }

// /* ---------- Notes (autosave) ---------- */
// function NotesTab({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [body, setBody] = useState('');
//   const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
//   const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       const { data } = await sb
//         .from('event_notes')
//         .select('body')
//         .eq('event_id', eventId)
//         .maybeSingle();
//       if (!alive) return;
//       setBody(data?.body ?? '');
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [sb, eventId]);

//   const save = useCallback(
//     async (next: string) => {
//       setSaving('saving');
//       await sb.from('event_notes').upsert({ event_id: eventId, body: next });
//       setSaving('saved');
//       setTimeout(() => setSaving('idle'), 800);
//     },
//     [sb, eventId]
//   );

//   const onChange = (v: string) => {
//     setBody(v);
//     setSaving('saving');
//     if (timer.current) clearTimeout(timer.current);
//     timer.current = setTimeout(() => save(v), 600);
//   };

//   return (
//     <Stack gap={1.25} sx={{ mt: 1 }}>
//       <TextField
//         multiline
//         minRows={6}
//         fullWidth
//         placeholder="Shared notes for this event…"
//         value={body}
//         onChange={(e) => onChange(e.target.value)}
//         InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
//       />
//       <Typography variant="caption" sx={{ opacity: 0.7 }}>
//         {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ' '}
//       </Typography>
//     </Stack>
//   );
// }

// /* ---------- Files (private storage: event-files bucket) ---------- */
// function FilesTab({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);

//   const list = useCallback(async () => {
//     setLoading(true);
//     const { data, error } = await sb.storage
//       .from('event-files')
//       .list(eventId, { limit: 100, offset: 0 });
//     if (!error) setPaths((data ?? []).map((o) => `${eventId}/${o.name}`));
//     setLoading(false);
//   }, [sb, eventId]);

//   useEffect(() => {
//     list();
//   }, [list]);

//   const onUpload = async (file: File) => {
//     const path = `${eventId}/${crypto.randomUUID()}.${
//       file.name.split('.').pop() ?? 'dat'
//     }`;
//     const { error } = await sb.storage
//       .from('event-files')
//       .upload(path, file, { upsert: true });
//     if (!error) list();
//   };

//   const downloadUrl = async (path: string) => {
//     const { data, error } = await sb.storage
//       .from('event-files')
//       .createSignedUrl(path, 60 * 60);
//     if (!error && data?.signedUrl)
//       window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <Stack gap={1.25} sx={{ mt: 1 }}>
//       <Button
//         variant="outlined"
//         component="label"
//         sx={{ alignSelf: 'flex-start' }}
//       >
//         Upload file
//         <input
//           hidden
//           type="file"
//           onChange={(e) => {
//             const f = e.target.files?.[0];
//             if (f) onUpload(f);
//             (e.currentTarget as HTMLInputElement).value = '';
//           }}
//         />
//       </Button>

//       {loading ? (
//         <Typography color="text.secondary">Loading files…</Typography>
//       ) : paths.length === 0 ? (
//         <Typography color="text.secondary">No files yet.</Typography>
//       ) : (
//         <Stack gap={1}>
//           {paths.map((p) => (
//             <Paper
//               key={p}
//               variant="outlined"
//               sx={(t) => ({
//                 p: 1,
//                 borderRadius: 2,
//                 borderColor: alpha(t.palette.primary.main, 0.14),
//                 background:
//                   'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//               })}
//             >
//               <Typography sx={{ wordBreak: 'break-all' }}>
//                 {p.split('/').slice(1).join('/')}
//               </Typography>
//               <Button size="small" onClick={() => downloadUrl(p)}>
//                 Open
//               </Button>
//             </Paper>
//           ))}
//         </Stack>
//       )}
//     </Stack>
//   );
// }
