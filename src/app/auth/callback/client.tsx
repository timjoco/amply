'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';
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

      // With implicit flow, Supabase processes the #access_token automatically
      // thanks to detectSessionInUrl: true. Just fetch the session:
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

      // Optional: accept invite token
      const invite = search.get('invite');
      if (invite) {
        try {
          const res = await fetch(
            `/api/bands/accept-invite?token=${encodeURIComponent(invite)}`,
            {
              method: 'POST',
            }
          );
          if (!res.ok) throw new Error(await res.text());
        } catch (e) {
          if (mounted)
            setError(
              e instanceof Error ? e.message : 'Invite acceptance failed'
            );
          // continue anyway
        }
      }

      // Route based on membership
      const { data: bands, error: bandErr } = await supabase
        .from('band_memberships') // ← your actual table name
        .select('band_id')
        .limit(1);

      if (bandErr) {
        if (mounted) setError((bandErr as PostgrestError).message);
        return;
      }

      router.replace(!bands?.length ? '/onboarding' : '/dashboard');
    };

    void run();
    return () => {
      mounted = false;
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

  return <div className="mx-auto max-w-md p-6">Signing you in…</div>;
}
