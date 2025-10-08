'use client';

import { AppBar, Button, Toolbar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';

export default function HeaderPublic() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="default"
      sx={(t) => ({
        // Full-bleed background across the viewport
        mx: 'calc(50% - 50vw)',
        width: '100vw',
        left: 0,
        right: 0,
        zIndex: t.zIndex.appBar,

        bgcolor: '#0B0B10',
        color: 'common.white',
        borderBottom: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.22),
      })}
    >
      <Toolbar
        // Fluid width; minimal padding so items sit closer to edges on big screens
        sx={{
          width: '100%',
          px: { xs: 2, md: 2 }, // keep this small to push content outward
          minHeight: 64,
          justifyContent: 'space-between',
        }}
      >
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
