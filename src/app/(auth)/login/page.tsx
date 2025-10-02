'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
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

type Status = 'idle' | 'sending' | 'sent' | 'error';

function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    } catch {
      // ignore and fall through
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

export default function LoginPage() {
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');

  const origin = useMemo(() => getAppOrigin(), []);

  const validateEmail = useCallback((val: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    setEmailError(ok ? '' : 'Enter a valid email address');
    return ok;
  }, []);

  const onChangeEmail = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setEmail(val);
      if (status !== 'idle') validateEmail(val);
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

        // Read invite ONLY at submit time (no useSearchParams needed)
        const invite =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('invite')
            : null;

        const redirectTo = `${origin}/auth/callback${
          invite ? `?invite=${encodeURIComponent(invite)}` : ''
        }`;

        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });

        if (error) throw error;
        setStatus('sent');
        setMessage(
          'Check your inbox for a login link. You can request another in ~60 seconds.'
        );
      } catch (err: unknown) {
        const fallback = 'Something went wrong sending your link.';
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
            ? err
            : fallback;
        setStatus('error');
        setMessage(msg);
      }
    },
    [email, origin, validateEmail]
  );

  const isSending = status === 'sending';

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
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
