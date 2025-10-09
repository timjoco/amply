'use client';

import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';

export default function HeaderPublic() {
  return (
    <AppBar
      position="static"
      elevation={0}
      color="default"
      sx={(t) => ({
        bgcolor: '#0B0B10',
        color: 'common.white',
        borderBottom: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.22),
      })}
    >
      <Toolbar disableGutters sx={{ width: '100%', px: 2 }}>
        {/* Brand: logo + wordmark */}
        <Link
          href="/"
          prefetch={false}
          aria-label="Amplee Home"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 0.5 }}
          >
            <Image
              src="/logo.png" // or /amplee-mark.svg
              alt="Amplee"
              width={28}
              height={28}
              priority
              style={{ display: 'block', borderRadius: 6 }}
            />
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, letterSpacing: 0.5 }}
            >
              AMPLEE
            </Typography>
          </Box>
        </Link>

        <Box sx={{ flex: 1 }} />

        <Button
          component={Link}
          href="/login"
          variant="contained"
          color="secondary"
          disableElevation
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Login
        </Button>
      </Toolbar>
    </AppBar>
  );
}
