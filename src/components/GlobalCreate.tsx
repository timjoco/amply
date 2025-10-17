/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCreateBand } from '@/hooks/useCreateBand';
import { createEvent, type EventType } from '@/lib/events/createEvent';
import { supabaseBrowser } from '@/lib/supabaseClient';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ScheduleIcon from '@mui/icons-material/Schedule';

import {
  Alert,
  Autocomplete,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Trigger = 'icon' | 'button' | 'none';
type BandLite = { id: string; name: string; avatar_url?: string | null };

export type GlobalCreateProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: Trigger;
  onBandCreated?: (band: BandLite) => void;
};

const CONTENT_PX = 3;

// ---------- Helpers ----------
const blurActive = () =>
  (document.activeElement as HTMLElement | null)?.blur?.();

function errMsg(e: unknown) {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e)
    return String((e as any).message);
  return 'Something went wrong';
}

function normalizeCreateEventError(e: any): string {
  const msg = String(e?.message ?? e ?? '');
  const code = e?.code ?? e?.status;
  if (code === '42501' || /row[- ]level security/i.test(msg)) {
    return "You don't have permission to create events for this band.";
  }
  if (code === 401 || code === 403) {
    return "You're not allowed to create events for this band.";
  }
  return 'Could not create the event. Please try again.';
}

