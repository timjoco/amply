/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/bands/[id]/invite/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type Body = { email: string; role: 'member' | 'admin'; bandName?: string };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Next 15: params is a Promise
) {
  try {
    const { id: bandId } = await context.params;
    const { email, role, bandName }: Body = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    // 1) Use caller's JWT so RLS runs
    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Supabase URL/anon key not configured' },
        { status: 500 }
      );
    }
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server' },
        { status: 500 }
      );
    }

    const supabaseRls = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 2) Insert or update invite to get token
    let token: string | null = null;

    const insertRes = await supabaseRls
      .from('band_invitations')
      .insert([
        {
          band_id: bandId,
          email: email.toLowerCase(),
          role,
          status: 'pending',
        },
      ])
      .select('token')
      .single();

    if (insertRes.error) {
      // 23505 => unique_violation (band_id, email, status)
      if ((insertRes.error as any).code === '23505') {
        const updRes = await supabaseRls
          .from('band_invitations')
          .update({ role })
          .eq('band_id', bandId)
          .eq('email', email.toLowerCase())
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

    // 3) Build accept URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_URL ??
      'http://localhost:3000';
    const site = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const acceptUrl = `${site}/auth/callback?invite=${encodeURIComponent(
      token
    )}`;

    // 4) Send email via Supabase Edge Function — no `status` in the type
    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
      /\/+$/,
      ''
    )}/functions/v1/send-invite`;

    const fnRes = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        // Service role lets you call a verify_jwt-protected function
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        // Some functions check for apikey too; harmless to include
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: email.toLowerCase(), acceptUrl, bandName }),
    });

    if (!fnRes.ok) {
      let text = '';
      try {
        // try to parse JSON error first
        const maybeJson = await fnRes.json();
        text =
          typeof maybeJson === 'string' ? maybeJson : JSON.stringify(maybeJson);
      } catch {
        // fallback to plain text
        text = await fnRes.text().catch(() => '');
      }

      return NextResponse.json(
        {
          error: 'send-invite failed',
          status: fnRes.status,
          statusText: fnRes.statusText,
          body: text,
        },
        { status: 400 }
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || 'Invite failed' },
      { status: 400 }
    );
  }
}

// Optional ping to test the route quickly
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({ ok: true, id });
}
