/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import theme from '@/theme';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import {
  Alert,
  Autocomplete,
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
} from '@mui/material';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const blurActive = () =>
  (document.activeElement as HTMLElement | null)?.blur?.();

type Trigger = 'icon' | 'button' | 'none';
type BandLite = { id: string; name: string };

export type GlobalCreateProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: Trigger;
  onBandCreated?: (band: { id: string; name: string }) => void;
};

function errMsg(e: unknown) {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e)
    return String((e as any).message);
  return 'Something went wrong';
}

/** Merge server results into current list (keeps optimistic items; stable by name). */
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

export default function GlobalCreate({
  open: openProp,
  onOpenChange,
  trigger = 'icon',
  onBandCreated,
}: GlobalCreateProps) {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Controlled/uncontrolled open handling
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

  const [step, setStep] = useState<'menu' | 'newBand'>('menu');
  const [error, setError] = useState<string | null>(null);

  // Bands for “New Event”
  const [bands, setBands] = useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const hasBands = bands.length > 0;

  // Event selection
  const [eventBand, setEventBand] = useState<BandLite | null>(null);

  // New band form
  const [bandName, setBandName] = useState('');
  const [creatingBand, setCreatingBand] = useState(false);

  const CONTENT_PX = 3;

  // Load bands when dialog opens (ensure profile → fetch bands → merge)
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

        // Best-effort profile ensure (ignore “function not found”)
        try {
          const { error: rpcErr } = await sb.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile]', rpcErr.message);
          }
        } catch {
          /* noop */
        }

        const { data: rows, error: mErr } = await sb
          .from('band_members')
          .select('role, bands(id, name)')
          .eq('user_id', user.id);
        if (mErr) throw mErr;

        const mapped: BandLite[] = (rows ?? [])
          .map((r: any) => r?.bands)
          .filter(Boolean) as BandLite[];

        if (mounted) setBands((prev) => mergeLocalBands(prev, mapped));
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
  }, [open, router, setOpen]);

  // Global open/close events (SideNav/BottomNav)
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

  const refreshBandsLocal = useCallback(async () => {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const { data: rows, error } = await sb
      .from('band_members')
      .select('role, bands(id, name)')
      .eq('user_id', user.id);
    if (error) throw error;

    const mapped: BandLite[] = (rows ?? [])
      .map((r: any) => r?.bands)
      .filter(Boolean) as BandLite[];

    setBands((prev) => mergeLocalBands(prev, mapped));
  }, []);

  // Create Band via RPC (returns the created row)
  const createBand = useCallback(async () => {
    const name = bandName.trim();
    if (!name) return;

    try {
      setCreatingBand(true);
      setError(null);

      const sb = supabaseBrowser();

      // Create via RPC — must return { id, name } (or [{ id, name }])
      const { data: rpcData, error: rpcErr } = await sb.rpc('create_band', {
        p_name: name,
      });
      if (rpcErr) throw rpcErr;

      let newBand: { id: string; name: string } | null = null;
      if (Array.isArray(rpcData)) {
        const row = rpcData[0];
        if (row?.id && row?.name)
          newBand = { id: String(row.id), name: String(row.name) };
      } else if (rpcData && (rpcData as any).id && (rpcData as any).name) {
        newBand = {
          id: String((rpcData as any).id),
          name: String((rpcData as any).name),
        };
      }

      if (!newBand)
        throw new Error('create_band did not return a band row (id, name).');

      // Notify parent immediately + broadcast (for any other listeners)
      onBandCreated?.(newBand);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('bands:created', { detail: newBand })
        );
      }

      // Optimistically show in the modal’s local list
      setBands((prev) => mergeLocalBands(prev, [newBand]));

      // Refresh local list from server (merge to avoid clobber)
      await refreshBandsLocal();

      // Reset UI
      setEventBand(newBand);
      setBandName('');
      setStep('menu');
      setOpen(false);
    } catch (e) {
      console.error('[createBand]', e);
      setError(errMsg(e) || 'Could not create band');
    } finally {
      setCreatingBand(false);
    }
  }, [bandName, onBandCreated, refreshBandsLocal, setOpen]);

  // Optional trigger button (icon/button/none)
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
        onClose={(_, __) => {
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
              {step === 'menu' ? 'Create' : 'Create Band'}
            </Stack>
            <IconButton
              aria-label="Close"
              edge="end"
              onClick={() => {
                blurActive();
                setOpen(false);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: CONTENT_PX, pt: 1, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          {step === 'menu' ? (
            <Stack gap={1.25}>
              {/* New Band */}
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

              {/* New Event */}
              <Stack gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <EventIcon sx={{ opacity: 0.9 }} />
                  <ListItemText
                    primary="New Event"
                    secondary={
                      hasBands
                        ? 'Choose a band for your gig or practice'
                        : 'Create a band first'
                    }
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </Stack>

                <Autocomplete
                  disabled={!hasBands}
                  loading={loadingBands}
                  value={eventBand}
                  onChange={(_, v) => setEventBand(v)}
                  options={bands}
                  getOptionLabel={(o) => o?.name ?? ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Band"
                      size="small"
                      fullWidth
                    />
                  )}
                />

                <Button
                  variant="contained"
                  onClick={() => {
                    if (!hasBands) return setStep('newBand');
                    if (eventBand) {
                      setOpen(false);
                      router.push(`/bands/${eventBand.id}/events/new`);
                    }
                  }}
                  disabled={hasBands && !eventBand}
                >
                  Continue
                </Button>
              </Stack>
            </Stack>
          ) : (
            // step === 'newBand'
            <Stack gap={1.25}>
              <TextField
                autoFocus
                fullWidth
                label="Band name"
                placeholder="e.g., Teem and Tiger"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createBand();
                }}
              />

              <Stack direction="row" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setError(null);
                    setBandName('');
                    setStep('menu');
                  }}
                >
                  Back
                </Button>

                <Button
                  variant="contained"
                  onClick={createBand}
                  disabled={!bandName.trim() || creatingBand}
                  startIcon={
                    creatingBand ? <CircularProgress size={18} /> : undefined
                  }
                >
                  {creatingBand ? 'Creating…' : 'Create Band'}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
