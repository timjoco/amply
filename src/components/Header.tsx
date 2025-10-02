'use client';

import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';

export default function Header() {
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ display: 'flex' }}>
          {/* Left section */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Button
              component={NextLink}
              href="/"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Home
            </Button>
          </Box>

          {/* Center section (brand) */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography
              component={NextLink}
              href="/"
              variant="h6"
              color="inherit"
              sx={{
                textDecoration: 'none',
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              Amplee
            </Typography>
          </Box>

          {/* Right section */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={NextLink}
              href="/login"
              variant="contained"
              color="secondary"
              disableElevation
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
