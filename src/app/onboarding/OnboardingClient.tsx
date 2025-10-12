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
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Props = { next?: string };

export default function OnboardingClient({ next = '/dashboard' }: Props) {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user + existing profile
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: uErr,
        } = await sb.auth.getUser();
        if (uErr) throw uErr;
        if (!user) {
          // not logged in — let the server page handle redirect on reload
          setError('Not authenticated. Please log in again.');
          return;
        }

        if (!active) return;
        setUserId(user.id);
        setEmail(user.email ?? null);

        try {
          const { error } = await sb.rpc('ensure_profile');
          if (error && error.code !== '42883') {
            console.warn('[ensure_profile] RPC error:', error.message);
          }
        } catch (e) {
          console.warn('[ensure_profile] call failed:', e);
        }
        const { data: profile, error: pErr } = await sb
          .from('profiles')
          .select('first_name, last_name, display_name, location, onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (pErr) throw pErr;

        // Prefill
        if (profile?.first_name) setFirstName(profile.first_name);
        else if (user.email) setFirstName(user.email.split('@')[0]); // decent default

        if (profile?.location) setLocation(profile.location);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [sb]);

  const submit = async () => {
    if (!userId) return;
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Upsert profile and mark onboarded
      const { error: upErr } = await sb.from('profiles').upsert(
        {
          id: userId,
          first_name: firstName.trim(),
          location: location.trim() || null,
          onboarded: true,
        },
        { onConflict: 'id' }
      );
      if (upErr) throw upErr;

      router.replace(next);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Failed to complete onboarding'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          backdropFilter: 'blur(6px)',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={700}>
              Finish setting up your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We’ll use this to personalize your experience.
            </Typography>
          </Stack>

          {loading ? (
            <Stack alignItems="center" spacing={1.5}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading your profile…
              </Typography>
            </Stack>
          ) : (
            <>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField label="Email" value={email ?? ''} disabled fullWidth />

              <TextField
                autoFocus
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                placeholder="e.g., Alex"
              />

              <TextField
                label="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                placeholder="City, State or City, Country"
              />

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.replace('/logout')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={submit}
                  disabled={saving || !firstName.trim()}
                  startIcon={saving ? <CircularProgress size={18} /> : null}
                >
                  {saving ? 'Saving…' : 'Complete'}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
