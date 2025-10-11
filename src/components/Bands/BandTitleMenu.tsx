// components/Bands/BandTitleMenu.tsx
'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import { useState } from 'react';
import BandActionsDialog from './BandActionsDialog';

export default function BandTitleMenu({
  bandId,
  bandName,
  onInvite, // pass only for admins
}: {
  bandId: string;
  bandName: string;
  onInvite?: () => void;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Desktop dropdown state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Mobile dialog state
  const [actionsOpen, setActionsOpen] = useState(false);

  if (!isDesktop) {
    return (
      <>
        <ButtonBase
          component="button" // real <button>
          type="button"
          onClick={() => setActionsOpen(true)}
          disableRipple
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            cursor: 'pointer', // explicit, though <button> already uses pointer
            userSelect: 'none',
            borderRadius: 2,
            color: 'text.primary',
            '& svg': { cursor: 'pointer' },
            '&:focus-visible': {
              outline: (t) => `2px solid ${t.palette.primary.main}`,
              outlineOffset: 2,
              borderRadius: 6,
            },
          }}
          aria-label={`Open ${bandName} actions`}
        >
          <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
            {bandName}
          </span>
          <ChevronRightIcon sx={{ fontSize: 28 }} />
        </ButtonBase>

        <BandActionsDialog
          open={actionsOpen}
          onClose={() => setActionsOpen(false)}
          bandId={bandId}
          bandName={bandName}
          onInvite={onInvite}
        />
      </>
    );
  }

  // ——— Desktop: dropdown menu ———
  const handleToggle = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(open ? null : e.currentTarget);

  return (
    <>
      <ButtonBase
        component="button" // real <button>
        type="button"
        onClick={handleToggle}
        disableRipple
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.25,
          py: 1.25,
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: 2,
          color: 'text.primary',
          '& svg': { cursor: 'pointer' },
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
        <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.05 }}>
          {bandName}
        </span>
        {open ? (
          <CloseIcon sx={{ fontSize: 30 }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 30 }} />
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
            minWidth: 320, // wider menu
            borderRadius: 2,
            border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
            boxShadow: `0 12px 32px ${alpha('#000', 0.22)}`,
            overflow: 'hidden',
          }),
        }}
        MenuListProps={{
          dense: false,
          sx: {
            py: 0.5,
          },
        }}
        // anchors feel better with larger menus
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {onInvite && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onInvite();
            }}
            sx={{
              py: 1.25,
              px: 1.75,
              gap: 1.25,
              '& .MuiListItemIcon-root': { minWidth: 44 },
              '& .MuiSvgIcon-root': { fontSize: 22 },
              '&:hover': (t) => ({
                backgroundColor: alpha(t.palette.primary.main, 0.06),
              }),
            }}
          >
            <ListItemText
              primary="Invite member"
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

        <MenuItem
          component={Link}
          href={`/bands/${bandId}/settings`}
          onClick={() => setAnchorEl(null)}
          sx={{
            py: 1.25, // taller row
            px: 1.75, // wider gutters
            gap: 1.25, // space between icon & text
            '& .MuiListItemIcon-root': {
              minWidth: 44,
            },
            '& .MuiSvgIcon-root': {
              fontSize: 22, // larger icon
            },
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
            secondaryTypographyProps={{ fontSize: 12, color: 'text.secondary' }}
          />
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </>
  );
}
