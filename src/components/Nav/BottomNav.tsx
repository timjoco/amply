'use client';

import AccountAvatar from '@/components/Profile/AccountAvatar';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [initials, setInitials] = useState('U');
  const [mounted, setMounted] = useState(false);

  // 🔹 manual selection override (unchanged)
  const [manualIndex, setManualIndex] = useState<number | null>(null);

  const HOME_INDEX = 0;
  const CREATE_INDEX = 1;
  const ACCOUNT_INDEX = 2;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = () => setManualIndex(HOME_INDEX);
    window.addEventListener('amplee:settings-closed', handler);
    return () => window.removeEventListener('amplee:settings-closed', handler);
  }, []);

  useEffect(() => {
    if (!pathname?.startsWith('/settings')) setManualIndex(null);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;
      const { data: profile } = await sb
        .from('profiles')
        .select('first_name,last_name')
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

  const selectedIndex = mounted
    ? manualIndex ??
      (pathname?.startsWith('/settings') ? ACCOUNT_INDEX : HOME_INDEX)
    : HOME_INDEX;

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
          if (newValue === CREATE_INDEX) {
            (document.activeElement as HTMLElement | null)?.blur?.();

            window.dispatchEvent(new CustomEvent('global-create:open'));
            return;
          }
          const href = newValue === ACCOUNT_INDEX ? '/settings' : '/dashboard';
          router.push(href);
        }}
        showLabels
        sx={(t) => ({
          px: 0.25,
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
            '& .MuiBottomNavigationAction-label': {
              fontSize: 10,
              lineHeight: 1,
              letterSpacing: 0.2,
              marginTop: 0.75,
              transition: 'color .15s ease, opacity .15s ease',
              opacity: 0.85,
            },
            '&:hover': {
              backgroundColor: 'transparent',
              color: alpha(t.palette.text.primary, 0.8),
            },
            '&.Mui-selected': {
              color: t.palette.common.white,
              backgroundColor: 'transparent',
              '& .MuiSvgIcon-root': { animation: 'pop 180ms ease-out' },
              '& .MuiBottomNavigationAction-label': { opacity: 1 },
              '& .MuiAvatar-root': { animation: 'pop 180ms ease-out' },
            },
          },
          ...(t.palette.mode === 'dark' && {
            '& .MuiBottomNavigationAction-root:not(.Mui-selected)': {
              color: alpha(t.palette.common.white, 0.75),
            },
          }),
        })}
      >
        <BottomNavigationAction icon={<HomeFilledIcon />} />
        <BottomNavigationAction icon={<AddIcon />} />
        <BottomNavigationAction
          id="nav-account"
          icon={
            <Box
              sx={(t) => ({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiAvatar-root': {
                  color: 'currentColor',
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
        />
      </BottomNavigation>
    </Paper>
  );
}
