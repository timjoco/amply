/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type BodyIn = {
  email?: string;
  band_role?: 'member' | 'admin';
  role?: 'member' | 'admin'; // legacy input name
  bandName?: string;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Next 15 validation requires Promise here
) {
  try {
    const { id: bandId } = await context.params;

    // Parse and normalize body
    const raw = (await req.json()) as BodyIn;
    const email = raw.email?.trim().toLowerCase();
    const band_role = (raw.band_role ?? raw.role)?.toLowerCase() as
      | 'member'
      | 'admin'
      | undefined;

    if (!email || !band_role) {
      return NextResponse.json(
        { error: 'email and band_role are required' },
        { status: 400 }
      );
    }

    // Use caller JWT so RLS runs as the user
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

    // Insert/update invite to get token
    let token: string | null = null;

    const insertRes = await supabaseRls
      .from('band_invitations')
      .insert([
        {
          band_id: bandId,
          email,
          band_role, // <- column is band_role
          status: 'pending',
        },
      ])
      .select('token')
      .single();

    if (insertRes.error) {
      // 23505 unique_violation (e.g., unique (band_id,email,status))
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

    // Build accept URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_URL ??
      'http://localhost:3000';
    const site = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const acceptUrl = `${site}/auth/callback?invite=${encodeURIComponent(
      token
    )}`;

    // Send the email via Edge Function using service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
    );

    const invokeRes = await supabaseAdmin.functions.invoke('send-invite', {
      body: { to: email, acceptUrl, bandName: raw.bandName },
    });

    if (invokeRes.error) {
      // Surface function error details
      return NextResponse.json(
        { error: invokeRes.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, token, acceptUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || 'Invite failed' },
      { status: 400 }
    );
  }
}

// Simple ping
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({ ok: true, id });
}
