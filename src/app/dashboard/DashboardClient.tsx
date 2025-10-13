/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import AddBandTile from '@/components/AddBandTile';
import BandCard from '@/components/Bands/BandCard';
import EmptyStateStartBand from '@/components/Bands/EmptyStateStartBand';
import { supabaseBrowser } from '@/lib/supabaseClient';
import type { Band, MembershipRole } from '@/types/db';
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
  Fab,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type BandWithRole = Band & { role: MembershipRole };

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
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greetingName, setGreetingName] = useState('there');
  const [bands, setBands] = useState<BandWithRole[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [bandName, setBandName] = useState('');
  const [creating, setCreating] = useState(false);

  // styles

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

  // Load greeting + bands (no redirects here — server already gated access)
  useEffect(() => {
    const sb = supabaseBrowser();
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // ensure session exists; if not, bounce to login (with next)
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!mounted) return;
        if (!user) {
          router.replace('/login?next=/dashboard');
          return;
        }

        // Ensure a profile row exists (idempotent). If RPC missing, just warn.
        try {
          const { error: rpcErr } = await sb.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile] RPC error:', rpcErr.message);
          } else if (rpcErr?.code === '42883') {
            console.warn(
              '[ensure_profile] RPC not found — safe to ignore if triggers handle it.'
            );
          }
        } catch (e) {
          console.warn('[ensure_profile] RPC call failed:', e);
        }

        // Greeting name
        const { data: profile, error: pErr } = await sb
          .from('profiles')
          .select('first_name, email')
          .eq('id', user.id)
          .maybeSingle();
        if (pErr) console.warn('profiles select error:', pErr.message);
        setGreetingName(profile?.first_name || profile?.email || 'there');

        // Load bands via memberships
        const { data: rows, error: mErr } = await sb
          .from('band_members')
          .select('role, bands(id, name)')
          .eq('user_id', user.id);
        if (mErr) throw mErr;

        console.table(rows); // 👀 see exactly what admins vs members get

        const norm = (r: any) =>
          r?.bands && {
            id: String(r.bands.id),
            name: String(r.bands.name ?? '').trim(),
            role: String(r.role ?? '')
              .toLowerCase()
              .trim() as MembershipRole,
          };

        const list: BandWithRole[] = (rows ?? []).map(norm).filter(Boolean);
        // Optional: warn on weird roles
        list.forEach((b) => {
          if (!['admin', 'editor', 'member'].includes(b.role)) {
            console.warn('[weird role]', b);
          }
        });

        // // const list: BandWithRole[] = (rows ?? [])
        //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
        //   .map((r: any) =>
        //     r?.bands
        //       ? {
        //           id: r.bands.id as string,
        //           name: r.bands.name as string,
        //           role: r.role as MembershipRole,
        //         }
        //       : null
        //   )
        //   .filter((b): b is BandWithRole => b !== null);

        if (mounted) setBands(list);
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

    const list: BandWithRole[] = (rows ?? [])

      .map((r: any) =>
        r?.bands
          ? {
              id: r.bands.id as string,
              name: r.bands.name as string,
              role: r.role as MembershipRole,
            }
          : null
      )
      .filter((b): b is BandWithRole => b !== null);

    setBands(list);
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
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
          Welcome, {greetingName}
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
        <Box sx={gridSx}>
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : bands.length === 0 ? (
        <EmptyStateStartBand onCreate={() => setCreateOpen(true)} />
      ) : (
        <Box sx={gridSx}>
          {isMdUp && <AddBandTile onClick={() => setCreateOpen(true)} />}
          {bands.map((b) => (
            <BandCard key={b.id} id={b.id} name={b.name} bandRole={b.role} />
          ))}
        </Box>
      )}

      {/* This piece changes the add band button to a Fab on small screens*/}
      {!isMdUp && bands.length > 0 && !loading && (
        <Fab
          color="primary"
          aria-label="Create band"
          onClick={() => setCreateOpen(true)}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            zIndex: (t) => t.zIndex.fab,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create band dialog */}
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
