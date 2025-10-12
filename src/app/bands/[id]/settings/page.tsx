// app/bands/[id]/settings/page.tsx
import { Button, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server'; // your server helper
import DangerZone from './DangerZone';

export default async function BandSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Require auth
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr) {
    // If your helper can throw, you could surface a 500; redirect is friendlier.
    redirect('/login');
  }
  if (!user) redirect('/login');

  // Fetch band (readable by member or admin)
  const { data: band, error: bErr } = await supabase
    .from('bands')
    .select('id, name')
    .eq('id', params.id)
    .maybeSingle();

  if (bErr) notFound();
  if (!band) notFound();

  // Is the current user an admin of this band?
  // is_band_admin should return boolean
  const { data: adminFlag, error: aErr } = await supabase.rpc('is_band_admin', {
    p_band_id: params.id,
  });

  // If the RPC is missing or errors, default to false (member experience still works)
  const isAdmin = aErr ? false : Boolean(adminFlag);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={700} letterSpacing={0.3}>
          Band Settings
        </Typography>
        <Button
          component={Link}
          href={`/bands/${band.id}`}
          variant="text"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Back to Band Page
        </Button>
      </Stack>

      {/* This shows:
          - Leave band (for members)
          - Delete band (for admins)
      */}
      <DangerZone bandId={band.id} bandName={band.name} isAdmin={isAdmin} />
    </Container>
  );
}
