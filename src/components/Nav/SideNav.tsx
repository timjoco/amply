'use client';

import AccountMenu from '@/components/AccountMenu';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/HomeRounded';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_WIDTH = 240;

const primaryItems = [{ href: '/dashboard', label: 'Home', Icon: HomeIcon }];

export default function SideNav() {
  const pathname = usePathname();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [, setInitials] = useState('U');

  // Auth state
  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s?.user);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Derive initials for avatar (after authed)
  useEffect(() => {
    if (authed !== true) return;

    (async () => {
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;

      const { data: profile } = await sb
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      const name =
        [profile?.first_name, profile?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        (user.user_metadata?.name as string | undefined) ||
        user.email ||
        '';

      const derived =
        name
          .split(/\s+/)
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U';

      setInitials(derived);
    })();
  }, [authed]);

  if (authed !== true) return null;

  return (
    <Box
      component="nav"
      sx={(t) => ({
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        zIndex: 1000,
        top: 0,
        left: 0,
        width: NAV_WIDTH,
        height: '100dvh',
        bgcolor: '#0B0B10',
        color: 'common.white',
        borderRight: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.22),
        p: 2,
        gap: 1.5,
      })}
    >
      {/* Logo */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Link
          href="/dashboard"
          prefetch={false}
          aria-label="Amplee Home"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 0.5 }}
          >
            <Image
              src="/logo.png"
              alt="Amplee"
              width={28}
              height={28}
              priority
              style={{ display: 'block', borderRadius: 6 }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, letterSpacing: 0.5 }}
            >
              AMPLEE
            </Typography>
          </Box>
        </Link>
      </Box>

      <Divider
        sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.18) })}
      />

      {/* Primary nav (Home) */}
      <Stack spacing={0.75} sx={{ mt: 1 }}>
        {primaryItems.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Button
              key={href}
              component={Link}
              href={href}
              startIcon={<Icon />}
              color="inherit"
              prefetch={false}
              sx={(t) => ({
                justifyContent: 'flex-start',
                borderRadius: 2,
                px: 1.25,
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: 0.2,
                border: '1px solid',
                borderColor: active
                  ? alpha(t.palette.primary.main, 0.35)
                  : alpha(t.palette.primary.main, 0.18),
                backgroundColor: active
                  ? alpha('#7C3AED', 0.12)
                  : 'transparent',
                '&:hover': {
                  backgroundColor: alpha('#7C3AED', 0.08),
                  borderColor: alpha(t.palette.primary.main, 0.35),
                },
                '& .MuiButton-startIcon': { mr: 1 },
              })}
            >
              {label}
            </Button>
          );
        })}

        {/* CREATE — opens GlobalCreate via global event */}
        <Button
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur?.();
            window.dispatchEvent(new CustomEvent('global-create:open'));
          }}
          startIcon={<AddIcon />}
          color="inherit"
          sx={(t) => ({
            justifyContent: 'flex-start',
            borderRadius: 2,
            px: 1.25,
            minHeight: 40,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: 0.2,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.18),
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: alpha('#7C3AED', 0.08),
              borderColor: alpha(t.palette.primary.main, 0.35),
            },
            '& .MuiButton-startIcon': { mr: 1 },
          })}
        >
          Create
        </Button>
      </Stack>

      <Box sx={{ flex: 1 }} />

      {/* Account menu (avatar dropdown) */}
      <Box
        sx={{ display: 'flex', justifyContent: 'flex-start', px: 0.5, pb: 0.5 }}
      >
        <AccountMenu size={40} />
      </Box>
    </Box>
  );
}

export const SIDE_NAV_WIDTH = NAV_WIDTH;
