'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function TopRightAccount() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [initials, setInitials] = useState('U');

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
        user.user_metadata?.name ||
        user.email ||
        '';

      const derived =
        name
          .split(/\s+/)
          .map((p: string) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U';

      setInitials(derived);
    })();
  }, [sb]);

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Account menu"
        size="small"
        sx={{
          bgcolor: 'transparent',
          border: (t) => `1px solid ${t.palette.primary.main}22`,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          sx={{
            width: { xs: 40, md: 44 },
            height: { xs: 40, md: 44 },
            fontSize: { xs: 16, md: 18 },
            fontWeight: 700,
            letterSpacing: 0.5,
            color: 'white',
            bgcolor: 'primary.main',
          }}
        >
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: (t) => ({
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            border: `1px solid ${t.palette.primary.main}44`,
            backdropFilter: 'blur(8px)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          }),
        }}
      >
        <MenuItem component={Link} href="/settings">
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            await sb.auth.signOut();
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </MenuItem>
      </Menu>
    </>
  );
}