/** Merge server results into current list (stable by id, sorted by name). */
function mergeLocalBands(
  current: BandLite[],
  incoming: BandLite[]
): BandLite[] {
  const map = new Map<string, BandLite>();
  current.forEach((b) => map.set(b.id, b));
  incoming.forEach((b) => {
    const prev = map.get(b.id);
    map.set(b.id, prev ? { ...prev, ...b } : b);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Map PostgREST rows → BandLite (tolerant to missing nested bands). */
function mapBands(rows: any[] | null | undefined): BandLite[] {
  return (rows ?? [])
    .map((r: any) => r?.bands)
    .filter(Boolean)
    .map((b: any) => ({
      id: String(b.id),
      name: String(b.name),
      avatar_url: b.avatar_url ?? null,
    }));
}

export default function GlobalCreate({
  open: openProp,
  onOpenChange,
  trigger = 'icon',
  onBandCreated,
}: GlobalCreateProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();

  // controlled/uncontrolled
  const isControlled = typeof openProp === 'boolean';
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = isControlled ? (openProp as boolean) : openUncontrolled;
  const setOpen = useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setOpenUncontrolled(v);
    },
    [isControlled, onOpenChange]
  );

  // errors
  const [error, setError] = useState<string | null>(null);

  // bands for “New Event”
  const [bands, setBands] = useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);

  // event band selection
  const [eventBand, setEventBand] = useState<BandLite | null>(null);

  // new band form
  const [bandName, setBandName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // wizard step
  const [step, setStep] = useState<'menu' | 'newBand' | 'newEvent'>('menu');

  // new event fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('show');
  const [eventStarts, setEventStarts] = useState<string>('');
  const [eventEnds, setEventEnds] = useState<string>('');
  const [eventLocation, setEventLocation] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // useCreateBand hook
  const {
    createBand: createBandWithHook,
    loading: creatingBand,
    error: createBandError,
    resetError: resetCreateBandError,
  } = useCreateBand();

  // URL.createObjectURL cleanup
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const closeDialog = useCallback(() => {
    blurActive();
    setOpen(false);
  }, [setOpen]);

  const resetAll = useCallback(() => {
    setStep('menu');
    setError(null);
    resetCreateBandError?.();

    setBandName('');
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);

    setEventBand(null);
    setEventTitle('');
    setEventType('show');
    setEventStarts('');
    setEventEnds('');
    setEventLocation('');
  }, [avatarPreview, resetCreateBandError]);

  // re-init on route change (don’t force-close)
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      resetAll();
    }
  }, [pathname, resetAll]);

  // pick avatar
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) return alert('Please choose an image.');
    if (f.size > 3 * 1024 * 1024) return alert('Max size is 3MB.');

    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    // allow picking same file twice
    e.currentTarget.value = '';
  };

  // fetch bands (reused)
  const fetchBands = useCallback(async () => {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { rows: [], merged: [] as BandLite[] };

    const { data: rows, error } = await sb
      // NOTE: keep this table name consistent with your schema.
      .from('band_members')
      .select('role, bands(id, name, avatar_url)')
      .eq('user_id', user.id);

    if (error) throw error;

    const mapped = mapBands(rows);
    const merged = mergeLocalBands([], mapped);
    return { rows, merged };
  }, []);

  // Load bands when dialog opens
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const sb = supabaseBrowser();

    (async () => {
      try {
        setError(null);
        setLoadingBands(true);

        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!mounted) return;

        if (!user) {
          setOpen(false);
          router.replace('/login?next=/dashboard');
          return;
        }
        try {
          const { error: rpcErr } = await sb.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile]', rpcErr.message);
          }
        } catch {}

        const { merged } = await fetchBands();
        if (mounted) setBands(merged);
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError(errMsg(e) || 'Failed to load data');
      } finally {
        if (mounted) setLoadingBands(false);
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) router.replace('/login?next=/dashboard');
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [open, router, setOpen, fetchBands]);

  // Create band (hook)
  const onSubmitCreate = useCallback(async () => {
    const name = bandName.trim();
    if (!name) return;

    try {
      resetCreateBandError?.();
      setError(null);

      const created = await createBandWithHook({ name, avatarFile });
      if (!created?.id) throw new Error('Could not create band');

      // update local list quickly
      setBands((prev) =>
        mergeLocalBands(prev, [
          {
            id: created.id,
            name: created.name,
            avatar_url: created.avatar_url ?? null,
          },
        ])
      );

      onBandCreated?.(created);

      closeDialog();
      router.push(`/bands/${created.id}`);
    } catch (e) {
      console.error('[GlobalCreate:onSubmitCreate]', e);
      setError(errMsg(e) || 'Could not create band');
    }
  }, [
    bandName,
    avatarFile,
    createBandWithHook,
    resetCreateBandError,
    onBandCreated,
    closeDialog,
    router,
  ]);

  // Global open/close events (SideNav/BottomNav triggers)
  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('global-create:open', openHandler);
    window.addEventListener('global-create:close', closeHandler);
    return () => {
      window.removeEventListener('global-create:open', openHandler);
      window.removeEventListener('global-create:close', closeHandler);
    };
  }, [setOpen]);

  // Trigger element
  const TriggerEl = useMemo(() => {
    if (trigger === 'button') {
      return (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="success"
          onClick={() => setOpen(true)}
          sx={{ borderRadius: '9999px' }}
        >
          Create
        </Button>
      );
    }
    if (trigger === 'icon') {
      return (
        <Tooltip title="Create">
          <Button
            color="success"
            onClick={() => setOpen(true)}
            aria-label="Create"
            size={isMobile ? 'medium' : 'large'}
            startIcon={<AddIcon />}
            sx={{ minWidth: 0, px: 1.25, borderRadius: 9999 }}
          >
            {!isMobile && 'Create'}
          </Button>
        </Tooltip>
      );
    }
    return null;
  }, [trigger, isMobile, setOpen]);

  return (
    <>
      {TriggerEl}

      <Dialog
        open={open}
        onClose={() => {
          blurActive();
          setOpen(false);
        }}
        fullWidth
        maxWidth="xs"
        disableRestoreFocus
      >
        <DialogTitle sx={{ px: CONTENT_PX, pb: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Stack sx={{ flex: 1 }}>
              {step === 'menu'
                ? 'Create'
                : step === 'newBand'
                ? 'Create Band'
                : 'Create Event'}
            </Stack>
            <IconButton aria-label="Close" edge="end" onClick={closeDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: CONTENT_PX, pt: 1, pb: 2 }}>
          {(error || createBandError) && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error || createBandError}
            </Alert>
          )}

          {step === 'menu' ? (
            <Stack gap={1.25}>
              <List disablePadding sx={{ borderRadius: 1 }}>
                <ListItemButton
                  onClick={() => setStep('newBand')}
                  sx={{ px: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MusicNoteIcon sx={{ opacity: 0.9 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="New Band"
                    secondary="Start a new group or solo act"
                  />
                </ListItemButton>
              </List>

              <Divider sx={{ my: 1 }} />

              <List disablePadding sx={{ borderRadius: 1 }}>
                <ListItemButton
                  onClick={() => setStep('newEvent')}
                  sx={{ px: 0 }}
                  disabled={!bands.length}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ScheduleIcon sx={{ opacity: 0.9 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="New Event"
                    secondary={
                      bands.length
                        ? 'Create a show or practice'
                        : 'Create a band first'
                    }
                  />
                </ListItemButton>
              </List>
            </Stack>
          ) : step === 'newBand' ? (
            <Stack gap={1.5}>
              <TextField
                autoFocus
                fullWidth
                label="Band name"
                placeholder="e.g., Teem and Tiger"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSubmitCreate();
                }}
              />

              <Stack direction="row" alignItems="center" gap={2}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 64, height: 64, fontWeight: 800 }}
                >
                  {bandName.trim().slice(0, 2).toUpperCase()}
                </Avatar>

                <Button variant="outlined" component="label">
                  {avatarPreview ? 'Change avatar' : 'Add avatar'}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onPickAvatar}
                  />
                </Button>
              </Stack>

              <Stack direction="row" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setError(null);
                    resetCreateBandError?.();
                    setBandName('');
                    setAvatarFile(null);
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarPreview(null);
                    setStep('menu');
                  }}
                >
                  Back
                </Button>

                <Button
                  variant="contained"
                  onClick={onSubmitCreate}
                  disabled={!bandName.trim() || creatingBand}
                  startIcon={
                    creatingBand ? <CircularProgress size={18} /> : undefined
                  }
                >
                  {creatingBand ? 'Creating…' : 'Create Band'}
                </Button>
              </Stack>
            </Stack>
          ) : (
            // step === 'newEvent'
            <Stack gap={1.25}>
              <Autocomplete
                autoFocus
                disabled={!bands.length}
                loading={loadingBands}
                value={eventBand}
                onChange={(_, v) => setEventBand(v)}
                options={bands}
                getOptionLabel={(o) => o?.name ?? ''}
                renderInput={(params) => (
                  <TextField {...params} label="Band" size="small" fullWidth />
                )}
              />

              <TextField
                label="Title"
                size="small"
                fullWidth
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Warehouse Show"
              />

              <TextField
                label="Type"
                size="small"
                select
                SelectProps={{ native: true }}
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
              >
                <option value="show">Show</option>
                <option value="practice">Practice</option>
              </TextField>

              <TextField
                label="Starts"
                type="datetime-local"
                size="small"
                value={eventStarts}
                onChange={(e) => setEventStarts(e.target.value)}
                helperText="Local time"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Ends (optional)"
                type="datetime-local"
                size="small"
                value={eventEnds}
                onChange={(e) => setEventEnds(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Location (optional)"
                size="small"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="123 Main St"
              />

              <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEventTitle('');
                    setEventType('show');
                    setEventStarts('');
                    setEventEnds('');
                    setEventLocation('');
                    setStep('menu');
                  }}
                >
                  Back
                </Button>

                <Button
                  variant="contained"
                  disabled={
                    !eventBand ||
                    !eventTitle.trim() ||
                    !eventStarts ||
                    creatingEvent
                  }
                  onClick={async () => {
                    try {
                      setCreatingEvent(true);
                      const starts = new Date(eventStarts);
                      const ends = eventEnds ? new Date(eventEnds) : null;

                      const id = await createEvent({
                        bandId: eventBand!.id,
                        title: eventTitle,
                        type: eventType,
                        startsAt: starts,
                        endsAt: ends,
                        location: eventLocation || null,
                      });

                      closeDialog();
                      router.push(`/bands/${eventBand!.id}/events/${id}`);
                    } catch (e: any) {
                      setError(normalizeCreateEventError(e));
                    } finally {
                      setCreatingEvent(false);
                    }
                  }}
                >
                  {creatingEvent ? 'Creating…' : 'Create Event'}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
