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

type TabKey = 'overview' | 'events' | 'roster';
type MembershipRole = 'admin' | 'member';

type ProfileLite = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type MemberRow = {
  user_id: string;
  role: MembershipRole;
  profile: ProfileLite | null;
};

type Props = {
  bandId: string;
};

type InvitationRow = {
  id: string;
  email: string;
  role: MembershipRole;
  created_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
};

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
  const [invites, setInvites] = useState<InvitationRow[]>([]);

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

  const fetchRoster = useCallback(async () => {
    try {
      let roster: any[] | null = null;
      {
        const { data, error } = await sb
          .from('band_member_profiles')
          .select('user_id, role, email, first_name, last_name')
          .eq('band_id', bandId);
        if (!error) {
          roster = data ?? [];
        }
      }

      // Fallback: memberships + profiles
      if (!roster) {
        const { data: memberships, error: mErr } = await sb
          .from('band_members')
          .select('user_id, role')
          .eq('band_id', bandId);
        if (mErr) throw mErr;

        const userIds = (memberships ?? []).map((r) => r.user_id);
        const profilesById = new Map<string, ProfileLite>();

        if (userIds.length) {
          const { data: profs } = await sb
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', userIds);
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
          role: r.role === 'admin' ? 'admin' : 'member',
          first_name: profilesById.get(r.user_id)?.first_name ?? null,
          last_name: profilesById.get(r.user_id)?.last_name ?? null,
          email: profilesById.get(r.user_id)?.email ?? null,
        }));
      }

      const normalized: MemberRow[] = (roster ?? []).map((r: any) => ({
        user_id: r.user_id,
        role: r.role === 'admin' ? 'admin' : 'member',
        profile: {
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
          email: r.email ?? null,
        },
      }));
      setMembers(normalized);

      // Pending invitations
      const { data: invs } = await sb
        .from('band_invitations')
        .select('id, email, role, created_at, status')
        .eq('band_id', bandId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setInvites(invs ?? []);
    } catch (e) {
      console.error('fetchRoster error', e);
    }
  }, [sb, bandId]);

  /**
   * Initial load: auth + role + band + roster + invites
   */
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

        step = 'membership:role';
        const { data: mem, error: memErr } = await sb
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band (no membership).');
          return;
        }
        setMyRole((mem.role as MembershipRole) ?? 'member');

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

        // Load roster + invites
        await fetchRoster();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('BandSheet load error at step:', step, e);
        setError(`Failed to load band (step: ${step}) — ${msg}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb, bandId, fetchRoster]);

  /**
   * Open Invite dialog via ?openInvite=1, then clean URL
   */
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;

    const shouldOpen = sp.get('openInvite') === '1';
    if (shouldOpen) {
      setInviteOpen(true);

      const next = new URLSearchParams(sp.toString());
      next.delete('openInvite');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /**
   * Realtime: refresh when memberships or invitations change for this band
   */
  useEffect(() => {
    const channel = sb
      .channel(`band:${bandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'band_members',
          filter: `band_id=eq.${bandId}`,
        },
        () => fetchRoster()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'band_invitations',
          filter: `band_id=eq.${bandId}`,
        },
        () => fetchRoster()
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, bandId, fetchRoster]);

  const isAdmin = (myRole ?? 'member') === 'admin';

  const sendInvite = useCallback(async () => {
    try {
      setSending(true);

      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) throw new Error('Not signed in');

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
          role: inviteRole,
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

      // Close + toast
      setInviteOpen(false);
      setInviteEmail('');
      setSnack({
        open: true,
        message: `Invite sent to ${email}`,
        severity: 'success',
      });

      // Optimistic add
      setInvites((prev) => [
        {
          id: crypto.randomUUID?.() ?? `${Date.now()}`,
          email,
          role: inviteRole,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        ...prev,
      ]);

      // Sync with DB (in case backend enriched/normalized anything)
      fetchRoster();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invite failed';
      setSnack({ open: true, message: msg, severity: 'error' });
    } finally {
      setSending(false);
    }
  }, [bandId, inviteEmail, inviteRole, bandName, fetchRoster]);

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
        direction="row"
        alignItems="center"
        sx={{
          mb: 2, // a bit tighter
          bgcolor: 'background.paper',
          borderRadius: 2,
          px: 2,
          py: 1.25,
          border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.08)}`,
          gap: 1.25, // closer to the title
        }}
      >
        {/* Title takes the left; allow shrink + ellipsis on mobile */}
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <BandTitleMenu
            bandId={bandId}
            bandName={bandName}
            onInvite={() => setInviteOpen(true)}
            isAdmin={myRole === 'admin'} // ← true for admins
          />
        </Box>

        {/* Pill on the far right */}
        <Box sx={{ flex: '0 0 auto', ml: 'auto' }}>
          <RolePill
            role={isAdmin ? 'admin' : 'member'}
            size="small"
            sx={{
              mr: { xs: 0.75, sm: 0 }, // tiny edge padding on mobile
              px: { xs: 1.25, sm: 1 },
              height: 24,
              '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 } },
            }}
          />
        </Box>
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
      </Tabs>

      {/* Panels */}
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
            Members
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
              <Typography sx={{ fontWeight: 700 }}>
                {(m.profile?.first_name || '') +
                  ' ' +
                  (m.profile?.last_name || '')}
              </Typography>
              <Typography color="text.secondary">
                {m.profile?.email ?? ''}
              </Typography>
              <Box sx={{ flex: 1 }} />
              {/* This will need to be changed to band role!! */}
              {/* <RolePill role={m.role} size="small" /> */}
            </Stack>
          ))}

          {/* Pending invitations */}
          {invites.length > 0 && (
            <>
              <Typography sx={{ mt: 3, mb: 1.5 }} color="text.secondary">
                Pending invitations
              </Typography>
              {invites.map((inv) => (
                <Stack
                  key={inv.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    py: 1,
                    borderBottom: (t) =>
                      `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>(Invited)</Typography>
                  <Typography color="text.secondary">{inv.email}</Typography>
                  <Box sx={{ flex: 1 }} />
                  <RolePill role={inv.role} size="small" />
                </Stack>
              ))}
            </>
          )}
        </Box>
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
