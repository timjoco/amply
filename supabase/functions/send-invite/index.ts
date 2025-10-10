// supabase/functions/send-invite/index.ts

// No imports needed. Runs on Deno (Supabase Edge Functions).

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('MAIL_FROM') ?? 'Amplee <noreply@amplee.app>';

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
        status: 500,
      });
    }

    const { to, acceptUrl, bandName } = await req.json();
    if (!to || !acceptUrl) {
      return new Response(JSON.stringify({ error: 'Missing to/acceptUrl' }), {
        status: 400,
      });
    }

    const subject = `You're invited to join ${bandName ?? 'a band'} on Amplee`;
    const html = `
      <p>You’ve been invited to join <b>${
        bandName ?? 'this band'
      }</b> on Amplee.</p>
      <p><a href="${acceptUrl}">Accept your invite</a> (expires in 7 days).</p>
      <p>If you didn’t expect this, you can ignore this email.</p>
    `;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: text }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg || 'send error' }), {
      status: 400,
    });
  }
});
