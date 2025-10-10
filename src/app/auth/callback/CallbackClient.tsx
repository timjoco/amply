/* eslint-disable @typescript-eslint/no-explicit-any */
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
      const invite = search.get('invite') ?? undefined;

      // 1) Ensure we have (or get) a session early
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) {
        if (mounted) setError(sessionErr.message);
        return;
      }
      const session = sessionData?.session ?? null;

      // 2) If there is an invite, preview it first (GET /api/invites/[id])
      let inviteEmail: string | undefined;
      if (invite) {
        try {
          const metaRes = await fetch(
            `/api/invites/${encodeURIComponent(invite)}`,
            {
              method: 'GET',
            }
          );

          // Safely parse
          const metaCT = metaRes.headers.get('content-type') || '';
          const metaPayload = metaCT.includes('application/json')
            ? await metaRes.json()
            : await metaRes.text();

          if (!metaRes.ok) {
            const msg =
              typeof metaPayload === 'string'
                ? metaPayload
                : metaPayload?.error ??
                  'This invite link is invalid or already used.';
            if (mounted) setError(msg);
            return;
          }

          inviteEmail = (metaPayload?.invite?.email || '').toLowerCase();
        } catch (e: any) {
          if (mounted) setError(e?.message ?? 'Failed to load invite.');
          return;
        }
      }

      // 3) If we have an invite but no session, send to login prefilled, then bounce back here
      if (invite && !session) {
        router.replace(
          `/login?email=${encodeURIComponent(
            inviteEmail || ''
          )}&next=${encodeURIComponent(`/auth/callback?invite=${invite}`)}`
        );
        return;
      }

      // 4) If logged in under a different email than the invite, sign out and force correct login
      if (invite && session) {
        const userEmail = session.user?.email?.toLowerCase?.() || '';
        if (inviteEmail && userEmail && inviteEmail !== userEmail) {
          await supabase.auth.signOut();
          router.replace(
            `/login?email=${encodeURIComponent(
              inviteEmail
            )}&next=${encodeURIComponent(`/auth/callback?invite=${invite}`)}`
          );
          return;
        }
      }

      // 5) Accept the invite (POST /api/invites/[id]/accept) now that we’re logged in as the invitee
      if (invite && session) {
        try {
          const acceptRes = await fetch(
            `/api/invites/${encodeURIComponent(invite)}/accept`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          const ct = acceptRes.headers.get('content-type') || '';
          const payload = ct.includes('application/json')
            ? await acceptRes.json()
            : await acceptRes.text();

          if (!acceptRes.ok) {
            const msg =
              typeof payload === 'string'
                ? payload
                : payload?.error ??
                  `${acceptRes.status} ${acceptRes.statusText}`;
            throw new Error(msg);
          }
          // success, continue
        } catch (e: any) {
          if (mounted) setError(e?.message ?? 'Invite acceptance failed');
          return;
        }
      }

      // 6) Route based on profile.onboarded
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.replace('/login');
        return;
      }

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('onboarded')
        .maybeSingle();

      if (profErr) {
        // If profile read fails, default to dashboard (or show a gentle error)
        router.replace('/dashboard');
        return;
      }

      if (!profile || profile.onboarded === false) {
        router.replace('/onboarding');
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
