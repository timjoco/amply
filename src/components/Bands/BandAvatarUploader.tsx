'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { Avatar, Box, Button, LinearProgress, Stack } from '@mui/material';
import { useState } from 'react';

type Props = {
  bandId: string;
  currentUrl?: string | null;
  onChange?: (url: string) => void;
};

export default function BandAvatarUploader({
  bandId,
  currentUrl,
  onChange,
}: Props) {
  const [preview, setPreview] = useState<string | undefined>(
    currentUrl ?? undefined
  );
  const [uploading, setUploading] = useState(false);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please choose an image');
    if (file.size > 3 * 1024 * 1024) return alert('Max size is 3MB');

    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert('You must be signed in');

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${bandId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('band-avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (upErr) {
      setUploading(false);
      return alert(upErr.message);
    }

    const { data: pub } = supabase.storage
      .from('band-avatars')
      .getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: dbErr } = await supabase
      .from('bands')
      .update({ avatar_url: publicUrl })
      .eq('id', bandId);

    if (dbErr) {
      setUploading(false);
      return alert(dbErr.message);
    }

    setPreview(publicUrl);
    setUploading(false);
    onChange?.(publicUrl);
  }

  return (
    <Stack spacing={1.5} alignItems="center">
      <Avatar
        src={preview}
        alt="Band avatar"
        sx={{ width: 96, height: 96, fontWeight: 800 }}
      />
      <Box>
        <Button variant="outlined" component="label">
          Change band photo
          <input
            hidden
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onSelect}
          />
        </Button>
      </Box>
      {uploading && <LinearProgress sx={{ width: 200 }} />}
    </Stack>
  );
}
