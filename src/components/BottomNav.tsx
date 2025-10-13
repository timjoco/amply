'use client';

import AccountAvatar from '@/components/Profile/AccountAvatar';
import { supabaseBrowser } from '@/lib/supabaseClient';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/bands', label: 'Bands', Icon: LibraryMusicOutlinedIcon },
  { href: '/events', label: 'Events', Icon: EventOutlinedIcon },
  // index 3 = Account (/settings)
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [initials, setInitials] = useState('U');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;
      const { data: profile } = await sb
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      const name =
        [profile?.first_name, profile?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        (user.user_metadata?.name as string | undefined) ||
        user.email ||
        '';
      const derived =
        name
          .split(/\s+/)
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U';
      setInitials(derived);
    })();
  }, [sb]);

  // Compute selected index (only after mount to avoid SSR mismatch)
  const selectedIndex = mounted
    ? pathname?.startsWith('/settings')
      ? 3
      : (() => {
          const idx = navItems.findIndex((i) => pathname?.startsWith(i.href));
          return idx === -1 ? 0 : idx;
        })()
    : 0;

  if (!mounted) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: (t) => t.zIndex.fab,
      }}
    >
      <BottomNavigation
        value={selectedIndex}
        onChange={(_e, newValue) => {
          const href = newValue === 3 ? '/settings' : navItems[newValue]?.href;
          if (href) router.push(href);
        }}
        showLabels
        sx={(t) => ({
          px: 0.25,

          // pop animation
          '@keyframes pop': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.12)' },
            '100%': { transform: 'scale(1)' },
          },

          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            mx: 0.25,
            px: 0.25,
            borderRadius: 2,
            color: alpha(t.palette.text.primary, 0.6),

            '& .MuiSvgIcon-root': {
              fontSize: 22,
              transition: 'color .15s ease, transform .15s ease',
            },

            // Tiny labels
            '& .MuiBottomNavigationAction-label': {
              fontSize: 10,
              lineHeight: 1,
              letterSpacing: 0.2,
              marginTop: 0.75,
              transition: 'color .15s ease, opacity .15s ease',
              opacity: 0.85,
            },

            // No bg on hover/selected
            '&:hover': {
              backgroundColor: 'transparent',
              color: alpha(t.palette.text.primary, 0.8),
            },

            // Selected: white icon/label + pop
            '&.Mui-selected': {
              color: t.palette.common.white,
              backgroundColor: 'transparent',
              '& .MuiSvgIcon-root': { animation: 'pop 180ms ease-out' },
              '& .MuiBottomNavigationAction-label': { opacity: 1 },
              '& .MuiAvatar-root': { animation: 'pop 180ms ease-out' },
            },
          },

          // optional: dim unselected a bit more in dark mode
          ...(t.palette.mode === 'dark' && {
            '& .MuiBottomNavigationAction-root:not(.Mui-selected)': {
              color: alpha(t.palette.common.white, 0.75),
            },
          }),
        })}
      >
        {navItems.map(({ href, label, Icon }) => (
          <BottomNavigationAction key={href} label={label} icon={<Icon />} />
        ))}

        {/* Account tab (index 3) */}
        <BottomNavigationAction
          label="Account"
          icon={
            <Box
              sx={(t) => ({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiAvatar-root': {
                  color: 'currentColor', // initials follow selected (white) vs grey
                  border: `2px solid ${alpha(t.palette.text.primary, 0.4)}`,
                },
                '.Mui-selected & .MuiAvatar-root': {
                  borderColor: alpha(t.palette.common.white, 0.8),
                },
              })}
            >
              <AccountAvatar size={24}>{initials}</AccountAvatar>
            </Box>
          }
          onClick={() => router.push('/settings')}
        />
      </BottomNavigation>
    </Paper>
  );
}
