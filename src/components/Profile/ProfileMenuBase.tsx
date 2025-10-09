'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
};

export default function ProfileMenuBase({ open, anchorEl, onClose }: Props) {
  const sb = supabaseBrowser();

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
    >
      <MenuItem component={Link} href="/dashboard" onClick={onClose}>
        <ListItemIcon>
          <DashboardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </MenuItem>
      <MenuItem component={Link} href="/settings" onClick={onClose}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Settings" />
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={async () => {
          await sb.auth.signOut();
          onClose();
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Sign out" />
      </MenuItem>
    </Menu>
  );
}
