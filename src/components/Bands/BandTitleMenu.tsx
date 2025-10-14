/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BandActionsDialog from './BandActionsDialog';

type Props = {
  bandId: string;
  bandName: string;
  onInvite?: () => void;
  /** true = admin sees Invite + Settings, false = member sees Leave only */
  isAdmin?: boolean;
};

export default function BandTitleMenu({
  bandId,
  bandName,
  onInvite,
  isAdmin = false,
}: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveErr, setLeaveErr] = useState<string | null>(null);

  async function onConfirmLeave() {
    try {
      setLeaving(true);
      setLeaveErr(null);
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error('You must be signed in.');

      // RLS: user can delete own membership
      const { error } = await sb
        .from('band_members')
        .delete()
        .eq('band_id', bandId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      setLeaveOpen(false);
      setAnchorEl(null);
      router.push('/dashboard');
      router.refresh?.();
    } catch (e: any) {
      setLeaveErr(e?.message ?? 'Failed to leave band');
    } finally {
      setLeaving(false);
    }
  }

  // ---------- Mobile ----------
  if (!isDesktop) {
    return (
      <>
        <ButtonBase
          type="button"
          onClick={() => setActionsOpen(true)}
          disableRipple
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 2,
            py: 1,
            borderRadius: 2,
            color: 'text.primary',
            maxWidth: '100%',
            '&:focus-visible': {
              outline: (t) => `2px solid ${t.palette.primary.main}`,
              outlineOffset: 2,
              borderRadius: 6,
            },
          }}
          aria-label={`Open ${bandName} actions`}
        >
          <Box sx={{ minWidth: 0, maxWidth: '80vw', flex: '1 1 auto' }}>
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontWeight: 900,
                lineHeight: 1.15,
                fontSize: 'clamp(18px, 5.2vw, 28px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={bandName}
            >
              {bandName}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ fontSize: 22, flex: '0 0 auto' }} />
        </ButtonBase>

        <BandActionsDialog
          open={actionsOpen}
          onClose={() => setActionsOpen(false)}
          bandId={bandId}
          bandName={bandName}
          onInvite={onInvite}
          isAdmin={isAdmin}
          onLeaveRequested={() => setLeaveOpen(true)}
        />

        {/* Confirm leave dialog (mobile reuses same confirm) */}
        <Dialog
          open={leaveOpen}
          onClose={() => (leaving ? null : setLeaveOpen(false))}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Leave “{bandName}”?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              You’ll lose access to this band’s events and settings. You can
              rejoin later if invited.
            </Typography>
            {leaveErr && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: 'block', mt: 1 }}
              >
                {leaveErr}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveOpen(false)} disabled={leaving}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={onConfirmLeave}
              disabled={leaving}
            >
              {leaving ? 'Leaving…' : 'Leave Band'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // ---------- Desktop ----------
  const handleToggle = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(open ? null : e.currentTarget);

  return (
    <>
      <ButtonBase
        type="button"
        onClick={handleToggle}
        disableRipple
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 2.25,
          py: 1.25,
          borderRadius: 2,
          color: 'text.primary',
          maxWidth: '100%',
          '&:focus-visible': {
            outline: (t) => `2px solid ${t.palette.primary.main}`,
            outlineOffset: 2,
            borderRadius: 6,
          },
        }}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        aria-label={open ? `Close ${bandName} menu` : `Open ${bandName} menu`}
      >
        <Box sx={{ minWidth: 0, maxWidth: '60vw' }}>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontWeight: 900,
              lineHeight: 1.05,
              fontSize: 'clamp(19px, 4vw, 35px)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={bandName}
          >
            {bandName}
          </Typography>
        </Box>
        {open ? (
          <CloseIcon sx={{ fontSize: 30, flex: '0 0 auto' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 30, flex: '0 0 auto' }} />
        )}
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 3,
          sx: (t) => ({
            mt: 1.25,
            minWidth: 320,
            borderRadius: 2,
            border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
            boxShadow: `0 12px 32px ${alpha('#000', 0.22)}`,
            overflow: 'hidden',
          }),
        }}
        MenuListProps={{ dense: false, sx: { py: 0.5 } }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {/* ADMIN: Invite */}
        {isAdmin && onInvite && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onInvite();
            }}
            sx={{
              py: 1.25,
              px: 1.75,
              gap: 1,
              '& .MuiListItemIcon-root': { minWidth: 44 },
              '& .MuiSvgIcon-root': { fontSize: 22 },
              '&:hover': (t) => ({
                backgroundColor: alpha(t.palette.primary.main, 0.06),
              }),
            }}
          >
            <ListItemText
              primary="Invite Band Members"
              primaryTypographyProps={{
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            />
            <ListItemIcon>
              <GroupAddIcon />
            </ListItemIcon>
          </MenuItem>
        )}

        {/* ADMIN: Settings */}
        {isAdmin && (
          <MenuItem
            component={Link}
            href={`/bands/${bandId}/settings`}
            onClick={() => setAnchorEl(null)}
            sx={{
              py: 1.25,
              px: 1.75,
              gap: 1,
              '& .MuiListItemIcon-root': { minWidth: 44 },
              '& .MuiSvgIcon-root': { fontSize: 22 },
              '&:hover': (t) => ({
                backgroundColor: alpha(t.palette.primary.main, 0.06),
              }),
            }}
          >
            <ListItemText
              primary="Band Settings"
              primaryTypographyProps={{
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            />
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
          </MenuItem>
        )}

        {/* MEMBER: Leave only */}
        {!isAdmin && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setLeaveOpen(true);
            }}
            sx={{
              py: 1.25,
              px: 1.75,
              gap: 1,
              color: (t) => t.palette.error.main,
              '& .MuiListItemIcon-root': { minWidth: 44 },
              '& .MuiSvgIcon-root': { fontSize: 22 },
              '&:hover': (t) => ({
                backgroundColor: alpha(t.palette.error.main, 0.08),
              }),
            }}
          >
            <ListItemText
              primary="Leave Band"
              primaryTypographyProps={{
                fontSize: 15,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            />
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
          </MenuItem>
        )}
      </Menu>

      {/* Confirm leave dialog (desktop & mobile share this) */}
      <Dialog
        open={leaveOpen}
        onClose={() => (leaving ? null : setLeaveOpen(false))}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Leave “{bandName}”?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You’ll lose access to this band’s events and settings. You can
            rejoin later if invited.
          </Typography>
          {leaveErr && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 1 }}
            >
              {leaveErr}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveOpen(false)} disabled={leaving}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onConfirmLeave}
            disabled={leaving}
          >
            {leaving ? 'Leaving…' : 'Leave Band'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
