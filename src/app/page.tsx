export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabaseServer } from '@/lib/supabaseServer';
import { Button, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Server-side auth check
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
      <Stack spacing={{ xs: 3, md: 4 }} alignItems="center" textAlign="center">
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: -0.5,
            fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
          }}
        >
          Simplify the chaos. Amplify the music.
        </Typography>

        <Typography
          variant="h5"
          component="p"
          sx={{ maxWidth: 720, color: 'common.white' }}
        >
          All your band’s moving parts — in one place, finally.
        </Typography>

        {/* CTA buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ pt: 4, width: '100%', justifyContent: 'center' }}
        >
          <Button
            component={Link}
            href="/login"
            color="primary"
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
            }}
          >
            Get Started
          </Button>
          <Button
            component={Link}
            href="/how-it-works"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
              backgroundColor: 'white',
              color: 'black',
              '&:hover': { backgroundColor: '#e0e0e0' },
            }}
          >
            How It Works
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
