import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token)
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  // Service role to bypass RLS for the final membership write
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Look up invite
  const { data: inv, error: invErr } = await supabase
    .from('band_invitations')
    .select('id, band_id, email, role, status, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (invErr)
    return NextResponse.json({ error: invErr.message }, { status: 400 });
  if (!inv || inv.status !== 'pending') {
    return NextResponse.json(
      { error: 'Invite invalid or already used' },
      { status: 400 }
    );
  }
  if (new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
  }

  // 2) Identify the currently authenticated user from the Authorization header (optional)
  // If you want to bind to the logged-in user email, you can pass user id or email in the body.
  // For simplicity, we’ll create membership by email match if such profile exists; otherwise, accept flow should happen after login.

  // Try to find a profile with this email
  const { data: prof } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', inv.email.toLowerCase())
    .maybeSingle();

  if (!prof?.id) {
    // no profile yet — leave invite pending; front-end should prompt login/signup via magic link
    return NextResponse.json({
      ok: true,
      pending: true,
      message: 'Ask user to sign in with invited email.',
    });
  }

  // 3) Upsert membership
  const { error: upErr } = await supabase
    .from('band_memberships')
    .upsert(
      { band_id: inv.band_id, user_id: prof.id, band_role: inv.role },
      { onConflict: 'band_id,user_id' }
    );
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 400 });

  // 4) Mark invite accepted
  const { error: accErr } = await supabase
    .from('band_invitations')
    .update({ status: 'accepted' })
    .eq('id', inv.id);
  if (accErr)
    return NextResponse.json({ error: accErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, bandId: inv.band_id });
}
