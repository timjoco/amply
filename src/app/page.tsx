import { Box, Button, Container, Typography } from '@mui/material';
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
          Simplify the chaos. Amplify the music
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h4">
          All your band’s moving parts — in one place, finally.
        </Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Button>
          <Typography sx={{ padding: 1 }}>
            <Link href="/login">Get Started</Link>
          </Typography>
        </Button>
        {/* </Box>
      <Box> */}
        <Button>
          <Typography sx={{ padding: 1 }}>
            <Link href="/how-it-works">How It Works</Link>
          </Typography>
        </Button>
      </Box>
    </Container>
  );
}
