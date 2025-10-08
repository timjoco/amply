'use client';

export const dynamic = 'force-dynamic';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Alert,
  alpha,
  AppBar,
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
  Toolbar,
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

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greetingName, setGreetingName] = useState('there');
  const [bands, setBands] = useState<Band[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [bandName, setBandName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Create client in the browser (not at module scope)
        const supabase = supabaseBrowser();

        // Session check
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          router.replace('/login');
          return;
        }

        // Onboarding guard
        const { data: profile, error: pErr } = await supabase
          .from('users')
          .select('first_name, email, onboarded')
          .maybeSingle();
        if (pErr) throw pErr;
        if (!profile?.onboarded) {
          router.replace('/onboarding');
          return;
        }

        if (mounted)
          setGreetingName(profile.first_name || profile.email || 'there');

        // Load bands via memberships (no slug dependency)
        const { data: rows, error: mErr } = await supabase
          .from('band_memberships')
          .select('bands(id, name)')
          .eq('user_id', userData.user.id);
        if (mErr) throw mErr;

        const list: Band[] = (rows || [])
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          .map((r: any) => r.bands)
          .filter(Boolean);
        if (mounted) setBands(list);
      } catch (e: unknown) {
        console.error(e);
        if (mounted) setError(getErrorMessage(e) || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const refreshBands = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data: rows } = await supabase
      .from('band_memberships')
      .select('bands(id, name)');
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const list: Band[] = (rows || []).map((r: any) => r.bands).filter(Boolean);
    setBands(list);
  }, []);

  const createBand = useCallback(async () => {
    if (!bandName.trim()) return;
    try {
      setCreating(true);
      const supabase = supabaseBrowser();
      const { error } = await supabase.rpc('create_band', {
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
    <Box
      sx={() => ({
        minHeight: '100vh',
        // black base + subtle purple glows
        background:
          'radial-gradient(600px 400px at 0% 0%, rgba(168,85,247,0.10), transparent 50%),' +
          'radial-gradient(600px 400px at 100% 0%, rgba(124,58,237,0.08), transparent 50%),' +
          'linear-gradient(#0B0B10, #0B0B10)',
      })}
    >
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={(t) => ({
          borderBottom: '1px solid',
          borderColor: alpha(t.palette.primary.main, 0.22),
          backdropFilter: 'blur(8px)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))',
        })}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, letterSpacing: 0.5 }}>
            Amplee
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<AddIcon />}
            sx={(t) => ({
              borderRadius: 999,
              px: 2.25,
              textTransform: 'none',
              boxShadow: `0 0 0 1px ${alpha(
                t.palette.primary.main,
                0.35
              )}, 0 10px 24px rgba(0,0,0,.35)`,
              backgroundImage:
                'linear-gradient(90deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)',
              backgroundSize: '200% 100%',
              transition: 'background-position .35s ease, transform .2s ease',
              '&:hover': {
                backgroundPosition: '100% 0',
                transform: 'translateY(-1px)',
              },
            })}
          >
            Create Band
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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

        {/* shared card style */}
        {(() => {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
              <Grid container spacing={2.5}>
                {Array.from({ length: 4 }).map((_, i) => (
                  // @ts-expect-error -- MUI Grid typing quirk: runtime props are valid
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
              <Card sx={cardSx}>
                <CardContent sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="h6">Your dashboard is empty</Typography>
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
            );
          }

          return (
            <Grid container spacing={2.5}>
              {bands.map((b) => (
                // @ts-expect-error -- MUI Grid typing quirk: runtime props are valid
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
