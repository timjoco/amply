// src/app/invite/[token]/page.tsx
import InviteAcceptClient from '../../api/invites/[token]/ui/InviteAcceptClient';
async function getInvite(token: string) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    }/api/invites/${token}`,
    {
      cache: 'no-store',
    }
  );
  return { ok: res.ok, data: res.ok ? await res.json() : await res.json() };
}

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const { ok, data } = await getInvite(params.token);

  return (
    <InviteAcceptClient
      token={params.token}
      invite={ok ? data : null}
      error={!ok ? data?.error ?? 'Invite not found' : null}
    />
  );
}
