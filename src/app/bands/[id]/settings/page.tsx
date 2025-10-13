// app/bands/[id]/settings/page.tsx
import { createClient } from '@/utils/supabase/server';
import { Button, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import DangerZone from './DangerZone';

export default async function BandSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();

  const { id } = await params;

  // Auth guard
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) redirect('/login');

  // Fetch band
  const { data: band, error: bErr } = await supabase
    .from('bands')
    .select('id, name')
    .eq('id', id)
    .single();

  if (bErr || !band) notFound();

  // Is current user an admin?
  const { data: adminFlag, error: aErr } = await supabase.rpc('is_band_admin', {
    p_band_id: id,
  });
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

      {/* Danger zone: leave/delete actions */}
      <DangerZone bandId={band.id} bandName={band.name} isAdmin={isAdmin} />
    </Container>
  );
}
