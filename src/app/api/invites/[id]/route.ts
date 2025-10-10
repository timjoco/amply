/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/invites/[id]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getParamId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

export async function GET(_req: NextRequest, ctx: { params: any }) {
  try {
    const token = await getParamId(ctx); // invite token
    if (!token) {
      return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Band invitations now store role in `band_role`
    const { data: invite, error } = await supabaseAdmin
      .from('band_invitations')
      .select('token, status, band_role, band_id, created_at, email')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `invite lookup failed: ${error.message}` },
        { status: 400 }
      );
    }
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      invite: {
        token: invite.token,
        status: invite.status,
        band_role: invite.band_role, // <- unified key
        band_id: invite.band_id,
        email: invite.email,
        created_at: invite.created_at,
        accepted: invite.status === 'accepted',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
