'use client';

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import RolePill from './RolePill';

type Props = {
  id: string;
  name: string;
  bandRole?: string;
  height?: number;
};

export default function BandCard({ id, name, bandRole, height = 220 }: Props) {
  const normalizedRole: 'admin' | 'member' =
    (bandRole ?? '').toLowerCase() === 'admin' ? 'admin' : 'member';

  return (
    <Card
      elevation={0}
      sx={{
        height,
        borderRadius: 2,
        border: '1px solid transparent',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
        transition: 'transform .2s ease, box-shadow .2s ease',
        display: 'flex',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 10px 24px rgba(0,0,0,.35)',
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/bands/${id}`}
        sx={{ borderRadius: 2, height: '100%' }}
      >
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {/* Glowing role pill */}
          <Box sx={{ alignSelf: 'flex-start' }}>
            <RolePill role={normalizedRole} />
          </Box>

          {/* Band name */}
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {name}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'left' }}
          >
            Manage events, members, and settings.
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
