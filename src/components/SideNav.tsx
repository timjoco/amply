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
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_WIDTH = 240;

const items = [
  { href: '/dashboard', label: 'Dashboard', Icon: SpaceDashboardIcon },
  { href: '/bands', label: 'Bands', Icon: LibraryMusicIcon },
  { href: '/events', label: 'Events', Icon: EventIcon },
];

// Side nav is exclusively for logged-in users
export default function SideNav() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s?.user);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // If not sure yet OR logged-out → render nothing (no flash on landing)
  if (authed !== true) return null;

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
      {/* Brand (routes to /dashboard when logged in) */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Link
          href={authed ? '/dashboard' : '/'}
          prefetch={false}
          aria-label="Amplee Home"
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

      {/* Primary nav */}
      <Stack spacing={0.75} sx={{ mt: 1 }}>
        {items.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Button
              key={href}
              component={Link}
              href={href}
              startIcon={<Icon />}
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

      <Box sx={{ flex: 1 }} />

      {/* Bottom: profile */}
      <Tooltip title="Account">
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 0.5 }}>
          <ProfileMenu />
        </Box>
      </Tooltip>
    </Box>
  );
}

export const SIDE_NAV_WIDTH = NAV_WIDTH;
