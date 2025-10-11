'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Link,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

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

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (isMounted) {
          setEmail(data.user?.email ?? '');
        }
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
    };

    loadUser();
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
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={700} letterSpacing={0.3}>
          Settings
        </Typography>
        <Button component={Link} href="/dashboard" variant="text" size="small">
          Back to Dashboard
        </Button>
      </Stack>

      <Card
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 3,
          mb: 3,
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Account
          </Typography>

          {loading ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading account…</Typography>
            </Stack>
          ) : (
            <>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Signed in as
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {email || '—'}
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleLogout}
                  disabled={signingOut}
                >
                  {signingOut ? 'Signing out…' : 'Log out'}
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            (Optional) Place theme, notifications, and other preferences here.
          </Typography>
        </CardContent>
      </Card>

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
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
