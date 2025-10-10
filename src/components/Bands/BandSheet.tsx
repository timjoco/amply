/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import RolePill from '@/components/RolePill';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SettingsIcon from '@mui/icons-material/Settings';
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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';

type TabKey = 'overview' | 'events' | 'roster' | 'chords' | 'settings';
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

export default function BandSheet({ bandId }: { bandId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('member');
  const [inviting, setInviting] = useState(false);

  const [myRole, setMyRole] = useState<MembershipRole>('member');
  const [bandName, setBandName] = useState<string>('Band');
  const [tab, setTab] = useState<TabKey>('overview');

  // NEW: keep roster in state
  const [members, setMembers] = useState<MemberRow[]>([]);

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

  const isAdmin = (myRole ?? 'member') === 'admin';

  const sendInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      setError(null);

      if (!isAdmin) throw new Error('Only admins can invite');

      // 1) Get access token (RLS needs this)
      const { data: sessionData, error: sessErr } = await sb.auth.getSession();
      if (sessErr) throw sessErr;
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not signed in');

      // 2) Build absolute URL (avoids any basePath quirks)
      const url = `${window.location.origin}/api/bands/${bandId}/invite`;
      console.log('POST', url);

      // 3) Hit the API
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`, // critical for RLS
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole, // 'member' | 'admin'
          bandName, // optional
        }),
      });

      const raw = await res.text(); // capture body exactly once
      let body: any = {};
      try {
        body = JSON.parse(raw);
      } catch {
        /* non-JSON error body */
      }

      if (!res.ok) {
        console.error('Invite API error:', {
          status: res.status,
          url,
          body: raw,
        });
        const msg = body?.error || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      // success
      console.log('Invite API success:', body);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (e: any) {
      console.error('sendInvite failed:', e);
      setError(e?.message ?? 'Failed to create invite');
    } finally {
      setInviting(false);
    }
  }, [sb, bandId, inviteEmail, inviteRole, isAdmin, bandName]);

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
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
            {bandName}
          </Typography>

          <RolePill role={isAdmin ? 'admin' : 'member'} size="small" />
        </Stack>

        <Box sx={{ flex: 1 }} />

        {isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<GroupAddIcon />}
              onClick={() => setInviteOpen(true)}
              sx={(t) => ({
                borderRadius: 999,
                textTransform: 'none',
                px: 2,
                backgroundImage:
                  'linear-gradient(90deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)',
                backgroundSize: '200% 100%',
                boxShadow: `0 0 0 1px ${alpha(
                  t.palette.primary.main,
                  0.35
                )}, 0 10px 24px rgba(0,0,0,.35)`,
                '&:hover': { backgroundPosition: '100% 0' },
              })}
            >
              Invite
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 999, textTransform: 'none' }}
            >
              New Event
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              sx={{ borderRadius: 999, textTransform: 'none' }}
            >
              Band Settings
            </Button>
          </Stack>
        )}
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
        {isAdmin && <Tab label="Settings" value="settings" />}
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
              <Typography sx={{ fontWeight: 700 }}>
                {(m.profile?.first_name || '') +
                  ' ' +
                  (m.profile?.last_name || '')}
              </Typography>
              <Typography color="text.secondary">
                {m.profile?.email ?? ''}
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                <RolePill role={m.band_role} size="small" />
              </Box>
            </Stack>
          ))}
        </Box>
      )}
      {tab === 'chords' && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Chord sheets library for this band.
        </Typography>
      )}
      {tab === 'settings' && isAdmin && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Band name, slug, visibility, delete band…
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
            disabled={inviting || !inviteEmail.trim()}
            startIcon={
              inviting ? <CircularProgress size={18} /> : <GroupAddIcon />
            }
            sx={{ borderRadius: 999, textTransform: 'none' }}
          >
            {inviting ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
