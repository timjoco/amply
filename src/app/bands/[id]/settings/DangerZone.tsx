/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DangerZone({
  bandId,
  bandName,
  isAdmin,
}: {
  bandId: string;
  bandName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = supabaseBrowser(); // ✅ reuse your browser client

  // Delete band dialog state (admins)
  const [openDelete, setOpenDelete] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  // Leave band dialog state (members)
  const [openLeave, setOpenLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveErr, setLeaveErr] = useState<string | null>(null);

  // --- Delete band (admin only) ---
  async function handleDelete() {
    try {
      setDeleting(true);
      setDeleteErr(null);

      // Get user access token (optional but recommended if your function validates admin via user JWT)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-band`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // IMPORTANT: both headers for the functions gateway
            Authorization: `Bearer ${
              accessToken ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            }`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({ band_id: bandId }), // ✅ use the prop
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Delete failed (${res.status})`);
      }

      // Success → close dialog and go back to dashboard
      setOpenDelete(false);
      router.replace('/dashboard');
      router.refresh();
    } catch (e: any) {
      setDeleteErr(e?.message ?? 'Failed to delete band');
    } finally {
      setDeleting(false);
    }
  }

  // --- Leave band (member only) ---
  const handleLeave = async () => {
    setLeaving(true);
    setLeaveErr(null);
    try {
      // Try RPC if present; otherwise fallback delete of own membership
      const rpc = await supabase.rpc('leave_band', { p_band: bandId });

      if (rpc.error && rpc.error.code !== '42883') {
        // 42883 = function undefined; fallback below
        throw new Error(rpc.error.message);
      }

      if (rpc.error) {
        const {
          data: { user },
          error: uErr,
        } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!user) throw new Error('Not authenticated');

        const { error: dErr } = await supabase
          .from('band_members')
          .delete()
          .eq('band_id', bandId)
          .eq('user_id', user.id);

        if (dErr) throw dErr;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (e: any) {
      setLeaveErr(e.message ?? 'Failed to leave band');
    } finally {
      setLeaving(false);
      setOpenLeave(false);
    }
  };

  const confirmMatches = confirm.trim() === bandName; // or case-insensitive if you prefer

  return (
    <Card variant="outlined" sx={{ borderColor: 'error.main', mt: 6 }}>
      <CardContent>
        <Typography variant="h6" color="error" gutterBottom>
          Danger Zone
        </Typography>

        {/* MEMBER: Leave band */}
        {!isAdmin && (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Leaving <b>{bandName}</b> removes your access to this band’s
              events, chats, and files. You can rejoin only via a new invite
              from an admin.
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenLeave(true)}
              sx={{ mb: 2, textTransform: 'none' }}
            >
              Leave band
            </Button>

            <Dialog
              open={openLeave}
              onClose={() => !leaving && setOpenLeave(false)}
            >
              <DialogTitle>Leave “{bandName}”?</DialogTitle>

              <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Type the band name to confirm. You’ll lose access immediately.
                </Typography>
                <TextField
                  fullWidth
                  autoFocus
                  label="Type band name to confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {leaveErr && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {leaveErr}
                  </Alert>
                )}
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setOpenLeave(false)} disabled={leaving}>
                  Cancel
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleLeave}
                  disabled={leaving || !confirmMatches}
                  sx={{ textTransform: 'none' }}
                >
                  {leaving ? 'Leaving…' : 'Confirm leave'}
                </Button>
              </DialogActions>
            </Dialog>

            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* ADMIN: Delete band */}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Deleting <b>{bandName}</b> will remove the band, its events,
          memberships, and related data. This cannot be undone.
        </Typography>
        {!isAdmin && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Only band admins can delete this band.
          </Alert>
        )}
        <Button
          variant="contained"
          color="error"
          onClick={() => setOpenDelete(true)}
          disabled={!isAdmin}
          sx={{ textTransform: 'none' }}
        >
          Delete band
        </Button>

        <Dialog
          open={openDelete}
          onClose={() => !deleting && setOpenDelete(false)}
        >
          <DialogTitle>Delete “{bandName}”?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Type the band name to confirm. This action permanently removes the
              band and all its events.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              label="Type band name to confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {deleteErr && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteErr}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={!confirmMatches || deleting}
              onClick={handleDelete} // ✅ no missing arg
              sx={{ textTransform: 'none' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
