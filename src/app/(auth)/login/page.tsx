'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import type { AuthError } from '@supabase/supabase-js';
import type { FormEvent } from 'react';
import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const supabase = supabaseBrowser();

      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite');

      const origin =
        (process.env.NEXT_PUBLIC_APP_URL &&
          new URL(process.env.NEXT_PUBLIC_APP_URL).origin) ||
        window.location.origin;

      const redirectTo = `${origin}/auth/callback${
        invite ? `?invite=${encodeURIComponent(invite)}` : ''
      }`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;
      setStatus('sent');
      setMessage(
        'Check your email for a login link. You can request another in about 60 seconds.'
      );
    } catch (err: unknown) {
      const msg =
        (err as AuthError | Error)?.message ??
        'Something went wrong sending your link.';
      setStatus('error');
      setMessage(msg);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Log in to Amplee</h1>
      <p className="text-sm text-gray-600 mb-6">
        Enter your email and we’ll send a one-time login link.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="you@band.com"
          className="w-full rounded-xl border p-3"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-xl bg-black text-white p-3"
        >
          {status === 'sending' ? 'Sending…' : 'Send Magic Link'}
        </button>
      </form>

      {message && (
        <div className="mt-4 text-sm">
          {status === 'error' ? (
            <span className="text-red-600">{message}</span>
          ) : (
            message
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">
        Didn’t get it? Check spam, or try again in about a minute.
      </p>
    </div>
  );
}
