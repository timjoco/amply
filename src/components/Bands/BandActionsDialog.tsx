'use client';

import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Link from 'next/link';

type Props = {
  open: boolean;
  onClose: () => void;
  bandId: string;
  bandName: string;
  onInvite?: () => void;
  /** New: pass true for admins; false/omit for members */
  isAdmin?: boolean;
  /** New: call this to pop a confirm for leaving (parent owns confirm dialog) */
  onLeaveRequested?: () => void;
};

export default function BandActionsDialog({
  open,
  onClose,
  bandId,
  bandName,
  onInvite,
  isAdmin = false,
  onLeaveRequested,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{bandName}</DialogTitle>
      <DialogContent dividers>
        <List disablePadding>
          {/* ADMIN: Invite + Settings */}
          {isAdmin && onInvite && (
            <ListItemButton
              onClick={() => {
                onClose();
                onInvite();
              }}
            >
              <ListItemIcon>
                <GroupAddIcon />
              </ListItemIcon>
              <ListItemText
                primary="Invite Band Members"
                primaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItemButton>
          )}
          {isAdmin && (
            <ListItemButton
              component={Link}
              href={`/bands/${bandId}/settings`}
              onClick={onClose}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Band Settings"
                primaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItemButton>
          )}

          {/* MEMBER: Leave only */}
          {!isAdmin && (
            <ListItemButton
              onClick={() => {
                onClose();
                onLeaveRequested?.();
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Leave Band"
                primaryTypographyProps={{ fontWeight: 800 }}
              />
            </ListItemButton>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
