/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CloseIcon from '@mui/icons-material/Close';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar,
  Box,
  Dialog,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Slide,
  SwipeableDrawer,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import React, { forwardRef } from 'react';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Height of the swipeable "edge" area that stays visible when closed
const drawerBleeding = 56;
const SWIPE_AREA = 12;

type Props = {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  bandId: string;
  bandName: string;
  onInvite?: () => void;
  edgeEnabled?: boolean;
};

/**
 * BandActionsDialog
 * - Desktop (md+): modal Dialog with your existing styles and slide transition
 * - Mobile (< md): bottom Swipeable "edge" Drawer with puller and swipe gestures
 */
export default function BandActionsDialog({
  open,
  onClose,
  onOpen,
  bandId,
  bandName,
  onInvite,
  edgeEnabled = true,
}: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // --- DESKTOP
  if (isDesktop) {
    return (
      <Dialog
        fullScreen={false}
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: alpha(theme.palette.common.black, 0.25),
            },
          },
          paper: {
            sx: (t) => ({
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(t.palette.primary.main, 0.28),
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              backdropFilter: 'blur(8px)',
              maxWidth: 520,
              width: '100%',
              overflow: 'hidden',
              boxShadow: `0 20px 48px ${alpha('#000', 0.22)}`,
            }),
          },
        }}
      >
        <AppBar
          position="relative"
          elevation={0}
          color="default"
          sx={(t) => ({
            bgcolor: 'transparent',
            borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
          })}
        >
          <Toolbar sx={{ minHeight: 64 }}>
            <IconButton
              edge="start"
              onClick={onClose}
              aria-label="Close"
              sx={{
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ ml: 2, flex: 1, fontWeight: 800, letterSpacing: 0.2 }}
            >
              {bandName}
            </Typography>
          </Toolbar>
        </AppBar>

        <BodyList
          bandId={bandId}
          onClose={onClose}
          onInvite={onInvite}
          paperOutline
        />
      </Dialog>
    );
  }

  // --- MOBILE with swipeable component
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen ?? (() => {})}
      swipeAreaWidth={edgeEnabled ? SWIPE_AREA : 0}
      disableSwipeToOpen={!edgeEnabled}
      keepMounted
      PaperProps={{
        sx: (t) => ({
          height: `calc(50vh + ${drawerBleeding}px)`,
          overflow: 'visible',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          border: '1px solid',
          borderColor: alpha(t.palette.primary.main, 0.28),
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(8px)',
        }),
      }}
      sx={{
        '& .MuiDrawer-paper': { overflow: 'visible' },
      }}
    >
      {/* Edge bleed area */}
      <Box
        sx={{
          position: 'absolute',
          top: -drawerBleeding,
          right: 0,
          left: 0,
          height: drawerBleeding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        role="presentation"
      >
        {/* Only the puller is interactive */}
        <Box
          onClick={onOpen}
          onTouchStart={onOpen}
          sx={(t) => ({
            pointerEvents: 'auto',
            width: 48,
            height: 6,
            borderRadius: 999,
            backgroundColor: alpha(t.palette.text.primary, 0.28),
          })}
        />
      </Box>

      {/* Mobile Header */}
      <AppBar
        position="relative"
        elevation={0}
        color="default"
        sx={(t) => ({
          bgcolor: 'transparent',
          borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
        })}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, letterSpacing: 0.2, flex: 1 }}
          >
            {bandName}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="Close"
            sx={{
              borderRadius: 2,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <BodyList bandId={bandId} onClose={onClose} onInvite={onInvite} />
    </SwipeableDrawer>
  );
}

/** Shared body content so desktop Dialog + mobile Drawer stay in sync */
function BodyList({
  bandId,
  onClose,
  onInvite,
  paperOutline = false,
}: {
  bandId: string;
  onClose: () => void;
  onInvite?: () => void;
  paperOutline?: boolean;
}) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Band actions
      </Typography>

      <Paper
        variant="outlined"
        sx={(t) => ({
          borderRadius: 2.5,
          borderColor: alpha(t.palette.primary.main, 0.16),
          overflow: 'hidden',
          ...(paperOutline
            ? {}
            : { borderColor: alpha(t.palette.primary.main, 0.16) }),
        })}
      >
        <List
          disablePadding
          sx={(t) => ({
            '& .MuiListItemButton-root': {
              py: 1.25,
              '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06) },
            },
            '& .MuiListItemIcon-root': { minWidth: 40 },
          })}
        >
          {onInvite && (
            <>
              <Divider
                sx={(t) => ({
                  borderColor: alpha(t.palette.primary.main, 0.12),
                })}
              />
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
                  primary="Invite Band Member"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </>
          )}

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
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItemButton>
        </List>
      </Paper>
    </Box>
  );
}
