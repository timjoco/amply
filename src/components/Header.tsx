'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';

export default function Header() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', width: '100%' }}>
        {/* Left section */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'white' }}>
            Home
          </Link>
        </Box>

        {/* Center section */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}
          >
            Amplee
          </Link>
        </Box>

        {/* Right section */}
        <Box
          sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
        >
          <Link
            href="/signup"
            style={{
              textDecoration: 'none',
              backgroundColor: 'white',
              color: 'black',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 500,
            }}
          >
            Sign up
          </Link>
          <Link
            href="/login"
            style={{
              textDecoration: 'none',
              color: 'white',
              padding: '6px 12px',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
            }}
          >
            Log in
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
