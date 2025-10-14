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

type Status = 'idle' | 'sending' | 'sent' | 'verifying' | 'error';

function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    } catch {}
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');

  const origin = useMemo(() => getAppOrigin(), []);

  const validateEmail = useCallback((val: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    setEmailError(ok ? '' : 'Enter a valid email address');
    return ok;
  }, []);

  const validateCode = useCallback((val: string) => {
    const ok = /^\d{6}$/.test(val.trim());
    setCodeError(ok ? '' : 'Enter the 6-digit code');
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

  const onSubmitEmail = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email)) return;

      setStatus('sending');
      try {
        const supabase = supabaseBrowser();

        const invite =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('invite')
            : null;

        const redirectTo = `${origin}/auth/callback${
          invite ? `?invite=${encodeURIComponent(invite)}` : ''
        }`;

        // This sends BOTH a magic link and a 6-digit OTP code via email.
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;

        setStatus('sent');
        setMessage('We emailed you a login link and a 6-digit code.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(
          getErrorMessage(err) || 'Something went wrong sending your code.'
        );
      }
    },
    [email, origin, validateEmail]
  );

  const onVerifyCode = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email) || !validateCode(code)) return;

      setStatus('verifying');
      try {
        const supabase = supabaseBrowser();
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'email',
        });
        if (error) throw error;

        const params =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
        const invite = params?.get('invite');
        const next = params?.get('next') ?? '/dashboard';

        const dest = invite
          ? `${next}?invite=${encodeURIComponent(invite)}`
          : next;
        window.location.assign(dest);
      } catch (err: unknown) {
        setStatus('error');
        setMessage(getErrorMessage(err) || 'Invalid or expired code.');
      }
    },
    [email, code, validateEmail, validateCode]
  );

  const resend = useCallback(async () => {
    if (!validateEmail(email)) return;
    try {
      setStatus('sending');
      setMessage('');
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        // you can omit redirect here for pure OTP if you like
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus('sent');
      setMessage('Code resent. Check your email.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(getErrorMessage(err) || 'Could not resend code.');
    }
  }, [email, origin, validateEmail]);

  const changeEmail = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setCode('');
  }, []);

  const isSending = status === 'sending';
  const isVerifying = status === 'verifying';
  const showCodeStep =
    status === 'sent' ||
    status === 'verifying' ||
    (status === 'error' && code.length > 0);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Log in to Amplee
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email and we’ll send a 6-digit code
            </Typography>
          </Box>

          {!!message && (
            <Alert
              severity={status === 'error' ? 'error' : 'success'}
              role="status"
            >
              {message}
            </Alert>
          )}

          {/* Step 1: request code */}
          {!showCodeStep && (
            <Box component="form" noValidate onSubmit={onSubmitEmail}>
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
                  {isSending ? 'Sending…' : 'Send Code'}
                </Button>
              </Stack>
            </Box>
          )}

          {/* Step 2: verify code (one-tab) */}
          {showCodeStep && (
            <Box component="form" noValidate onSubmit={onVerifyCode}>
              <Stack spacing={2}>
                <TextField
                  name="code"
                  label="6-digit code"
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(v);
                    if (status === 'error') setMessage('');
                    if (v.length === 6) setCodeError('');
                  }}
                  onBlur={() => validateCode(code)}
                  error={!!codeError}
                  helperText={codeError || ' '}
                  autoComplete="one-time-code"
                  fullWidth
                  required
                  disabled={isVerifying}
                  type="tel"
                />
                <Button
                  type="submit"
                  size="large"
                  variant="contained"
                  fullWidth
                  disabled={isVerifying || code.length !== 6}
                  aria-busy={isVerifying ? 'true' : undefined}
                  startIcon={
                    isVerifying ? <CircularProgress size={20} /> : undefined
                  }
                >
                  {isVerifying ? 'Verifying…' : 'Verify & Continue'}
                </Button>

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="space-between"
                >
                  <Button onClick={changeEmail}>Change email</Button>
                  <Button onClick={resend}>Resend code</Button>
                </Stack>
              </Stack>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Didn’t get it? Check spam, or try again in about a minute.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
