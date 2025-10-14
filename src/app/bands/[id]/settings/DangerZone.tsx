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
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DangerZone({
  bandId,
  bandName,
}: {
  bandId: string;
  bandName: string;
}) {
  const router = useRouter();
  const supabase = supabaseBrowser(); // ✅ reuse your browser client

  // Delete band dialog state (admins)
  const [openDelete, setOpenDelete] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

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

  const confirmMatches = confirm.trim() === bandName; // or case-insensitive if you prefer

  return (
    <Card variant="outlined" sx={{ borderColor: 'error.main', mt: 6 }}>
      <CardContent>
        <Typography variant="h6" color="error" gutterBottom>
          Danger Zone
        </Typography>

        {/* ADMIN: Delete band */}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Deleting <b>{bandName}</b> will remove the band, its events,
          memberships, and related data. This cannot be undone.
        </Typography>

        <Button
          variant="contained"
          color="error"
          onClick={() => setOpenDelete(true)}
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
