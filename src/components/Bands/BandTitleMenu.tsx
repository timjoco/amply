'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import { useState } from 'react';
import BandActionsDialog from './BandActionsDialog';

// this is the band  drop menu on desktop (click band name)
export default function BandTitleMenu({
  bandId,
  bandName,
  onInvite,
}: {
  bandId: string;
  bandName: string;
  onInvite?: () => void;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const [actionsOpen, setActionsOpen] = useState(false);

  // ---------- Mobile: opens actions dialog ----------
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
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: 2,
            color: 'text.primary',
            maxWidth: '100%',
            '& svg': { cursor: 'pointer' },
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
                fontSize: 'clamp(18px, 5.2vw, 10px)',
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
        />
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
          maxWidth: '100%',
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
        {onInvite && (
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
