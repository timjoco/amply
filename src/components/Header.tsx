// components/HeaderPublic.tsx
'use client';

import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
        <Link
          href="/"
          prefetch={false}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 700, letterSpacing: 0.5 }}
          >
            Amplee
          </Typography>
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
