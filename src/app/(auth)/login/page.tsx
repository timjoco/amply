'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
// If you use @mui/lab, you can swap Button for LoadingButton for nicer UX
// import { LoadingButton } from '@mui/lab';

type Status = 'idle' | 'sending' | 'sent' | 'error';

function getAppOrigin(): string {
  // Prefer explicit public URL; fall back to window in the browser.
  // new URL().origin normalizes trailing slashes.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    } catch {
      // ignore and fall through
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  // SSR fallback (won't actually be used on this page since it's a client component)
  return 'http://localhost:3000';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');

  const searchParams = useSearchParams();
  const invite = searchParams.get('invite');

  const redirectTo = useMemo(() => {
    const origin = getAppOrigin();
    const qs = invite ? `?invite=${encodeURIComponent(invite)}` : '';
    return `${origin}/auth/callback${qs}`;
  }, [invite]);

  const validateEmail = useCallback((val: string) => {
    // Simple RFC5322-ish check; replace with zod/yup if you prefer
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    setEmailError(ok ? '' : 'Enter a valid email address');
    return ok;
  }, []);

  const onChangeEmail = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setEmail(val);
      if (status !== 'idle') {
        // Re-validate while user edits after an attempt
        validateEmail(val);
      }
    },
    [status, validateEmail]
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email)) return;

      setStatus('sending');
      try {
        const supabase = supabaseBrowser();

        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });

        if (error) throw error;
        setStatus('sent');
        setMessage(
          'Check your inbox for a login link. You can request another in ~60 seconds.'
        );
      } catch (err) {
        const fallback = 'Something went wrong sending your link.';
        const msg =
          (err as { message?: string })?.message?.toString() || fallback;
        setStatus('error');
        setMessage(msg);
      }
    },
    [email, redirectTo, validateEmail]
  );

  const isSending = status === 'sending';

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Log in to Amplee
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email and we’ll send a one-time magic link.
            </Typography>
          </Box>

          {status === 'error' && !!message && (
            <Alert severity="error" role="alert">
              {message}
            </Alert>
          )}
          {status === 'sent' && !!message && (
            <Alert severity="success" role="status">
              {message}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                type="email"
                name="email"
                label="Email"
                placeholder="you@band.com"
                value={email}
                onChange={onChangeEmail}
                onBlur={() => validateEmail(email)}
                error={!!emailError}
                helperText={emailError || ' '}
                autoComplete="email"
                fullWidth
                required
                disabled={isSending}
              />

              <Button
                type="submit"
                size="large"
                variant="contained"
                fullWidth
                disabled={isSending}
                aria-busy={isSending ? 'true' : undefined}
                startIcon={
                  isSending ? <CircularProgress size={20} /> : undefined
                }
              >
                {isSending ? 'Sending…' : 'Send Magic Link'}
              </Button>
              {/* If you use @mui/lab:
              <LoadingButton
                type="submit"
                size="large"
                variant="contained"
                fullWidth
                loading={isSending}
              >
                Send Magic Link
              </LoadingButton> */}
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Didn’t get it? Check spam, or try again in about a minute.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
