import { supabaseBrowser } from '@/lib/supabaseClient';

export type CreateBandParams = {
  name: string;
  avatarFile?: File | null;
  dispatchEvent?: boolean;
};
export type CreatedBand = {
  id: string;
  name: string;
  avatar_url: string | null;
};

function fmtErr(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyE = e as any;
    // Supabase errors often have these:
    return (
      anyE.message ||
      anyE.error_description ||
      anyE.error ||
      anyE.hint ||
      JSON.stringify(anyE)
    );
  }
  return String(e);
}

export async function createBand(
  params: CreateBandParams
): Promise<CreatedBand> {
  const { name, avatarFile, dispatchEvent = true } = params;
  const sb = supabaseBrowser();

  const trimmed = name.trim();
  if (!trimmed) throw new Error('Band name is required.');

  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error('You must be signed in.');

  // 1) Call RPC that inserts into bands (your DB trigger adds the creator as admin)
  const { data: rpcData, error: rpcErr } = await sb.rpc('create_band', {
    p_name: trimmed,
  });
  if (rpcErr) throw new Error(fmtErr(rpcErr));

  const row = Array.isArray(rpcData) ? rpcData?.[0] : rpcData;
  if (!row?.id || !row?.name)
    throw new Error('create_band did not return { id, name }.');

  let avatar_url: string | null = null;

  if (avatarFile) {
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${row.id}/${crypto.randomUUID()}.${ext}`;

    // ⬇️ upload to private bucket
    const { error: upErr } = await sb.storage
      .from('band-avatars')
      .upload(path, avatarFile, { upsert: true, cacheControl: '3600' });
    if (upErr) throw new Error(upErr.message);

    // ⬇️ store the *path* (not a public URL)
    const { error: updErr } = await sb
      .from('bands')
      .update({ avatar_url: path })
      .eq('id', row.id);
    if (updErr) throw new Error(updErr.message);

    // return the path to the UI; BandTile will sign it
    avatar_url = path;
  }
  const created: CreatedBand = {
    id: String(row.id),
    name: String(row.name),
    avatar_url,
  };

  if (dispatchEvent && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bands:created', { detail: created }));
  }

  return { id: String(row.id), name: String(row.name), avatar_url };
}
