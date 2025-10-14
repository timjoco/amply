'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

type Props = {
  bandId: string;
  initialName: string;
};

export default function BandBasicsCard({ bandId, initialName }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSave() {
    const next = name.trim();
    if (!next) {
      setErr('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const { error } = await sb
        .from('bands')
        .update({ name: next })
        .eq('id', bandId);

      if (error) throw new Error(error.message);
      setOk('Band name updated.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message || 'Failed to update band name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Band Basics"
        subheader="Update your band’s display name"
      />
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            label="Band name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr(null);
              setOk(null);
            }}
            size="small"
            fullWidth
            inputProps={{ maxLength: 100 }}
          />
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving || name.trim() === initialName.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>

        {err && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: 'block' }}
          >
            {err}
          </Typography>
        )}
        {ok && (
          <Typography
            variant="caption"
            color="success.main"
            sx={{ mt: 1, display: 'block' }}
          >
            {ok}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
