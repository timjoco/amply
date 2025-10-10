/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/bands/accept-invite/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token)
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) find invite by token
    const { data: invite, error: invErr } = await admin
      .from('band_invitations')
      .select('token, band_id, email, role, status')
      .eq('token', token)
      .maybeSingle();

    if (invErr)
      return NextResponse.json({ error: invErr.message }, { status: 400 });
    if (!invite || invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invalid or expired invite token' },
        { status: 400 }
      );
    }

    // 2) get current user (via caller’s Authorization header)
    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader)
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );

    const rls = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userRes, error: uErr } = await rls.auth.getUser();
    if (uErr || !userRes?.user) {
      return NextResponse.json(
        { error: uErr?.message || 'No user' },
        { status: 401 }
      );
    }

    // Optional: enforce the invite email matches the logged-in email
    const userEmail = (userRes.user.email || '').toLowerCase();
    const inviteEmail = (invite.email || '').toLowerCase();
    if (inviteEmail && inviteEmail !== userEmail) {
      return NextResponse.json(
        {
          error: `Invite email does not match logged-in user (invite: ${inviteEmail}, user: ${userEmail})`,
        },
        { status: 400 }
      );
    }

    // 3) ensure FK target exists (if band_memberships.user_id references public.users)
    await admin
      .from('users')
      .upsert({ id: userRes.user.id, email: userEmail }, { onConflict: 'id' });

    // 4) insert membership (map role -> band_role)
    const { error: memErr } = await admin.from('band_memberships').insert([
      {
        band_id: invite.band_id,
        user_id: userRes.user.id,
        band_role: invite.role as 'member' | 'admin',
      },
    ]);
    if (memErr)
      return NextResponse.json({ error: memErr.message }, { status: 400 });

    // 5) mark invitation accepted
    await admin
      .from('band_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('token', token);

    return NextResponse.json({ ok: true, bandId: invite.band_id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
