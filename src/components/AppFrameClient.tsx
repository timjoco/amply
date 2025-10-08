'use client';

import BottomNav from '@/components/BottomNav';
import SideNav, { SIDE_NAV_WIDTH } from '@/components/SideNav';
import TopRightAccount from '@/components/TopRightAccount';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
// If you show a public header when logged out:
import HeaderPublic from '@/components/HeaderPublic';

type Props = { children: React.ReactNode; initialAuthed: boolean };

export default function AppFrameClient({ children, initialAuthed }: Props) {
  const [authed, setAuthed] = useState(initialAuthed);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const showSideNav = authed;
  const showPublicHeader = !authed;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'transparent' }}>
      {showSideNav && <SideNav />}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          ml: { md: showSideNav ? `${SIDE_NAV_WIDTH}px` : 0 },
          height: '100dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          px: { xs: 2, md: 3 },
          pb: { xs: showSideNav ? '68px' : 0, md: 0 },
          transition: 'margin-left .15s ease',
        }}
      >
        {showPublicHeader && <HeaderPublic />}
        {children}
      </Box>

      {showSideNav && (
        <Box
          sx={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: (t) => t.zIndex.appBar + 2,
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ pointerEvents: 'auto' }}>
            <TopRightAccount />
          </Box>
        </Box>
      )}

      {showSideNav && <BottomNav />}
    </Box>
  );
}
