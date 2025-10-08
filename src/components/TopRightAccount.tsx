'use client';

import ProfileMenu from '@/components/ProfileMenu';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Box, Button, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type AuthState = 'loading' | 'in' | 'out';

export default function TopRightAccount() {
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<AuthState>('loading');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const supabase = supabaseBrowser();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuth(user ? 'in' : 'out');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuth(s?.user ? 'in' : 'out');
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, [mounted]);

  return (
    <Box
      aria-label="account"
      sx={(t) => ({
        position: 'fixed',
        top: { xs: 10, md: 14 },
        right: { xs: 10, md: 16 },
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderRadius: 999,
        border: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.28),
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        backdropFilter: 'blur(8px)',
        p: 0.5,
      })}
    >
      {!mounted ? (
        <Skeleton variant="circular" width={36} height={36} />
      ) : auth === 'in' ? (
        <ProfileMenu />
      ) : (
        <Button
          component={Link}
          href="/login"
          variant="contained"
          color="secondary"
          size="small"
          disableElevation
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 1.75,
          }}
        >
          Login
        </Button>
      )}
    </Box>
  );
}
