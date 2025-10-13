'use client';

import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import Image from 'next/image';

type Props = {
  onCreate?: () => void;
  createHref?: string;
  subtitle?: string;
};

// this is the component for when a profile has no bands - it will show this instead
export default function EmptyStateStartBand({
  onCreate,
  createHref = '/onboarding?step=band',
}: // subtitle = 'You don’t have any bands yet.',
Props) {
  const CreateButton = (
    <Button
      variant="contained"
      color="primary"
      size="medium"
      startIcon={<LibraryMusicIcon />}
      onClick={onCreate}
      {...(!onCreate ? { href: createHref } : {})}
      sx={{ textTransform: 'none', px: 2.5 }}
    >
      Create Your First Band
    </Button>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderStyle: 'dashed',
        borderColor: (t) =>
          t.palette.mode === 'dark' ? 'divider' : 'grey.300',
        bgcolor: (t) =>
          t.palette.mode === 'dark' ? 'background.default' : 'grey.50',
        p: { xs: 2, md: 3 },
      }}
    >
      <CardContent>
        <Stack
          direction="column"
          spacing={2}
          alignItems="center"
          textAlign="center"
        >
          <Image
            src="/logo.png"
            alt="Amplee"
            width={56}
            height={56}
            priority
            style={{ display: 'block' }}
          />

          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={700}>
              {`Everything your band needs, all in one place.`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule rehearsals, manage shows, and share setlists
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {CreateButton}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
