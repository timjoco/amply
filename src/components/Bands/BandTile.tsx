/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { MembershipRole } from '@/types/db';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NextLink from 'next/link';
import RolePill from '../RolePill';

type Props = {
  id: string;
  name: string;
  bandRole?: MembershipRole;
  avatarUrl?: string;
  size?: number;
  selected?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default function BandTile({ id, name, bandRole, avatarUrl }: Props) {
  const normalizedRole: 'admin' | 'member' =
    (bandRole ?? '').toLowerCase() === 'admin' ? 'admin' : 'member';

  const neon = (t: any) => t.palette?.secondary?.main ?? '#8B5CF6';

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        minWidth: 0,
        aspectRatio: '1 / 1',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        boxShadow: '0 10px 24px rgba(0,0,0,.28)',
        transition:
          'transform .16s ease, box-shadow .16s ease, border-color .16s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          zIndex: 1,
          boxShadow: (theme) =>
            `0 0 0 2px rgba(255,255,255,0.18), 0 0 0 10px ${
              theme.palette.secondary
                ? `${theme.palette.secondary.main}59`
                : 'rgba(139,92,246,0.35)'
            }`,
          borderColor: 'rgba(255,255,255,0.12)',
        },
      }}
    >
      <CardActionArea
        component={NextLink}
        href={`/bands/${id}`}
        aria-label={`Open ${name}`}
        sx={{ width: '100%', height: '100%' }}
      >
        <CardContent
          sx={{
            p: 1.25,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            gap: 1,
          }}
        >
          {/* Top: logo/initials */}
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
            <Avatar
              src={avatarUrl}
              alt={name}
              sx={{
                width: { xs: 64, sm: 72, md: 84 },
                height: { xs: 64, sm: 72, md: 84 },
                fontWeight: 800,
                letterSpacing: 0.5,
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.06),
                color: 'common.white',
                border: `2px solid ${alpha('#fff', 0.06)}`,
                backgroundImage: (theme) =>
                  `radial-gradient(120% 120% at 20% 15%, ${alpha(
                    neon(theme),
                    0.16
                  )} 0%, transparent 55%)`,
              }}
            >
              {initials(name)}
            </Avatar>
          </Box>

          {/* Bottom: name + pill */}
          <Tooltip
            title={name}
            arrow
            PopperProps={{
              modifiers: [{ name: 'offset', options: { offset: [0, 10] } }],
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: alpha('#0B0A10', 0.95),
                  color: 'common.white',
                  px: 1.5,
                  py: 1,
                  fontSize: '0.95rem',
                  borderRadius: 1.5,
                  maxWidth: 360,
                  boxShadow:
                    '0 10px 30px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06)',
                },
              },
              arrow: { sx: { color: alpha('#0B0A10', 0.95) } },
            }}
            disableInteractive
          >
            <Typography
              variant="subtitle1"
              noWrap
              aria-label={name}
              sx={{
                fontWeight: 800,
                letterSpacing: 0.2,
                color: alpha('#fff', 0.95),
              }}
            >
              {name}
            </Typography>
          </Tooltip>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 0.25,
            }}
          >
            <RolePill role={normalizedRole} />
            {/* <Chip size="small" variant="outlined" label="3 events" /> */}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
