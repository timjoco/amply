/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/invite/[token]/ui/InviteAcceptClient.tsx
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type InviteInfo = {
  token: string;
  bandId: string;
  bandName: string;
  inviteeEmail: string;
  role: 'member' | 'admin';
  inviterName: string | null;
};

export default function InviteAcceptClient({
  token,
  invite,
  error,
}: {
  token: string;
  invite: InviteInfo | null;
  error: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(error);
  const [displayName, setDisplayName] = useState('');

  const handleAccept = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const supabase = supabaseBrowser();

      // 1) ensure session
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // redirect to login, then back here after login
        await supabase.auth.signOut(); // ensures a clean state
        // You can also use a dedicated login page that returns to this URL
        window.location.assign(
          `/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`
        );
        return;
      }

      // 2) Optional: upsert a minimal profile (display name) if you want
      if (displayName.trim()) {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes.user) {
          await supabase
            .from('profiles')
            .upsert(
              { id: userRes.user.id, display_name: displayName.trim() },
              { onConflict: 'id' }
            );
        }
      }

      // 3) Accept invite on the server
      const res = await fetch(
        `/api/bands/accept-invite?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Accept failed');
      }

      // 4) Route them: either to the band page or your normal onboarding if needed
      router.replace(`/bands/${invite?.bandId ?? ''}`);
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }, [router, token, displayName, invite?.bandId]);

  if (err) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Invitation</Typography>
            <Alert severity="error">{err}</Alert>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (!invite) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading invite…</Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Join {invite.bandName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {invite.inviterName
              ? `${invite.inviterName} invited you`
              : 'You were invited by a band admin'}
          </Typography>
          <Typography variant="body2">
            Invited as: <b>{invite.role}</b>
          </Typography>
          <Typography variant="body2">
            Invitation for: <b>{invite.inviteeEmail}</b>
          </Typography>

          {/* Optional: minimal capture so this stays separate from full onboarding */}
          <TextField
            label="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => router.replace('/login')}>
              Use a different account
            </Button>
            <Button variant="contained" onClick={handleAccept} disabled={busy}>
              {busy ? 'Accepting…' : 'Accept & Continue'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
