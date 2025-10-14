/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import BandCard from '@/components/Bands/BandCard';
import NoBandsNoEventsPaper from '@/components/Bands/NoBandNoEventsPaper';

import GlobalCreate, { GlobalCreateHandle } from '@/components/GlobalCreate';
import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  mapMembershipRowsToBands,
  sortBandsByRolePriority,
  type BandWithRole,
} from '@/utils/bands';

import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
}

export default function DashboardClient() {
  const router = useRouter();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bands, setBands] = useState<BandWithRole[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [bandName, setBandName] = useState('');
  const [creating, setCreating] = useState(false);

  const createRef = useRef<GlobalCreateHandle>(null);
  const pageGutterSx = {
    mx: { xs: 1.5, sm: 2.5, md: 4 }, // horizontal margin for the whole section
  } as const;

  const cardSx = (t: any) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3,
    border: '1px solid',
    borderColor: alpha(t.palette.primary.main, 0.22),
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    backdropFilter: 'blur(6px)',
    boxShadow: `0 0 0 1px ${alpha(
      t.palette.primary.main,
      0.12
    )}, 0 10px 30px rgba(0,0,0,.35)`,
  });

  const gridSx = {
    display: 'grid',
    gap: 2.5,
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, minmax(0, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
      xl: 'repeat(4, minmax(0, 1fr))',
    },
  } as const;

  const sectionTitleSx = {
    mt: 1,
    mb: 1,
    letterSpacing: 0.3,
    fontWeight: 700,
  } as const;

  // Load profile + bands
  useEffect(() => {
    const sb = supabaseBrowser();
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!mounted) return;

        if (!user) {
          router.replace('/login?next=/dashboard');
          return;
        }

        // Ensure a profile row exists (idempotent)
        try {
          const { error: rpcErr } = await sb.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile] RPC error:', rpcErr.message);
          }
        } catch (e) {
          console.warn('[ensure_profile] RPC call failed:', e);
        }

        // Bands via memberships
        const { data: rows, error: mErr } = await sb
          .from('band_members')
          .select('role, bands(id, name)')
          .eq('user_id', user.id);
        if (mErr) throw mErr;

        if (mounted) {
          const list = sortBandsByRolePriority(mapMembershipRowsToBands(rows));
          setBands(list);
        }
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError(getErrorMessage(e) || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) router.replace('/login?next=/dashboard');
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

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

    setBands(sortBandsByRolePriority(mapMembershipRowsToBands(rows)));
  }, []);

  const createBand = useCallback(async () => {
    if (!bandName.trim()) return;
    try {
      setCreating(true);
      setError(null);

      const sb = supabaseBrowser();
      const { error } = await sb.rpc('create_band', {
        p_name: bandName.trim(),
      });
      if (error) throw error;

      setCreateOpen(false);
      setBandName('');
      await refreshBands();
    } catch (e) {
      setError(getErrorMessage(e) || 'Could not create band');
    } finally {
      setCreating(false);
    }
  }, [bandName, refreshBands]);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 4 }}>
      <GlobalCreate ref={createRef} trigger="none" />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
          Your Dashboard
        </Typography>
        {error && (
          <Alert
            severity="error"
            sx={(t) => ({
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(t.palette.error.main, 0.35),
              backgroundColor: alpha(t.palette.error.main, 0.06),
            })}
          >
            {error}
          </Alert>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ ...pageGutterSx }}>
          <Box sx={gridSx}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} sx={cardSx}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{ mt: 2, borderRadius: 2 }}
                  />
                </CardContent>
                <CardActions
                  sx={(t) => ({
                    borderTop: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.12),
                  })}
                >
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={36}
                    sx={{ borderRadius: 999 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={120}
                    height={36}
                    sx={{ borderRadius: 999 }}
                  />
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>
      ) : (
        <>
          {/* Bands section */}
          <Box sx={pageGutterSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Bands
            </Typography>
          </Box>

          {bands.length === 0 ? (
            <Box sx={{ ...pageGutterSx, mt: 1 }}>
              <NoBandsNoEventsPaper
                kind="bands"
                onPrimary={() => setCreateOpen(true)}
                maxWidth="100%"
                contentMaxWidth="100%"
                center
              />
            </Box>
          ) : (
            <Box sx={{ ...pageGutterSx, mt: 1 }}>
              <Box sx={gridSx}>
                {bands.map((b) => (
                  <BandCard
                    key={b.id}
                    id={b.id}
                    name={b.name}
                    bandRole={b.role}
                    dense={isXs}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Events section */}
          <Box sx={{ ...pageGutterSx, mt: 3 }}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Events
            </Typography>
          </Box>

          <Box sx={pageGutterSx}>
            <NoBandsNoEventsPaper
              kind="events"
              onPrimary={() => createRef.current?.open()}
              maxWidth="100%"
              contentMaxWidth="100%"
              center
            />
          </Box>
        </>
      )}

      {/* Create band dialog (unchanged) */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: (t) => ({
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.28),
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(8px)',
          }),
        }}
      >
        <DialogTitle sx={{ pb: 1.5 }}>Create band</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Band name"
            fullWidth
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            variant="outlined"
            sx={(t) => ({
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: alpha(t.palette.primary.main, 0.28),
                },
                '&:hover fieldset': {
                  borderColor: alpha(t.palette.primary.main, 0.45),
                },
                '&.Mui-focused fieldset': {
                  borderColor: t.palette.primary.main,
                },
              },
            })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCreateOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createBand}
            disabled={creating || !bandName.trim()}
            startIcon={creating ? <CircularProgress size={18} /> : <AddIcon />}
            sx={{ borderRadius: 999, px: 2.25, textTransform: 'none' }}
          >
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
