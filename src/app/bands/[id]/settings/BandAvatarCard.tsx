/* eslint-disable @typescript-eslint/no-explicit-any */
// app/bands/[id]/settings/BandAvatarCard.tsx
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  bandId: string;
  bandName: string;
  initialPath?: string;
  /** When true, render a smaller, right-rail style card */
  compact?: boolean;
};

export default function BandAvatarCard({
  bandId,
  bandName,
  initialPath,
  compact = false,
}: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [currentPath, setCurrentPath] = useState<string | undefined>(
    initialPath
  );
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);
  const [signErr, setSignErr] = useState<string | undefined>(undefined);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSignErr(undefined);
      setSignedUrl(undefined);
      if (!currentPath) return;
      const { data, error } = await sb.storage
        .from('band-avatars')
        .createSignedUrl(currentPath, 3600);
      if (!cancelled) {
        if (error) setSignErr(error.message);
        else setSignedUrl(data?.signedUrl);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, currentPath]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image.');
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setError('Max size is 3MB.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.currentTarget.value = '';
  }

  async function onSave() {
    if (!pendingFile) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const ext = pendingFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${bandId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await sb.storage
        .from('band-avatars')
        .upload(path, pendingFile, { upsert: true, cacheControl: '3600' });
      if (upErr) throw new Error(upErr.message);

      const { error: updErr } = await sb
        .from('bands')
        .update({ avatar_url: path })
        .eq('id', bandId);
      if (updErr) throw new Error(updErr.message);

      setCurrentPath(path);
      setPendingFile(null);
      setPreviewUrl(null);
      setSuccessMsg('Avatar updated!');
    } catch (e: any) {
      setError(e?.message || 'Failed to update avatar');
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setPendingFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccessMsg(null);
  }

  const avatarSize = compact ? 72 : 88;

  return (
    <Card>
      <CardHeader
        title="Band Avatar"
        subheader={compact ? undefined : 'Upload a new image for your band'}
        sx={{ pb: 0.5 }}
      />
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={previewUrl || signedUrl || undefined}
            alt={bandName}
            sx={{ width: avatarSize, height: avatarSize, fontWeight: 800 }}
          >
            {bandName.trim().slice(0, 2).toUpperCase()}
          </Avatar>

          <Stack spacing={1.25} sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                component="label"
                size={compact ? 'small' : 'medium'}
              >
                {previewUrl
                  ? 'Choose another'
                  : currentPath
                  ? 'Change avatar'
                  : 'Add avatar'}
                <input hidden type="file" accept="image/*" onChange={onPick} />
              </Button>

              {previewUrl ? (
                <>
                  <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={saving}
                    startIcon={
                      saving ? <CircularProgress size={18} /> : undefined
                    }
                    size={compact ? 'small' : 'medium'}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    onClick={onCancel}
                    size={compact ? 'small' : 'medium'}
                  >
                    Cancel
                  </Button>
                </>
              ) : null}
            </Stack>

            {!compact && currentPath && !previewUrl && (
              <TextField
                label="Storage path"
                value={currentPath}
                size="small"
                InputProps={{ readOnly: true }}
              />
            )}

            {signErr && (
              <Typography variant="caption" color="error">
                Signed URL error: {signErr}
              </Typography>
            )}
            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
            {successMsg && (
              <Typography variant="caption" color="success.main">
                {successMsg}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
