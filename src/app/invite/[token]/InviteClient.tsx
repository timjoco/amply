'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type InvitePreview = {
  ok: boolean;
  token: string;
  bandId: string;
  email: string;
  band_role: 'member' | 'admin' | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  bandName?: string | null;
  inviterEmail?: string | null;
};

export default function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => supabaseBrowser(), []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const t = await res.text();
        if (mounted) {
          setError(t || 'Invite not found');
          setLoading(false);
        }
        return;
      }
      const data = (await res.json()) as InvitePreview;
      if (mounted) {
        setInvite(data);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const onContinue = async () => {
    setError(null);
    setLoading(true);

    // 1) Are we signed in?
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      // send to login with return url back to this invite page
      router.replace(
        `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`
      );
      return;
    }

    // 2) If email mismatch, show guard
    const sessionEmail = (data.session.user.email ?? '').toLowerCase();
    const inviteEmail = (invite?.email ?? '').toLowerCase();
    if (inviteEmail && sessionEmail && inviteEmail !== sessionEmail) {
      setLoading(false);
      setError(
        `You are signed in as ${sessionEmail}, but this invite is for ${inviteEmail}. Sign out and sign in as the invited email.`
      );
      return;
    }

    // 3) Accept
    const res = await fetch(
      `/api/invites/${encodeURIComponent(token)}/accept`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    if (!res.ok) {
      const t = await res.text();
      setLoading(false);
      setError(t || 'Failed to accept invite');
      return;
    }
    const { bandId } = await res.json();

    // 4) Decide where to go: minimal invite onboarding if needed
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      router.replace('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('user_id', userRes.user.id)
      .maybeSingle();

    if (!profile || profile.onboarded === false) {
      router.replace(`/onboarding/invite?bandId=${encodeURIComponent(bandId)}`);
    } else {
      router.replace(`/bands/${encodeURIComponent(bandId)}`);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading invite…</div>;
  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 560 }}>
        <h2>Invite problem</h2>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={() => router.replace('/login')}>Go to login</button>
      </div>
    );
  }
  if (!invite) return null;

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1>Join {invite.bandName || 'this band'}</h1>
      <p>
        You were invited{' '}
        {invite.inviterEmail ? `by ${invite.inviterEmail}` : ''} to join as{' '}
        <b>{invite.band_role ?? 'member'}</b>.
      </p>
      {invite.status !== 'pending' ? (
        <p style={{ color: 'crimson' }}>
          This invite is <b>{invite.status}</b>.
        </p>
      ) : (
        <button onClick={onContinue}>Continue</button>
      )}
    </div>
  );
}
