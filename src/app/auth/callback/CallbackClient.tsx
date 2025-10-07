'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CallbackClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const supabase = supabaseBrowser();

      // 1) Check for session
      const { data, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        if (mounted) setError(sessionErr.message);
        return;
      }
      if (!data.session) {
        if (mounted)
          setError('No active session found. Please try the link again.');
        return;
      }

      // 2) Process invite if present
      const invite = search.get('invite');
      if (invite) {
        try {
          const res = await fetch(
            `/api/bands/accept-invite?token=${encodeURIComponent(invite)}`,
            {
              method: 'POST',
            }
          );
          if (!res.ok) throw new Error(await res.text());
        } catch (err: unknown) {
          if (mounted) {
            const msg =
              err instanceof Error
                ? err.message
                : typeof err === 'string'
                ? err
                : 'Invite acceptance failed';
            setError(msg);
          }
          // continue anyway
        }
      }

      // 3) Route based on membership
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
      }

      const { data: profile } = await supabase
        .from('users')
        .select('onboarded')
        .maybeSingle();

      if (!profile || profile.onboarded === false) {
        router.replace('/onboarding'); // collect name + location
      } else {
        router.replace('/dashboard');
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [router, search]);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Login error
            </Typography>
            <Alert severity="error">{error}</Alert>
            <Box>
              <Button
                variant="contained"
                onClick={() => window.location.assign('/login')}
              >
                Back to login
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="h6" fontWeight={600}>
            Signing you in…
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This only takes a moment.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
