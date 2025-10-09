'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function getInitials(
  first?: string | null,
  last?: string | null,
  email?: string | null
) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (f || l) return (f[0] || '') + (l[0] || '');
  const e = (email || '').trim();
  return e ? e[0]?.toUpperCase() : '?';
}

export default function ProfileMenu() {
  // const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; //
        setEmail(user.email ?? null);

        const { data: profile, error } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;
        if (error) throw error;

        setFirst(profile?.first_name ?? null);
        setLast(profile?.last_name ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const signOut = async () => {
    const supabase = supabaseBrowser();
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.assign('/');
    }
  };

  const initials = getInitials(first, last, email);

  return (
    <>
      <Tooltip
        title={loading ? 'Loading…' : first || last || email || 'Account'}
      >
        <Box>
          <IconButton
            onClick={handleOpen}
            size="small"
            aria-label="account menu"
          >
            <Avatar
              sx={(t) => ({
                width: 36,
                height: 36,
                fontWeight: 700,
                borderRadius: 999,
                fontSize: 14,
                color: '#fff',
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.35),
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(168,85,247,0.9))',
                boxShadow: `0 0 0 1px ${alpha(
                  t.palette.primary.main,
                  0.12
                )}, 0 6px 16px rgba(0,0,0,.35)`,
              })}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Box>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: (t) => ({
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.28),
            background:
              'linear-gradient(180deg, rgba(75, 0, 130, 1), rgba(70, 4, 96, 1))',
            backdropFilter: 'blur(10px)',
          }),
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={Link} href="/settings" onClick={handleClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <Divider
          sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.12) })}
        />

        <MenuItem
          onClick={() => {
            handleClose();
            void signOut();
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
