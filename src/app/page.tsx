import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';

// src/app/page.tsx
export default function HomePage() {
  return (
    <Container>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h2">
          Amplify your gigs. Simplify your bookings
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h4">
          Get connected. Get booked. Play the gig. Get paid.
        </Typography>
      </Box>
      <Link href="/signup?role=band">I&apos;m a Band</Link>
      <Link href="/signup?role=venue">I&apos;m a Venue</Link>
      <Link href="/how-it-works">How It Works</Link>
    </Container>
  );
}
