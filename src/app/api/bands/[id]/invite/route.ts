/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/bands/[id]/invite/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type Body = { email: string; role: 'member' | 'admin'; bandName?: string };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function required(name: string, val: string | undefined) {
  if (!val) throw new Error(`${name} is not set`);
  return val;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // App Router "params" can be a Promise
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

    // --- Env guards (fail fast with a clear 500) ---
    const SUPABASE_URL = required(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    const SUPABASE_ANON = required(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const SERVICE_ROLE = required(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // --- RLS: forward caller's JWT ---
    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const supabaseRls = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    // --- Insert (or upsert-role) invite to get token ---
    const lowerEmail = email.toLowerCase();

    const insertRes = await supabaseRls
      .from('band_invitations')
      .insert([{ band_id: bandId, email: lowerEmail, role, status: 'pending' }])
      .select('token')
      .single();

    let token: string | null = null;

    if (insertRes.error) {
      // Unique violation → update existing pending invite's role and return token
      if ((insertRes.error as any).code === '23505') {
        const updRes = await supabaseRls
          .from('band_invitations')
          .update({ role })
          .eq('band_id', bandId)
          .eq('email', lowerEmail)
          .eq('status', 'pending')
          .select('token')
          .maybeSingle();

        if (updRes.error) {
          console.error('invite:update error', updRes.error);
          return NextResponse.json(
            { error: updRes.error.message, code: (updRes.error as any).code },
            { status: 400 }
          );
        }
        token = updRes.data?.token ?? null;
      } else {
        console.error('invite:insert error', insertRes.error);
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

    // --- Build accept URL ---
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_URL ??
      'http://localhost:3000';
    const site = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const acceptUrl = `${site}/auth/callback?invite=${encodeURIComponent(
      token
    )}`;

    // --- Call Edge Function with SERVICE ROLE (works in dev & prod) ---
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabaseAdmin.functions.invoke(
      'send-invite',
      {
        body: { to: lowerEmail, acceptUrl, bandName },
      }
    );

    // If Deno function threw/returned non-2xx, `error` will be populated
    if (error) {
      // Try to pull more context (status, body) when available
      const status = (error as any).context?.response?.status;
      const statusText = (error as any).context?.response?.statusText;
      const bodyText = await (error as any).context?.response
        ?.text?.()
        .catch(() => undefined);

      console.error('send-invite.invoke error', {
        error,
        status,
        statusText,
        bodyText,
      });
      return NextResponse.json(
        {
          error: 'send-invite failed',
          status: status ?? 502,
          statusText: statusText ?? 'Bad Gateway',
          body: bodyText,
        },
        { status: status ?? 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      token,
      acceptUrl,
      function: data ?? null,
    });
  } catch (e) {
    console.error('invite route fatal', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Optional: quick ping to verify params shape
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({ ok: true, id });
}
