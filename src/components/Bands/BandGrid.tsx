'use client';

import { Box } from '@mui/material';
import { useEffect } from 'react';
import BandTile from './BandTile';

export type BandLite = {
  id: string;
  name: string;
  role: 'admin' | 'member';
  avatarUrl?: string | null;
};

type Props = {
  bands: BandLite[];
  selectedId?: string;
  tileSize?: number;
};

export default function BandGrid({ bands, selectedId, tileSize = 180 }: Props) {
  useEffect(() => {
    console.log(
      '[DEBUG] BandGrid received bands',
      bands.map((b) => b.name)
    );
  }, [bands]);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1.25, sm: 1.5, md: 2, lg: 2.25 },
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(130px, 1fr))',
          sm: 'repeat(3, minmax(140px, 1fr))',
          md: `repeat(auto-fill, minmax(${Math.max(
            tileSize - 40,
            140
          )}px, 1fr))`,
          lg: `repeat(auto-fill, minmax(${Math.max(
            tileSize - 20,
            160
          )}px, 1fr))`,
          xl: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
        },
        alignItems: 'start',
      }}
    >
      {bands.map((b) => (
        <BandTile
          key={b.id}
          id={b.id}
          name={b.name}
          bandRole={b.role}
          avatarUrl={b.avatarUrl ?? undefined}
          selected={selectedId === b.id}
          size={tileSize}
        />
      ))}
    </Box>
  );
}
