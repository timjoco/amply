'use client';

import AddIcon from '@mui/icons-material/Add';
import { Box, Card, CardActionArea, Typography } from '@mui/material';

type Props = { onClick: () => void; height?: number };

export default function AddBandTile({ onClick, height = 220 }: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        height,
        borderRadius: 2,
        border: '1px dashed rgba(168,85,247,0.6)',
        background: 'rgba(255,255,255,0.02)',
        transition:
          'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 10px 24px rgba(0,0,0,.35)',
          borderColor: 'rgba(168,85,247,0.9)',
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ height: '100%', borderRadius: 2 }}
      >
        <Box
          sx={{
            height: '100%',
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.25,
          }}
        >
          <AddIcon />
          <Typography variant="h5" fontWeight={700}>
            Add Band
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
