'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
  alpha,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsDialog() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const snapFocusToHome = () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const home = document.getElementById('nav-home') as HTMLElement | null;
    home?.focus();
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      snapFocusToHome();
      router.push('/dashboard');
    }, 120);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (isMounted) setEmail(data.user?.email ?? '');
      } catch (err) {
        console.error('Failed to load user', err);
        if (isMounted) {
          setToast({
            open: true,
            message: 'Could not load account info',
            severity: 'error',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setToast({ open: true, message: 'Signed out', severity: 'success' });

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 200);
    } catch (err) {
      console.error('Sign-out error', err);
      setToast({ open: true, message: 'Sign out failed', severity: 'error' });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="md"
      fullScreen
      disableRestoreFocus
      PaperProps={{
        sx: {
          backgroundColor: 'background.default',
        },
      }}
    >
      <AppBar
        position="relative"
        color="transparent"
        elevation={0}
        sx={(t) => ({
          borderBottom: '1px solid',
          borderColor: alpha(t.palette.primary.main, 0.18),
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(8px)',
        })}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
            User Settings
          </Typography>
          <IconButton edge="end" aria-label="close" onClick={close}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0 }}>
        <Container
          maxWidth="md"
          sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Typography variant="h5" fontWeight={700} letterSpacing={0.3}>
              User Settings
            </Typography>
            <Box />
          </Stack>

          {/* Account (glass) */}
          <Paper variant="glass" sx={{ mb: 3 }}>
            <Stack sx={{ p: { xs: 2, md: 3 } }} spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Account
              </Typography>

              {loading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={18} />
                  <Typography variant="body2">Loading account…</Typography>
                </Stack>
              ) : (
                <>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Signed in as
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {email || '—'}
                    </Typography>
                  </Stack>

                  <Divider
                    sx={{
                      my: 1.5,
                      borderColor: (t) => alpha(t.palette.primary.main, 0.18),
                    }}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={handleLogout}
                      disabled={signingOut}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 3,
                      }}
                    >
                      {signingOut ? 'Signing out…' : 'Log out'}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>

          <Paper variant="glass">
            <Stack sx={{ p: { xs: 2, md: 3 } }} spacing={1}>
              <Typography variant="h6" fontWeight={700}>
                Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary">
                (Optional) Place theme, notifications, and other preferences
                here.
              </Typography>
            </Stack>
          </Paper>

          <Snackbar
            open={toast.open}
            autoHideDuration={2000}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setToast((t) => ({ ...t, open: false }))}
              severity={toast.severity}
              variant="filled"
              sx={{ width: '100%', borderRadius: 2 }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        </Container>
      </DialogContent>
    </Dialog>
  );
}
