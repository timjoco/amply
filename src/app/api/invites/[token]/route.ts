// src/app/api/invites/[token]/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> } // <- Promise here
) {
  const { token } = await context.params; // <- and await here
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('band_invitations')
    .select('token, band_id, email, band_role, status')
    .eq('token', token)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data)
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

  return NextResponse.json({ ok: true, invite: data });
}
