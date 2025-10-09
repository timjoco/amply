'use client';

import AccountAvatar from '@/components/AccountAvatar';
import AccountMenu from '@/components/AccountMenu';
import { supabaseBrowser } from '@/lib/supabaseClient';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function BottomNav() {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [initials, setInitials] = useState('U');
  const [acctAnchor, setAcctAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;
      const { data: profile } = await sb
        .from('users')
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

  return (
    <>
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
        <BottomNavigation showLabels>
          <BottomNavigationAction
            icon={<HomeOutlinedIcon />}
            onClick={() => router.push('/dashboard')}
          />
          <BottomNavigationAction
            icon={<LibraryMusicOutlinedIcon />}
            onClick={() => router.push('/bands')}
          />
          <BottomNavigationAction
            icon={<EventOutlinedIcon />}
            onClick={() => router.push('/events')}
          />
          <BottomNavigationAction
            icon={<AccountAvatar size={24}>{initials}</AccountAvatar>}
            onClick={(e) => setAcctAnchor(e.currentTarget)}
          />
        </BottomNavigation>
      </Paper>

      <AccountMenu
        size={40}
        anchorEl={acctAnchor}
        open={Boolean(acctAnchor)}
        onClose={() => setAcctAnchor(null)}
      />
    </>
  );
}
