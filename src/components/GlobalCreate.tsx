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
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';

import { useRouter } from 'next/navigation';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

const blurActive = () =>
  (document.activeElement as HTMLElement | null)?.blur?.();

export type GlobalCreateHandle = { open: () => void; close: () => void };
type Trigger = 'icon' | 'button' | 'none';
type Props = { trigger?: Trigger };
type BandLite = { id: string; name: string };

function errMsg(e: unknown) {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e)
    return String((e as any).message);
  return 'Something went wrong';
}

export default forwardRef<GlobalCreateHandle, Props>(function GlobalCreate(
  { trigger = 'icon' }: Props,
  ref
) {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'newBand'>('menu');

  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const toast = (msg: string) => setSnack(msg);

  // Bands for "New Event"
  const [bands, setBands] = useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const hasBands = bands.length > 0;

  // Event selection
  const [eventBand, setEventBand] = useState<BandLite | null>(null);

  // New band form
  const [bandName, setBandName] = useState('');
  const [creatingBand, setCreatingBand] = useState(false);

  const CONTENT_PX = 3; // unified horizontal padding

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        blurActive();
        setStep('menu');
        setError(null);
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    []
  );

  // Load on open: auth → ensure_profile → bands via memberships
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
            console.warn('[ensure_profile] RPC error:', rpcErr.message);
          }
        } catch (e) {
          console.warn('[ensure_profile] RPC call failed:', e);
        }

        const { data: rows, error: mErr } = await sb
          .from('band_members')
          .select('role, bands(id, name)')
          .eq('user_id', user.id);
        if (mErr) throw mErr;

        const mapped: BandLite[] = (rows ?? [])
          .map((r: any) => r?.bands)
          .filter(Boolean) as BandLite[];

        if (mounted) setBands(mapped);
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
  }, [open, router]);

  const refreshBands = useCallback(async () => {
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

    setBands(mapped);
  }, []);

  const createBand = useCallback(async () => {
    if (!bandName.trim()) return;
    try {
      setCreatingBand(true);
      setError(null);

      const sb = supabaseBrowser();

      // RPC should return [{ id, name }]
      const { data: created, error } = await sb.rpc('create_band', {
        p_name: bandName.trim(),
      });
      if (error) throw error;

      let newBand: BandLite | null =
        Array.isArray(created) && created[0] ? (created[0] as BandLite) : null;

      // Fallback: fetch most recent admin band if RPC doesn't return data
      if (!newBand) {
        type AdminBandRow = {
          role: string;
          band: { id: string; name: string; created_at: string };
        };

        const { data: rows } = await sb
          .from('band_members')
          .select('role, band:bands(id, name, created_at)')
          .eq('role', 'admin')
          .order('created_at', { referencedTable: 'bands', ascending: false })
          .limit(1)
          .returns<AdminBandRow[]>();

        const b = rows?.[0]?.band;
        if (b) newBand = { id: b.id, name: b.name };
      }

      await refreshBands();
      if (newBand) setEventBand(newBand);

      const shownName = newBand?.name ?? bandName.trim();
      setBandName('');
      setStep('menu');
      setOpen(false);
      toast(`Created ${shownName}`);
    } catch (e) {
      setError(errMsg(e) || 'Could not create band');
    } finally {
      setCreatingBand(false);
    }
  }, [bandName, refreshBands]);

  const goNewEvent = () => {
    if (!hasBands) {
      setStep('newBand');
      return;
    }
    if (eventBand) {
      setOpen(false);
      router.push(`/bands/${eventBand.id}/events/new`);
    }
  };

  // Optional trigger (DON'T use 'icon' inside BottomNavigationAction)
  const TriggerEl =
    trigger === 'button' ? (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        color="success"
        onClick={() => setOpen(true)}
        sx={{ borderRadius: '9999px' }}
      >
        Create
      </Button>
    ) : trigger === 'icon' ? (
      <Tooltip title="Create">
        <IconButton
          color="success"
          onClick={() => setOpen(true)}
          aria-label="Create"
          size={isMobile ? 'medium' : 'large'}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
    ) : null;

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
                  onClick={goNewEvent}
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

      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snack}
        </Alert>
      </Snackbar>
    </>
  );
});
