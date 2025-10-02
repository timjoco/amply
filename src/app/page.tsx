'use client';

import { Button, Container, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';

export default function HomePage() {
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
          sx={{
            maxWidth: 720,
            color: 'common.white',
          }}
        >
          All your band’s moving parts — in one place, finally.
        </Typography>

        {/* CTA buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3} // more space between them
          sx={{ pt: 4, width: '100%', justifyContent: 'center' }}
        >
          <Button
            component={NextLink}
            href="/login"
            color="primary"
            variant="contained"
            size="large"
            sx={{
              px: 6, // make wider
              py: 2, // make taller
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
            }}
          >
            Get Started
          </Button>
          <Button
            component={NextLink}
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
              '&:hover': {
                backgroundColor: '#e0e0e0', // darker gray hover than pure white
              },
            }}
          >
            How It Works
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
