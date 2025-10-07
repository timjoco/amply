// FILE: /app/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Alert,
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Amplee
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create Band
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Welcome, {greetingName}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>

        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, i) => (
              // @ts-expect-error -- MUI Grid typing quirk in TS: these item/breakpoint props are valid at runtime
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={30} />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" width={100} height={36} />
                    <Skeleton variant="rectangular" width={120} height={36} />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : bands.length === 0 ? (
          <Card sx={{ py: 6, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h6">Your dashboard is empty</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Create your first band to get started.
              </Typography>
              <Button
                sx={{ mt: 3 }}
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
              >
                Create Band
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {bands.map((b) => (
              // @ts-expect-error -- MUI Grid typing quirk in TS: these item/breakpoint props are valid at runtime
              <Grid item xs={12} sm={6} md={4} key={b.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {b.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage events, members, and settings for this band.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      component={Link}
                      href={`/bands/${b.id}`}
                      endIcon={<OpenInNewIcon />}
                    >
                      Open
                    </Button>
                    <Button
                      component={Link}
                      href={`/bands/${b.id}/events/new`}
                      startIcon={<EventIcon />}
                    >
                      Add Event
                    </Button>
                    <IconButton
                      component={Link}
                      href={`/bands/${b.id}/settings`}
                      aria-label="settings"
                    >
                      <SettingsIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create band</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Band name"
            fullWidth
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createBand}
            disabled={creating || !bandName.trim()}
            startIcon={creating ? <CircularProgress size={18} /> : <AddIcon />}
          >
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
