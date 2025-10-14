/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import BandGrid from '@/components/Bands/BandGrid';
import NoBandsNoEventsPaper from '@/components/Bands/NoBandNoEventsPaper';
import GlobalCreate from '@/components/GlobalCreate';
import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  mapMembershipRowsToBands,
  sortBandsByRolePriority,
  type BandWithRole,
} from '@/utils/bands';

import {
  Alert,
  alpha,
  Box,
  Card,
  CardActions,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
}

/** Merge server results into current state without dropping optimistic items. */
function mergeBands(current: BandWithRole[], incoming: BandWithRole[]) {
  const map = new Map<string, BandWithRole>();
  current.forEach((b) => map.set(b.id, b));
  incoming.forEach((b) => {
    const prev = map.get(b.id);
    map.set(b.id, prev ? { ...prev, ...b } : b);
  });
  return sortBandsByRolePriority(Array.from(map.values()));
}

export default function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bands, setBands] = useState<BandWithRole[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const match = pathname.match(/\/bands\/([0-9a-f-]{10,})/i);
  const currentBandId = match?.[1];

  const pageGutterSx = { mx: { xs: 1.5, sm: 2.5, md: 4 } } as const;

  // Parent callback from GlobalCreate — optimistic prepend.
  const handleBandCreated = (band: { id: string; name: string }) => {
    setBands((prev) =>
      prev.some((b) => b.id === band.id)
        ? prev
        : [{ id: band.id, name: band.name, role: 'admin' }, ...prev]
    );
  };

  const cardSx = (t: any) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3,
    border: '1px solid',
    borderColor: alpha(t.palette.primary.main, 0.22),
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    backdropFilter: 'blur(6px)',
    boxShadow: `0 0 0 1px ${alpha(
      t.palette.primary.main,
      0.12
    )}, 0 10px 30px rgba(0,0,0,.35)`,
  });

  const gridSx = {
    display: 'grid',
    gap: 2.5,
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, minmax(0, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
      xl: 'repeat(4, minmax(0, 1fr))',
    },
  } as const;

  const sectionTitleSx = {
    mt: 1,
    mb: 1,
    letterSpacing: 0.3,
    fontWeight: 700,
  } as const;

  useEffect(() => {
    const sb = supabaseBrowser();
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!mounted) return;
        if (!user) {
          router.replace('/login?next=/dashboard');
          return;
        }

        try {
          const { error: rpcErr } = await sb.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883')
            console.warn('[ensure_profile]', rpcErr.message);
        } catch (e) {
          console.warn('[ensure_profile] RPC call failed:', e);
        }

        const { data: rows, error: mErr } = await sb
          .from('band_members')
          .select('role, bands(id, name)')
          .eq('user_id', user.id);
        if (mErr) throw mErr;

        if (mounted) {
          const incoming = mapMembershipRowsToBands(rows);
          setBands((prev) => mergeBands(prev, incoming));
        }
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError(getErrorMessage(e) || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) router.replace('/login?next=/dashboard');
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  // Realtime: when a band_member row is inserted for me, fetch the band and prepend if missing.
  useEffect(() => {
    let isMounted = true;
    const sb = supabaseBrowser();

    (async () => {
      const { data: auth } = await sb.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      const channel = sb
        .channel('bands-for-me')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'band_members',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            if (!isMounted) return;
            const bandId = (payload.new as any)?.band_id;
            if (!bandId) return;

            const { data: band } = await sb
              .from('bands')
              .select('id, name')
              .eq('id', bandId)
              .single();
            if (!band) return;

            setBands((prev) => {
              if (prev.some((b) => b.id === band.id)) return prev;
              const role = (payload.new as any)?.role || 'member';
              return [{ id: band.id, name: band.name, role }, ...prev];
            });
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        sb.removeChannel(channel);
      };
    })();
  }, []);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 4 }}>
      <GlobalCreate
        open={createOpen}
        onOpenChange={setCreateOpen}
        trigger="none"
        onBandCreated={handleBandCreated}
      />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
          Your Dashboard
        </Typography>
        {error && (
          <Alert
            severity="error"
            sx={(t) => ({
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(t.palette.error.main, 0.35),
              backgroundColor: alpha(t.palette.error.main, 0.06),
            })}
          >
            {error}
          </Alert>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ ...pageGutterSx }}>
          <Box sx={gridSx}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} sx={cardSx}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{ mt: 2, borderRadius: 2 }}
                  />
                </CardContent>
                <CardActions
                  sx={(t) => ({
                    borderTop: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.12),
                  })}
                >
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={36}
                    sx={{ borderRadius: 999 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={120}
                    height={36}
                    sx={{ borderRadius: 999 }}
                  />
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>
      ) : (
        <>
          {/* Bands section */}
          <Box sx={pageGutterSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Bands
            </Typography>
          </Box>

          {bands.length === 0 ? (
            <Box sx={{ ...pageGutterSx, mt: 1 }}>
              <NoBandsNoEventsPaper
                kind="bands"
                onPrimary={() => setCreateOpen(true)}
                maxWidth="100%"
                contentMaxWidth="100%"
                center
              />
            </Box>
          ) : (
            <Box sx={{ ...pageGutterSx, mt: 1 }}>
              <BandGrid
                tileSize={180}
                selectedId={currentBandId}
                bands={bands.map((b) => ({
                  id: b.id,
                  name: b.name,
                  role: (b.role?.toLowerCase() === 'admin'
                    ? 'admin'
                    : 'member') as 'admin' | 'member',
                }))}
              />
            </Box>
          )}

          {/* Events section */}
          <Box sx={{ ...pageGutterSx, mt: 3 }}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Events
            </Typography>
          </Box>

          <Box sx={pageGutterSx}>
            <NoBandsNoEventsPaper
              kind="events"
              onPrimary={() => setCreateOpen(true)}
              maxWidth="100%"
              contentMaxWidth="100%"
              center
            />
          </Box>
        </>
      )}
    </Box>
  );
}
