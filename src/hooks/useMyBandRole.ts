'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export type MembershipRole = 'admin' | 'member';
export function useMyBandRole(bandId: string) {
  const [role, setRole] = useState<MembershipRole | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const sb = supabaseBrowser();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: auth } = await sb.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) throw new Error('Not signed in');

        // 🔐 Fetch ONLY my membership row for this band
        const { data, error } = await sb
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', uid)
          .maybeSingle(); // returns null if not a member

        if (error) throw error;
        if (!mounted) return;

        const r = (data?.role ?? '').toString().trim().toLowerCase();
        setRole(
          r === 'admin' ? 'admin' : r === 'member' ? 'member' : undefined
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load role');
        setRole(undefined);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bandId]);

  return { role, loading, error };
}
