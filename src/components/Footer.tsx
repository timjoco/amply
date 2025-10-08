'use client';

import { Box, Container, Typography } from '@mui/material';

// a static footer to be used on large screen sizes
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[900],
        color: 'common.white',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="body2">
          © {new Date().getFullYear()} Amplee. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
