'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type Band = { id: string; name: string };

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greetingName, setGreetingName] = useState('there');
  const [bands, setBands] = useState<Band[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [bandName, setBandName] = useState('');
  const [creating, setCreating] = useState(false);

  // Client-side guard: if user is not logged in, leave /dashboard
  useEffect(() => {
    const sb = supabaseBrowser();

    let active = true;
    (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!active) return;
      if (!user) {
        router.replace('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: profile, error: pErr } = await sb
          .from('users')
          .select('first_name, email, onboarded')
          .eq('id', user.id)
          .maybeSingle();
        if (pErr) throw pErr;

        if (!profile?.onboarded) {
          router.replace('/onboarding');
          return;
        }

        setGreetingName(profile.first_name || profile.email || 'there');

        const { data: rows, error: mErr } = await sb
          .from('band_memberships')
          .select('bands(id, name)')
          .eq('user_id', user.id);
        if (mErr) throw mErr;

        const list: Band[] = (rows || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r.bands)
          .filter(Boolean);
        setBands(list);
      } catch (e: unknown) {
        console.error(e);
        setError(getErrorMessage(e) || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) router.replace('/');
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  const refreshBands = useCallback(async () => {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    const q = sb.from('band_memberships').select('bands(id, name)');
    const { data: rows } = user ? await q.eq('user_id', user.id) : await q;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: Band[] = (rows || []).map((r: any) => r.bands).filter(Boolean);
    setBands(list);
  }, []);

  const createBand = useCallback(async () => {
    if (!bandName.trim()) return;
    try {
      setCreating(true);
      const sb = supabaseBrowser();
      const { error } = await sb.rpc('create_band', {
        p_name: bandName.trim(),
      });
      if (error) throw error;

      setCreateOpen(false);
      setBandName('');
      await refreshBands();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Could not create band');
    } finally {
      setCreating(false);
    }
  }, [bandName, refreshBands]);

  return (
    <Box sx={{ minHeight: '100dvh', backgroundRepeat: 'no-repeat' }}>
      {/* Disable gutters to avoid double horizontal padding; App shell handles px */}
      <Container maxWidth="lg" disableGutters sx={{ py: 4 }}>
        <Stack spacing={1.5} sx={{ mb: 3, px: { xs: 2, md: 3 } }}>
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

        {(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            transition:
              'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 0 0 1px ${alpha(
                t.palette.primary.main,
                0.28
              )}, 0 14px 36px rgba(0,0,0,.45)`,
              borderColor: alpha(t.palette.primary.main, 0.36),
            },
          });

          if (loading) {
            return (
              <Grid container spacing={2.5} sx={{ px: { xs: 2, md: 3 } }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  // @ts-expect-error valid MUI Grid props
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card sx={cardSx}>
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
                  </Grid>
                ))}
              </Grid>
            );
          }

          if (bands.length === 0) {
            return (
              <Box sx={{ px: { xs: 2, md: 3 } }}>
                <Card sx={cardSx}>
                  <CardContent sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="h6">
                      Your dashboard is empty
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      Create your first band to get started.
                    </Typography>
                    <Button
                      sx={{ mt: 3, borderRadius: 999, px: 2.25 }}
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateOpen(true)}
                    >
                      Create Band
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            );
          }

          return (
            <Grid container spacing={2.5} sx={{ px: { xs: 2, md: 3 } }}>
              {bands.map((b) => (
                // @ts-expect-error valid MUI Grid props
                <Grid item xs={12} sm={6} md={4} key={b.id}>
                  <Card sx={cardSx}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ letterSpacing: 0.3 }}
                      >
                        {b.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage events, members, and settings for this band.
                      </Typography>
                    </CardContent>
                    <CardActions
                      sx={(t) => ({
                        borderTop: '1px solid',
                        borderColor: alpha(t.palette.primary.main, 0.12),
                        display: 'flex',
                        gap: 1,
                        px: 2,
                        py: 1.5,
                      })}
                    >
                      <Button
                        component={Link}
                        href={`/bands/${b.id}`}
                        endIcon={<OpenInNewIcon />}
                        sx={(t) => ({
                          borderRadius: 999,
                          textTransform: 'none',
                          px: 1.75,
                          border: '1px solid',
                          borderColor: alpha(t.palette.primary.main, 0.25),
                          backgroundColor: alpha('#7C3AED', 0.08),
                          '&:hover': {
                            backgroundColor: alpha('#7C3AED', 0.14),
                            borderColor: alpha(t.palette.primary.main, 0.4),
                          },
                        })}
                      >
                        Open
                      </Button>
                      <Button
                        component={Link}
                        href={`/bands/${b.id}/events/new`}
                        startIcon={<EventIcon />}
                        sx={(t) => ({
                          borderRadius: 999,
                          textTransform: 'none',
                          px: 1.75,
                          border: '1px solid',
                          borderColor: alpha(t.palette.primary.main, 0.25),
                          backgroundColor: alpha('#A855F7', 0.08),
                          '&:hover': {
                            backgroundColor: alpha('#A855F7', 0.14),
                            borderColor: alpha(t.palette.primary.main, 0.4),
                          },
                        })}
                      >
                        Add Event
                      </Button>
                      <IconButton
                        component={Link}
                        href={`/bands/${b.id}/settings`}
                        aria-label="settings"
                        sx={(t) => ({
                          ml: 'auto',
                          border: '1px solid',
                          borderColor: alpha(t.palette.primary.main, 0.25),
                          backgroundColor: alpha('#7C3AED', 0.06),
                          '&:hover': {
                            backgroundColor: alpha('#7C3AED', 0.12),
                            borderColor: alpha(t.palette.primary.main, 0.4),
                          },
                        })}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          );
        })()}
      </Container>

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
