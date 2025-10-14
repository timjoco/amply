/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Box,
  Button,
  CardContent,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { ResponsiveStyleValue } from '@mui/system';
import Image from 'next/image';
import Link from 'next/link';

type Kind = 'bands' | 'events';

type Props = {
  kind: Kind;
  onPrimary?: () => void;
  primaryHref?: string;
  primaryLabel?: string;
  title?: string;
  subtitle?: string;
  // we’ll keep these for compatibility, but default to 100% so both are identical
  maxWidth?: ResponsiveStyleValue<number | string>;
  contentMaxWidth?: ResponsiveStyleValue<number | string>;
  showLogo?: boolean;
  center?: boolean;
};

const defaultsByKind: Record<
  Kind,
  { title: string; subtitle: string; primaryLabel: string }
> = {
  bands: {
    title: 'Everything your band needs, all in one place.',
    subtitle: 'Schedule rehearsals, manage shows, and share setlists',
    primaryLabel: 'Create Your First Band',
  },
  events: {
    title: 'No events booked yet',
    subtitle: 'Create your first event and assign it to a band.',
    primaryLabel: 'Add Your First Event',
  },
};

export default function NoBandsNoEventsPaper({
  kind,
  onPrimary,
  primaryHref,
  primaryLabel,
  title,
  subtitle,
  showLogo,
  center = true,
  // full-bleed: both cards same width across breakpoints
  maxWidth = '100%',
  contentMaxWidth = '100%',
}: Props) {
  const defs = defaultsByKind[kind];
  const _title = title ?? defs.title;
  const _subtitle = subtitle ?? defs.subtitle;
  const _primaryLabel = primaryLabel ?? defs.primaryLabel;
  const _showLogo = showLogo ?? true;

  const ButtonProps = onPrimary
    ? { onClick: onPrimary }
    : {
        component: Link as any,
        href:
          primaryHref ??
          (kind === 'bands' ? '/onboarding?step=band' : '/events/new'),
      };

  return (
    <Paper
      variant="glass"
      sx={{
        // stretch the container to the section width at ALL breakpoints
        width: '100%',
        maxWidth, // defaults to 100%
        mx: 0, // no centering margin
        justifySelf: 'stretch', // if used inside a CSS grid
        alignSelf: 'stretch', // if used inside flex
      }}
    >
      {/* Add a small inner gutter that scales down on larger screens
          so we get closer to edges without touching */}
      <CardContent sx={{ px: { xs: 1.25, sm: 1.5, md: 2 }, pt: 0, pb: 0 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, // text left / CTA right on desktop
            alignItems: { xs: 'stretch', md: 'center' },
            gap: { xs: 2, md: 3 },
            pt: { xs: 1.25, sm: 1.5, md: 1.75 },
            pb: { xs: 1.25, sm: 1.5, md: 1.75 },
          }}
        >
          {/* Text column */}
          <Stack
            spacing={1.25}
            alignItems={{
              xs: center ? 'center' : 'flex-start',
              md: 'flex-start',
            }}
            textAlign={{ xs: center ? 'center' : 'left', md: 'left' }}
            sx={{ maxWidth: contentMaxWidth, width: '100%' }}
          >
            {_showLogo && (
              <Image
                src="/logo.png" // swap to transparent asset if available
                alt="Amplee"
                width={48}
                height={48}
                priority
                style={{ display: 'block' }}
              />
            )}

            <Typography
              sx={{
                fontWeight: 800,
                lineHeight: 1.2,
                fontSize: {
                  xs: 'clamp(1.05rem, 3.5vw, 1.25rem)',
                  sm: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                  md: '1.5rem',
                },
              }}
            >
              {_title}
            </Typography>

            {_subtitle && (
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.92rem', md: '0.98rem' },
                }}
              >
                {_subtitle}
              </Typography>
            )}
          </Stack>

          {/* CTA column */}
          <Stack
            direction="row"
            justifyContent={{
              xs: center ? 'center' : 'flex-start',
              md: 'flex-end',
            }}
            alignItems="center"
            sx={{ width: '100%', px: { xs: 1, sm: 0 } }} // tiny inset on mobile
          >
            <Button
              variant="contained"
              {...ButtonProps}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                width: { xs: '100%', md: 'auto' },
                maxWidth: { xs: 480, md: 'unset' },
                px: { xs: 1.75, sm: 2.5 },
                py: { xs: 0.9, sm: 1.1 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
                borderRadius: 3,
              }}
            >
              {_primaryLabel}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Paper>
  );
}
