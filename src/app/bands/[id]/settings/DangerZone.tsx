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
  isAdmin,
}: {
  bandId: string;
  bandName: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setErr(null);
    try {
      const supabase = supabaseBrowser();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-band`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ bandId }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      // Success: bounce to dashboard
      router.replace('/dashboard');
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? 'Failed to delete band');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderColor: 'error.main', mt: 6 }}>
      <CardContent>
        <Typography variant="h6" color="error" gutterBottom>
          Danger Zone
        </Typography>
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
          onClick={() => setOpen(true)}
          disabled={!isAdmin}
        >
          Delete Band
        </Button>

        <Dialog open={open} onClose={() => setOpen(false)}>
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
            {err && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {err}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={confirm.trim() !== bandName || loading}
              onClick={handleDelete}
            >
              {loading ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
