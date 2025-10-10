import InviteClient from './InviteClient';

export default function InvitePage({ params }: { params: { token: string } }) {
  return <InviteClient token={params.token} />;
}
