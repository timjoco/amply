// components/AccountMenu.tsx
'use client';
import AccountAvatar from '@/components/AccountAvatar';
import { supabaseBrowser } from '@/lib/supabaseClient';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  size?: number;
  onSignedOut?: () => void;
  hideDashboardItem?: boolean;
  anchorEl?: HTMLElement | null;
  open?: boolean;
  onClose?: () => void;
};

function initialsFrom(
  first?: string | null,
  last?: string | null,
  email?: string | null
) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (f || l) return ((f[0] || '') + (l[0] || '')).toUpperCase();
  const e = (email || '').trim();
  return e ? e[0]?.toUpperCase() : '?';
}

export default function AccountMenu({
  size = 40,
  onSignedOut,
  hideDashboardItem,
  anchorEl: controlledAnchorEl,
  open: controlledOpen,
  onClose: controlledOnClose,
}: Props) {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);

  // profile state
  const [first, setFirst] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // uncontrolled trigger state (desktop/header usage)
  const [internalAnchor, setInternalAnchor] = useState<HTMLElement | null>(
    null
  );

  // decide which anchor/open/close we’re using
  const menuAnchorEl = controlledAnchorEl ?? internalAnchor;
  const menuOpen = controlledOpen ?? Boolean(internalAnchor);
  const closeMenu = controlledOnClose ?? (() => setInternalAnchor(null));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!alive || !user) return;

        setEmail(user.email ?? null);

        const { data: profile } = await sb
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!alive) return;
        setFirst(profile?.first_name ?? null);
        setLast(profile?.last_name ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb]);

  const handleSignOut = async () => {
    await sb.auth.signOut();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onSignedOut ? onSignedOut() : router.replace('/');
  };

  const initials = initialsFrom(first, last, email);

  const isControlled = controlledAnchorEl !== undefined;

  return (
    <>
      {!isControlled && (
        <Tooltip
          title={loading ? 'Loading…' : first || last || email || 'Account'}
        >
          <Box>
            <IconButton
              onClick={(e) => setInternalAnchor(e.currentTarget)}
              aria-label="account menu"
              size="small"
              sx={{
                bgcolor: 'transparent',
                border: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.35)}`,
                '&:hover': { bgcolor: 'action.hover' },
                borderRadius: 999,
                p: 0.5,
              }}
            >
              <AccountAvatar size={size}>{initials}</AccountAvatar>
            </IconButton>
          </Box>
        </Tooltip>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: (t) => ({
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            border: `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
            backdropFilter: 'blur(8px)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          }),
        }}
      >
        {!hideDashboardItem && (
          <MenuItem component={Link} href="/dashboard" onClick={closeMenu}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </MenuItem>
        )}
        <MenuItem component={Link} href="/settings" onClick={closeMenu}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem
          onClick={async () => {
            closeMenu();
            await handleSignOut();
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
