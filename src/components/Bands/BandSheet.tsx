/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import BandTitleMenu from '@/components/Bands/BandTitleMenu';
import RolePill from '@/components/RolePill';
import { supabaseBrowser } from '@/lib/supabaseClient';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type TabKey = 'overview' | 'events' | 'roster' | 'chords';
type MembershipRole = 'admin' | 'member';

type ProfileLite = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type MemberRow = {
  user_id: string;
  band_role: MembershipRole;
  profile: ProfileLite | null;
};

type Props = {
  bandId: string; // make sure you pass this in from the page
};

// const BandHeaderServer = dynamic(
//   () => import('@/app/bands/[id]/BandHeaderServer'),
//   { ssr: true }
// );

export default function BandSheet({ bandId }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('member');

  const [myRole, setMyRole] = useState<MembershipRole>('member');
  const [bandName, setBandName] = useState<string>('Band');
  const [tab, setTab] = useState<TabKey>('overview');

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      let step = 'init';
      try {
        setLoading(true);
        setError(null);

        step = 'auth:getUser';
        const {
          data: { user },
          error: userErr,
        } = await sb.auth.getUser();
        if (userErr) throw userErr;
        if (!alive) return;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        // 1) My role (use the real column "role" and alias it to band_role)
        step = 'membership:role';
        const { data: mem, error: memErr } = await sb
          .from('band_memberships')
          .select('band_role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band (no membership).');
          return;
        }
        setMyRole((mem.band_role as MembershipRole) ?? 'member');

        // 2) Band name (maybeSingle + guard)
        step = 'bands:fetch';
        const { data: band, error: bandErr } = await sb
          .from('bands')
          .select('id,name')
          .eq('id', bandId)
          .maybeSingle();
        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found or you do not have access.');
          return;
        }
        setBandName(band.name);

        // 3) Roster (prefer the view; if it fails, fall back to two-step)
        step = 'roster:view';
        let roster: any[] | null = null;
        {
          const { data, error } = await sb
            .from('band_member_profiles') // requires the view to exist
            .select('user_id, band_role, email, first_name, last_name')
            .eq('band_id', bandId);
          if (error) {
            console.warn(
              'band_member_profiles view failed, will fallback:',
              error
            );
          } else {
            roster = data ?? [];
          }
        }

        // Fallback path without the view
        if (!roster) {
          step = 'roster:memberships';
          const { data: memberships, error: mErr } = await sb
            .from('band_memberships')
            .select('user_id, band_role')
            .eq('band_id', bandId);
          if (mErr) throw mErr;

          const userIds = (memberships ?? []).map((r) => r.user_id);
          const profilesById = new Map<string, ProfileLite>();

          if (userIds.length) {
            step = 'roster:profiles';
            const { data: profs, error: pErr } = await sb
              .from('profiles')
              .select('id, first_name, last_name, email')
              .in('id', userIds);
            if (pErr) throw pErr;

            (profs ?? []).forEach((p: any) =>
              profilesById.set(p.id, {
                first_name: p.first_name ?? null,
                last_name: p.last_name ?? null,
                email: p.email ?? null,
              })
            );
          }

          roster = (memberships ?? []).map((r: any) => ({
            user_id: r.user_id,
            band_role: r.band_role === 'admin' ? 'admin' : 'member',
            first_name: profilesById.get(r.user_id)?.first_name ?? null,
            last_name: profilesById.get(r.user_id)?.last_name ?? null,
            email: profilesById.get(r.user_id)?.email ?? null,
          }));
        }

        const normalized: MemberRow[] = roster.map((r: any) => ({
          user_id: r.user_id,
          band_role: r.band_role === 'admin' ? 'admin' : 'member',
          profile: {
            first_name: r.first_name ?? null,
            last_name: r.last_name ?? null,
            email: r.email ?? null,
          },
        }));

        setMembers(normalized);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('BandSheet load error at step:', e);
        setError(`Failed to load band (step: ${step}) — ${msg}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb, bandId]);

  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;

    const shouldOpen = sp.get('openInvite') === '1';
    if (shouldOpen) {
      setInviteOpen(true);

      // Remove the param so it doesn't re-trigger on refresh/back
      const next = new URLSearchParams(sp.toString());
      next.delete('openInvite');

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // We intentionally depend only on searchParams so it reacts to route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isAdmin = (myRole ?? 'member') === 'admin';

  const sendInvite = useCallback(async () => {
    try {
      setSending(true);

      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) throw new Error('Not signed in');

      // basic client-side email check (optional)
      const email = inviteEmail.trim();
      if (!email) throw new Error('Please enter an email address');

      const res = await fetch(`/api/bands/${bandId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          band_role: inviteRole, // <-- use the role from the dialog
          bandName,
        }),
      });

      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const payload = ct.includes('application/json')
          ? await res.json()
          : await res.text();
        const msg =
          typeof payload === 'string'
            ? payload
            : payload?.error || 'Invite failed';
        throw new Error(msg);
      }

      // success: close and notify
      setInviteOpen(false); // <-- close the *actual* dialog
      setInviteEmail('');
      setSnack({
        open: true,
        message: `Invite sent to ${email}`,
        severity: 'success',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invite failed';
      setSnack({ open: true, message: msg, severity: 'error' });
    } finally {
      setSending(false);
    }
  }, [bandId, inviteEmail, inviteRole, bandName]);

  if (loading) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 4 }}>
        <Typography variant="h6">Loading band…</Typography>
        <CircularProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 4 }}>
      {error && (
        <Alert
          severity="error"
          sx={(t) => ({
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(t.palette.error.main, 0.35),
            backgroundColor: alpha(t.palette.error.main, 0.06),
          })}
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Stack
        direction={{ xs: 'row', sm: 'row' }}
        alignItems="center"
        spacing={2}
        sx={{
          mb: 2.5,
          bgcolor: 'background.paper',
          borderRadius: 2,
          px: 2,
          py: 1.5,
          border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.08)}`,
        }}
      >
        <BandTitleMenu
          bandId={bandId}
          bandName={bandName}
          onInvite={isAdmin ? () => setInviteOpen(true) : undefined}
        />
        <Box sx={{ flex: 1, alignItems: 'center' }} />
        <RolePill
          role={isAdmin ? 'admin' : 'member'}
          size="small"
          sx={{ alignSelf: 'center' }}
        />
      </Stack>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v as TabKey)}
        textColor="inherit"
        indicatorColor="primary"
        sx={(t) => ({
          mb: 2,
          borderBottom: '1px solid',
          borderColor: alpha(t.palette.primary.main, 0.18),
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
        })}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Events" value="events" />
        <Tab label="Roster" value="roster" />
        <Tab label="Chord Sheets" value="chords" />
      </Tabs>

      {/* Panels (placeholder content) */}
      {tab === 'overview' && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Quick stats, next event, recent activity…
        </Typography>
      )}
      {tab === 'events' && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Events list (filter, create, edit) goes here.
        </Typography>
      )}
      {tab === 'roster' && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            Members &amp; invitations
          </Typography>
          {members.map((m) => (
            <Stack
              key={m.user_id}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                py: 1,
                borderBottom: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
              }}
            >
              <Box sx={{ ml: 'auto' }}>
                <RolePill role={m.band_role} size="small" />
              </Box>
              <Typography sx={{ fontWeight: 700 }}>
                {(m.profile?.first_name || '') +
                  ' ' +
                  (m.profile?.last_name || '')}
              </Typography>
              <Typography color="text.secondary">
                {m.profile?.email ?? ''}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}
      {tab === 'chords' && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Chord sheets library for this band.
        </Typography>
      )}

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: (t) => ({
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.28),
            backdropFilter: 'blur(8px)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          }),
        }}
      >
        <DialogTitle>Invite member</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
            />
            <TextField
              label="Role"
              select
              fullWidth
              value={inviteRole}
              onChange={(e) =>
                setInviteRole((e.target.value as MembershipRole) ?? 'member')
              }
            >
              <MenuItem value="member">Member (view)</MenuItem>
              <MenuItem value="admin">Admin (manage)</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={sendInvite}
            disabled={sending || !inviteEmail.trim()}
            startIcon={
              sending ? <CircularProgress size={18} /> : <GroupAddIcon />
            }
            sx={{ borderRadius: 999, textTransform: 'none' }}
          >
            {sending ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
