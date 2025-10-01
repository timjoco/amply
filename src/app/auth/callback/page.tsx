'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      const supabase = supabaseBrowser();

      // Ensure session is finalized after magic link redirect
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) {
        if (isMounted) setError(sessionErr.message);
        return;
      }

      // Accept invite if present (optional)
      const invite = search.get('invite');
      if (invite) {
        try {
          const res = await fetch(
            `/api/bands/accept-invite?token=${encodeURIComponent(invite)}`,
            {
              method: 'POST',
            }
          );
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Failed to accept invite');
          }
        } catch (e: unknown) {
          const msg =
            e instanceof Error ? e.message : 'Invite acceptance failed';
          if (isMounted) setError(msg);
          // continue; user is still logged in
        }
      }

      // Route depending on membership
      try {
        const { data: bands, error: bandErr } = await supabase
          .from('bands_members')
          .select('band_id')
          .limit(1);

        if (bandErr) throw bandErr;

        if (!bands || bands.length === 0) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      } catch (e: unknown) {
        const msg =
          (e as PostgrestError)?.message ??
          (e instanceof Error ? e.message : 'Post-login routing failed');
        if (isMounted) setError(msg);
      }
    };

    void run();
    return () => {
      isMounted = false;
    };
  }, [router, search]);

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold mb-2">Login error</h1>
        <p className="text-sm text-red-600">{error}</p>
        <button
          className="mt-4 rounded-xl bg-black text-white p-3"
          onClick={() => window.location.assign('/login')}
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <p className="text-sm text-gray-600">Signing you in…</p>
    </div>
  );
}
