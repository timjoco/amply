/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
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
import { useEffect, useState } from 'react';

type Props = {
  id: string;
  name: string;
  bandRole?: MembershipRole;
  /** Storage path like "bandId/uuid.jpg" (NO leading slash) */
  avatarPath?: string | undefined;
  /** Optional direct URL(s) if you ever pass them */
  avatarUrl?: string | undefined;
  avatar_url?: string | undefined;
  size?: number;
  selected?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default function BandTile({
  id,
  name,
  avatarPath,
  avatarUrl,
  avatar_url,
}: Props) {
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);
  const [signErr, setSignErr] = useState<string | undefined>(undefined);

  const neon = (t: any) => t.palette?.secondary?.main ?? '#8B5CF6';

  // Sign the storage path when using a private bucket
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSignErr(undefined);
      if (!avatarPath) {
        setSignedUrl(undefined);
        return;
      }

      // Defensive: ensure we're passing a *path*, not a full URL
      const looksLikeUrl = /^https?:\/\//i.test(avatarPath);
      if (looksLikeUrl) {
        console.warn(
          '[BandTile] avatarPath looks like a URL; expected a storage path',
          { avatarPath }
        );
      }

      try {
        const sb = supabaseBrowser();
        const { data, error } = await sb.storage
          .from('band-avatars')
          .createSignedUrl(avatarPath, 60 * 60); // 1 hour

        if (cancelled) return;
        if (error) {
          setSignErr(error.message || 'Failed to sign URL');
          setSignedUrl(undefined);
        } else {
          setSignedUrl(data?.signedUrl);
        }
      } catch (e: any) {
        if (cancelled) return;
        setSignErr(e?.message ?? 'Failed to sign URL');
        setSignedUrl(undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  // Prefer explicit URL if provided; else use signed URL from path
  const src: string | undefined =
    avatarUrl ?? avatar_url ?? signedUrl ?? undefined;

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
            containerType: 'inline-size',
          }}
        >
          {/* Top: logo/initials */}
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
            <Avatar
              src={src} // must be string | undefined (never null)
              alt={name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement & { src?: string }).src =
                  '';
              }}
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
              title={signErr ? `Avatar error: ${signErr}` : undefined}
            >
              {initials(name)}
            </Avatar>
          </Box>

          {/* Bottom: name */}
          <Box
            sx={{
              mt: 0.25,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flexWrap: 'wrap',
              '@container (min-width: 340px)': { flexWrap: 'nowrap' },
            }}
          >
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
                  flexBasis: '100%',
                  flexGrow: 1,
                  minWidth: 0,
                  textAlign: 'center',
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  color: alpha('#fff', 0.95),
                  lineHeight: 1.2,
                  '@container (min-width: 340px)': {
                    flexBasis: 'auto',
                    textAlign: 'left',
                  },
                }}
              >
                {name}
              </Typography>
            </Tooltip>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
