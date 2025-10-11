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
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// this component is for the pop up on small screens for band actions
export default function BandActionsDialog({
  open,
  onClose,
  bandId,
  bandName,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  bandId: string;
  bandName: string;
  onInvite?: () => void;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Dialog
      fullScreen={!isDesktop}
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
            // desktop size/positioning
            ...(isDesktop && {
              maxWidth: 520,
              width: '100%',
              overflow: 'hidden',
              boxShadow: `0 20px 48px ${alpha('#000', 0.22)}`,
            }),
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

      {/* Body */}
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
          })}
        >
          <List
            disablePadding
            sx={(t) => ({
              '& .MuiListItemButton-root': {
                py: 1.25,
                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06) },
              },
              '& .MuiListItemIcon-root': {
                minWidth: 40,
                // color: t.palette.primary.main, --> this changes the icon color if needed
              },
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
                    primary="Invite member"
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
    </Dialog>
  );
}
