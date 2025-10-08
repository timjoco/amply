'use client';

import BottomNav from '@/components/BottomNav';
import HeaderPublic from '@/components/Header';
import SideNav, { SIDE_NAV_WIDTH } from '@/components/SideNav';
import TopRightAccount from '@/components/TopRightAccount';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

// a frane to correcttly show headers and footers based on both auth state AND screen size
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, [mounted]);

  const showSideNav = mounted && authed === true;
  const showPublicHeader = !showSideNav;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'transparent' }}>
      {showSideNav ? <SideNav /> : null}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          ml: { md: showSideNav ? `${SIDE_NAV_WIDTH}px` : 0 },
          pb: { xs: showSideNav ? '68px' : 0 },
        }}
      >
        {showPublicHeader && <HeaderPublic />}
        {children}
      </Box>

      {showSideNav && <BottomNav />}
      {showSideNav && <TopRightAccount />}
    </Box>
  );
}
