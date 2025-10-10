// src/app/api/bands/[id]/invite/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BodyIn = {
  email?: string;
  band_role?: 'member' | 'admin'; // preferred
  role?: 'member' | 'admin'; // legacy alias; we normalize to band_role
  bandName?: string;
};

async function getBandId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

export async function POST(req: NextRequest, ctx: { params: any }) {
  try {
    const bandId = await getBandId(ctx);

    // Parse & normalize body
    const raw = (await req.json()) as BodyIn;
    const email = raw.email?.trim().toLowerCase();
    const band_role = (raw.band_role ?? raw.role)?.toLowerCase() as
      | 'member'
      | 'admin'
      | undefined;
    const bandName = raw.bandName?.toString();

    if (!email || !band_role) {
      return NextResponse.json(
        { error: 'email and band_role are required' },
        { status: 400 }
      );
    }

    // Caller JWT so RLS enforces is_band_admin etc.
    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const supabaseRls = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Insert or update pending invite; column is `band_role`
    let token: string | null = null;

    const insertRes = await supabaseRls
      .from('band_invitations')
      .insert([{ band_id: bandId, email, band_role, status: 'pending' }])
      .select('token')
      .single();

    if (insertRes.error) {
      if ((insertRes.error as any).code === '23505') {
        const updRes = await supabaseRls
          .from('band_invitations')
          .update({ band_role })
          .eq('band_id', bandId)
          .eq('email', email)
          .eq('status', 'pending')
          .select('token')
          .maybeSingle();

        if (updRes.error) {
          return NextResponse.json(
            { error: updRes.error.message },
            { status: 400 }
          );
        }
        token = updRes.data?.token ?? null;
      } else {
        return NextResponse.json(
          {
            error: insertRes.error.message,
            details: insertRes.error.details,
            code: (insertRes.error as any).code,
          },
          { status: 400 }
        );
      }
    } else {
      token = insertRes.data?.token ?? null;
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to create invite token' },
        { status: 400 }
      );
    }

    // Accept URL shown in email
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_URL ??
      'http://localhost:3000';
    const site = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const acceptUrl = `${site}/auth/callback?invite=${encodeURIComponent(
      token
    )}`;

    // Send email via Edge Function (service role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const invokeRes = await supabaseAdmin.functions.invoke('send-invite', {
      body: { to: email, acceptUrl, bandName },
    });
    if (invokeRes.error) {
      return NextResponse.json(
        { error: invokeRes.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, token, acceptUrl, band_role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || 'Invite failed' },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest, ctx: { params: any }) {
  const bandId = await getBandId(ctx);
  return NextResponse.json({ ok: true, bandId });
}
