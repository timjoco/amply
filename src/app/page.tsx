'use client';

import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Stack,
  Typography,
} from '@mui/material';
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
            color: 'common.white', // forces pure white
          }}
        >
          All your band’s moving parts — in one place, finally.
        </Typography>

        <Box>
          <ButtonGroup
            orientation="horizontal"
            variant="contained"
            aria-label="primary actions"
          >
            <Button
              component={NextLink}
              href="/login"
              color="primary"
              size="large"
            >
              Get Started
            </Button>
            <Button
              component={NextLink}
              href="/how-it-works"
              variant="outlined"
              color="primary"
              size="large"
            >
              How It Works
            </Button>
          </ButtonGroup>
        </Box>
      </Stack>
    </Container>
  );
}
