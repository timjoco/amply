'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { getErrorMessage } from '@/utils/errors';
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function OnboardingPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        // read profile
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, location, onboarded')
          .maybeSingle();
        if (pErr) throw pErr;

        if (!mounted) return;

        if (!profile) {
          const { error: upErr } = await supabase
            .from('profiles')
            .upsert({ id: user.id, email: user.email }, { onConflict: 'id' });
          if (upErr) throw upErr;

          setFirstName('');
          setLastName('');
          setLocation('');
          setLoading(false);
          return;
        }

        if (profile.onboarded) {
          router.replace('/dashboard');
          return;
        }

        setFirstName(profile.first_name ?? '');
        setLastName(profile.first_name ?? '');
        setLocation(profile.location ?? '');
      } catch (e: unknown) {
        if (mounted)
          setError(getErrorMessage(e) || 'Failed to load onboarding');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  const doUpdate = useCallback(
    async (payload: {
      first_name?: string | null;
      last_name?: string | null;
      location?: string | null;
      onboarded?: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const { error: uErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);
      if (uErr) throw uErr;
      router.replace('/dashboard');
    },
    [supabase, router]
  );

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      await doUpdate({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        location: location.trim() || null,
        onboarded: true,
      });
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    try {
      setSaving(true);
      setError(null);
      await doUpdate({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        location: location.trim() || null,
        onboarded: true,
      });
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Could not skip');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Typography variant="h5" gutterBottom>
          Setting things up…
        </Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={1} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Welcome! Let’s set up your profile
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We just need your name and location.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!saving && firstName.trim() && lastName.trim()) void save();
          }}
        >
          <Stack spacing={3}>
            <TextField
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="name"
              fullWidth
              required
              disabled={saving}
            />
            <TextField
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="name"
              fullWidth
              required
              disabled={saving}
            />
            <TextField
              label="Location (city, state)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kansas City, MO"
              autoComplete="address-level2"
              fullWidth
              disabled={saving}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="text" onClick={skip} disabled={saving}>
                Skip
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving || !firstName.trim()}
                startIcon={saving ? <CircularProgress size={18} /> : undefined}
              >
                {saving ? 'Saving' : 'Finish'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
