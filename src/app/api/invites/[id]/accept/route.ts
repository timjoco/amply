// src/app/api/invites/[id]/accept/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// tiny helper that works with Next's promise/obj params
async function getParamId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

function isUuidLike(s: string) {
  // allow plain UUID; if your tokens are not UUIDs, relax this check
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

export async function POST(req: NextRequest, ctx: { params: any }) {
  try {
    // 0) token from route param
    const token = await getParamId(ctx);
    if (!token) {
      return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });
    }
    if (!isUuidLike(token)) {
      return NextResponse.json(
        { error: 'Invite id is not a valid UUID' },
        { status: 400 }
      );
    }

    // 1) require caller auth (we’ll read user id/email from their JWT)
    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    // client bound to caller (RLS-aware) — used to read user info
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userInfo, error: userErr } =
      await supabaseUser.auth.getUser();
    if (userErr || !userInfo?.user) {
      return NextResponse.json(
        { error: userErr?.message || 'Not authenticated' },
        { status: 401 }
      );
    }
    const authedUserId = userInfo.user.id;
    const authedEmail = userInfo.user.email?.toLowerCase() || null;

    // 2) admin client (service role) — used to read invite + write membership atomically
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2a) fetch invite (must be pending)
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from('band_invitations')
      .select('token, status, band_id, band_role, email')
      .eq('token', token)
      .maybeSingle();

    if (inviteErr) {
      return NextResponse.json(
        { error: `invite lookup failed: ${inviteErr.message}` },
        { status: 400 }
      );
    }
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invite is not pending' },
        { status: 400 }
      );
    }
    if (!invite.band_id || !isUuidLike(invite.band_id)) {
      // This is the classic cause of your error — guard it.
      return NextResponse.json(
        { error: 'Invite has invalid band_id' },
        { status: 400 }
      );
    }

    // 2b) optional safety: the logged-in user must match the invite email (if present)
    if (
      invite.email &&
      authedEmail &&
      invite.email.toLowerCase() !== authedEmail
    ) {
      return NextResponse.json(
        {
          error: `Invite email (${invite.email}) does not match logged-in user (${authedEmail}).`,
        },
        { status: 403 }
      );
    }

    // 3) upsert membership for this user + band
    // use service role but explicit user_id from the JWT to avoid RLS complexity
    const { error: upsertErr } = await supabaseAdmin
      .from('band_memberships')
      .upsert(
        {
          band_id: invite.band_id,
          user_id: authedUserId,
          band_role: invite.band_role ?? 'member',
        },
        { onConflict: 'band_id,user_id' }
      );
    if (upsertErr) {
      return NextResponse.json(
        { error: `membership upsert failed: ${upsertErr.message}` },
        { status: 400 }
      );
    }

    // 4) mark invite accepted
    const { error: updErr } = await supabaseAdmin
      .from('band_invitations')
      .update({ status: 'accepted' }) // if you have accepted_at column, add it here.
      .eq('token', token);
    if (updErr) {
      return NextResponse.json(
        { error: `failed to update invite: ${updErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      band_id: invite.band_id,
      band_role: invite.band_role ?? 'member',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
