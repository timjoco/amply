'use client';

import ProfileMenu from '@/components/ProfileMenu';
import { supabaseBrowser } from '@/lib/supabaseClient';
import EventIcon from '@mui/icons-material/EventOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusicOutlined';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import {
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type AuthState = 'loading' | 'in' | 'out';

const NAV_WIDTH = 240;

const items = [
  { href: '/dashboard', label: 'Dashboard', Icon: SpaceDashboardIcon },
  { href: '/bands', label: 'Bands', Icon: LibraryMusicIcon },
  { href: '/events', label: 'Events', Icon: EventIcon },
];

// side nav component is exclusively for logged in users
export default function SideNav() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>('loading');

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setAuth(user ? 'in' : 'out');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setAuth(s?.user ? 'in' : 'out');
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 👇 Logged out? Render nothing (no side nav on landing/marketing pages)
  if (auth === 'out') return null;

  return (
    <Box
      component="nav"
      sx={(t) => ({
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        zIndex: 1000,
        top: 0,
        left: 0,
        width: NAV_WIDTH,
        height: '100dvh',
        bgcolor: '#0B0B10',
        color: 'common.white',
        borderRight: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.22),
        p: 2,
        gap: 1.5,
      })}
    >
      {/* Brand */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Link
          href="/"
          prefetch={false}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            Amplee
          </Typography>
        </Link>
      </Box>

      <Divider
        sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.18) })}
      />

      {/* Loading skeleton while checking auth */}
      {auth === 'loading' ? (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Skeleton variant="rounded" height={36} />
          <Skeleton variant="rounded" height={36} />
          <Skeleton variant="rounded" height={36} />
        </Stack>
      ) : (
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          {items.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Button
                key={href}
                component={Link}
                href={href}
                // startIcon={<Icon />}
                color="inherit"
                sx={(t) => ({
                  justifyContent: 'flex-start',
                  borderRadius: 2,
                  px: 1.25,
                  minHeight: 40,
                  textTransform: 'none',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  border: '1px solid',
                  borderColor: active
                    ? alpha(t.palette.primary.main, 0.35)
                    : alpha(t.palette.primary.main, 0.18),
                  backgroundColor: active
                    ? alpha('#7C3AED', 0.12)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha('#7C3AED', 0.08),
                    borderColor: alpha(t.palette.primary.main, 0.35),
                  },
                  '& .MuiButton-startIcon': { mr: 1 },
                })}
              >
                {label}
              </Button>
            );
          })}
        </Stack>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Bottom: profile when logged in */}
      {auth === 'in' && (
        <Tooltip title="Account">
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 0.5 }}>
            <ProfileMenu />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

export const SIDE_NAV_WIDTH = NAV_WIDTH;
