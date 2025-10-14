'use client';

import type { MembershipRole } from '@/types/db';
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import RolePill from '../RolePill';

type Props = {
  id: string;
  name: string;
  bandRole?: MembershipRole;
  height?: number;
  dense?: boolean;
};

export default function BandCard({ id, name, bandRole, height = 175 }: Props) {
  const FOOTER_H = 44;
  const normalizedRole: 'admin' | 'member' =
    (bandRole ?? '').toLowerCase() === 'admin' ? 'admin' : 'member';

  return (
    <Card
      elevation={0}
      sx={{
        height,
        position: 'relative',
        borderRadius: 2,
        border: '1px solid transparent',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
        transition: 'transform .2s ease, box-shadow .2s ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 10px 24px rgba(0,0,0,.35)',
        },
      }}
      variant="glass"
    >
      <CardActionArea
        component={Link}
        href={`/bands/${id}`}
        sx={{ borderRadius: 2 }}
      >
        <CardContent
          sx={{
            px: 1.5,
            pt: 2,
            pb: FOOTER_H,
            '&:last-child': { pb: FOOTER_H },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              lineHeight: 1.18,
              letterSpacing: 0.2,
              fontSize: {
                xs: 'clamp(1.15rem, 6vw, 1.6rem)',
                sm: 'clamp(1.35rem, 4.2vw, 1.9rem)',
                md: 'clamp(1.6rem, 3vw, 2.2rem)',
                lg: 'clamp(1.8rem, 2.4vw, 2.5rem)',
              },
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxHeight: 'calc(2 * 1.18em)',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            {name}
          </Typography>
        </CardContent>
      </CardActionArea>

      <CardActions
        disableSpacing
        sx={() => ({
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: FOOTER_H,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1,

          backgroundColor: 'transparent',
        })}
      >
        <RolePill role={normalizedRole} />
      </CardActions>
    </Card>
  );
}
