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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  bandId: string;
  bandName: string;
  onInvite?: () => void;
  /** Admins see Invite + Settings; members see Leave */
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveErr, setLeaveErr] = useState<string | null>(null);

  const BG = '#000000';
  const SURFACE = '#1A1B1F';
  const SURFACE_HOVER = 'rgba(255,255,255,0.06)';
  const BORDER = 'rgba(255,255,255,0.10)';
  const TEXT = 'rgba(255,255,255,0.96)';
  const TEXT_DIM = 'rgba(255,255,255,0.72)';

  async function onConfirmLeave() {
    try {
      setLeaving(true);
      setLeaveErr(null);
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error('You must be signed in.');
      const { error } = await sb
        .from('band_members')
        .delete()
        .eq('band_id', bandId)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      setLeaveOpen(false);
      setSheetOpen(false);
      setAnchorEl(null);
      router.push('/dashboard');
      router.refresh?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setLeaveErr(e?.message ?? 'Failed to leave band');
    } finally {
      setLeaving(false);
    }
  }

  // ---------- Mobile: Band title opens large bottom sheet (no edge swipe) ----------
  if (!isDesktop) {
    return (
      <>
        <ButtonBase
          type="button"
          onClick={() => setSheetOpen(true)}
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

        <Box
          role="button"
          aria-label="Open band actions"
          title="Open band actions"
          onClick={() => setSheetOpen(true)}
          sx={{
            position: 'fixed',
            right: 12,
            bottom: `calc(56px + env(safe-area-inset-bottom, 0px) + 8px)`,
            zIndex: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.5,
            height: 36,
            borderRadius: 999,
            bgcolor: 'rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            userSelect: 'none',
          }}
        ></Box>

        <SwipeableDrawer
          anchor="bottom"
          open={sheetOpen}
          onOpen={() => setSheetOpen(true)}
          onClose={() => setSheetOpen(false)}
          disableSwipeToOpen
          ModalProps={{
            keepMounted: true,
            BackdropProps: {
              sx: {
                backgroundColor: `${BG}E6`, // ~90% black
                backdropFilter: 'blur(2px)',
              },
            },
          }}
          PaperProps={{
            sx: {
              height: '88vh',
              maxHeight: '95vh',
              overflow: 'hidden',
              bgcolor: SURFACE,
              color: TEXT,
              borderTop: `1px solid ${BORDER}`,
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              boxShadow: '0 -20px 40px rgba(0,0,0,.6)',
            },
          }}
        >
          {/* Puller */}
          <Box sx={{ display: 'grid', placeItems: 'center', pt: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.28)',
              }}
            />
          </Box>

          {/* Flexible, scrollable content */}
          <Box
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <Box sx={{ px: 2, pt: 1, pb: 1 }}>
              <Typography
                variant="overline"
                sx={{ color: TEXT_DIM, letterSpacing: 1, userSelect: 'none' }}
              >
                {bandName}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                borderTop: `1px solid ${BORDER}`,
                '&::-webkit-scrollbar': { width: 10 },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.14)',
                  borderRadius: 8,
                  border: '2px solid transparent',
                  backgroundClip: 'padding-box',
                },
              }}
            >
              <List sx={{ py: 0.5 }}>
                {/* ADMIN: Invite */}
                {isAdmin && onInvite && (
                  <ListItemButton
                    onClick={() => {
                      setSheetOpen(false);
                      onInvite();
                    }}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderRadius: 1.5,
                      mx: 1,
                      '& .MuiListItemIcon-root': {
                        minWidth: 44,
                        color: TEXT_DIM,
                      },
                      '&:hover': { backgroundColor: SURFACE_HOVER },
                    }}
                  >
                    <ListItemIcon>
                      <GroupAddIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Invite Band Members"
                      primaryTypographyProps={{ fontWeight: 700, color: TEXT }}
                      secondaryTypographyProps={{ color: TEXT_DIM }}
                    />
                  </ListItemButton>
                )}

                {/* ADMIN: Settings */}
                {isAdmin && (
                  <ListItemButton
                    component={Link}
                    href={`/bands/${bandId}/settings`}
                    onClick={() => setSheetOpen(false)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderRadius: 1.5,
                      mx: 1,
                      '& .MuiListItemIcon-root': {
                        minWidth: 44,
                        color: TEXT_DIM,
                      },
                      '&:hover': { backgroundColor: SURFACE_HOVER },
                    }}
                  >
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Band Settings"
                      primaryTypographyProps={{ fontWeight: 700, color: TEXT }}
                    />
                  </ListItemButton>
                )}

                {/* MEMBER: Leave only */}
                {!isAdmin && (
                  <ListItemButton
                    onClick={() => {
                      setSheetOpen(false);
                      setLeaveOpen(true);
                    }}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderRadius: 1.5,
                      mx: 1,
                      color: (t) => t.palette.error.light,
                      '& .MuiListItemIcon-root': {
                        minWidth: 44,
                        color: 'inherit',
                      },
                      '&:hover': { backgroundColor: 'rgba(244,67,54,0.10)' },
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
            </Box>
            <Box sx={{ borderTop: `1px solid ${BORDER}`, p: 1 }} />
          </Box>
        </SwipeableDrawer>

        {/* Leave confirm */}
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

  // ---------- Desktop: dropdown menu ----------
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

      {/* Leave confirm */}
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
