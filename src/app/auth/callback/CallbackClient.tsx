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

      // inside your useEffect run() just before you process/accept the invite:
      const invite = search.get('invite');

      if (invite) {
        // 0) preview the invite (no mutation)
        const metaRes = await fetch(
          `/api/bands/accept-invite?token=${encodeURIComponent(invite)}`
        );
        if (!metaRes.ok) {
          // invalid / consumed -> show error and bail to dashboard or login
          if (mounted) setError('This invite link is invalid or already used.');
          return;
        }
        const meta = await metaRes.json(); // { ok:true, invite: { email, band_id, band_role, status } }
        const inviteEmail = meta?.invite?.email?.toLowerCase?.();

        // 1) check session
        const supabase = supabaseBrowser();
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData?.session?.user?.email?.toLowerCase?.();

        if (!sessionData?.session) {
          // not logged in → go to login with email prefilled and return here afterward
          router.replace(
            `/login?email=${encodeURIComponent(
              inviteEmail
            )}&next=${encodeURIComponent(`/auth/callback?invite=${invite}`)}`
          );
          return;
        }

        if (inviteEmail && userEmail && inviteEmail !== userEmail) {
          // logged in as someone else → sign out then go to login prefilled
          await supabase.auth.signOut();
          router.replace(
            `/login?email=${encodeURIComponent(
              inviteEmail
            )}&next=${encodeURIComponent(`/auth/callback?invite=${invite}`)}`
          );
          return;
        }

        // 2) session email matches invite → accept it
        const res = await fetch(
          `/api/bands/accept-invite?token=${encodeURIComponent(invite)}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          }
        );
        if (!res.ok) {
          const body = await res.text();
          if (mounted) setError(body || 'Invite acceptance failed');
          return;
        }
      }

      // 2) Process invite if present

      if (invite) {
        try {
          // We already fetched the session above; grab the token:
          // CallbackClient.tsx (inside the `if (invite) { ... }`)
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;

          const res = await fetch(
            `/api/bands/accept-invite?token=${encodeURIComponent(invite)}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`, // <-- important
              },
            }
          );
          if (!res.ok) throw new Error(await res.text());
        } catch (err: unknown) {
          if (mounted) {
            const msg =
              err instanceof Error ? err.message : 'Invite acceptance failed';
            setError(msg);
          }
          // let the rest of the flow continue (user may still proceed)
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
        .from('profiles')
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
