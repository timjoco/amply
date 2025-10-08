'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EventIcon from '@mui/icons-material/EventOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusicOutlined';
import LoginIcon from '@mui/icons-material/Login';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type AuthState = 'loading' | 'in' | 'out';

// this component is being used on small screen sizes only!!
export default function BottomNav() {
  const router = useRouter();
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

  const tabs = useMemo(() => {
    if (auth !== 'in') {
      return [{ href: '/login', label: 'Login', icon: <LoginIcon /> }];
    }
    return [
      { href: '/dashboard', label: 'Dashboard', icon: <SpaceDashboardIcon /> },
      { href: '/bands', label: 'Bands', icon: <LibraryMusicIcon /> },
      { href: '/events', label: 'Events', icon: <EventIcon /> },
      { href: '/settings', label: 'Account', icon: <AccountCircleIcon /> },
    ];
  }, [auth]);

  const value = tabs.findIndex((t) => pathname?.startsWith(t.href));
  const current = value === -1 ? 0 : value;

  return (
    <Paper
      elevation={0}
      sx={(t) => ({
        position: 'fixed',
        display: { xs: 'block', md: 'none' },
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.22),
        bgcolor: '#0B0B10',
      })}
    >
      <BottomNavigation
        showLabels={false} // icons only on small screens
        value={current}
        onChange={(_e, idx) => router.push(tabs[idx].href)}
        sx={{ bgcolor: 'transparent' }}
      >
        {tabs.map((t) => (
          <BottomNavigationAction
            key={t.href}
            icon={t.icon}
            sx={(theme) => ({
              color: 'rgba(255,255,255,0.65)',
              '&.Mui-selected': { color: theme.palette.primary.main },
            })}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
