/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const handler = async (req: Request) => {
  try {
    const { bandId } = await req.json();
    if (!bandId) return new Response('bandId required', { status: 400 });

    // End-user auth (to check admin) – pass the caller's JWT from the request
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    const userClient = createClient(SUPABASE_URL, jwt ?? '');
    // Quick guard: ensure caller is authenticated
    const { data: user } = await userClient.auth.getUser();
    if (!user?.user) return new Response('Unauthorized', { status: 401 });

    // Use service client for storage/admin ops
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Verify admin via RPC (no deletes yet)
    const can = await admin.rpc('is_band_admin', {
      p_band_id: bandId /* uses service key; safe */,
    });
    if (can.error || !can.data)
      return new Response('Forbidden', { status: 403 });

    // 2) List file prefixes to remove
    // Band-level bucket
    const bandFiles = await admin.storage
      .from('band-files')
      .list(bandId, { limit: 1000, search: '' });
    if (!bandFiles.error) {
      for (const obj of bandFiles.data ?? []) {
        // delete each object under /{bandId}/
        await admin.storage
          .from('band-files')
          .remove([`${bandId}/${obj.name}`]);
      }
    }
    // Event-level bucket: enumerate event folders by band
    // If you track event file paths as {eventId}/{uuid}, get event IDs first:
    const ev = await admin.from('events').select('id').eq('band_id', bandId);
    if (!ev.error) {
      for (const e of ev.data ?? []) {
        const list = await admin.storage
          .from('event-files')
          .list(e.id, { limit: 1000, search: '' });
        if (!list.error) {
          const paths = list.data?.map((o: any) => `${e.id}/${o.name}`) ?? [];
          if (paths.length)
            await admin.storage.from('event-files').remove(paths);
        }
      }
    }

    // 3) Delete the band row (cascades)
    const del = await admin.rpc('delete_band_and_rows', { p_band_id: bandId });
    if (del.error) throw del.error;

    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(`Error: ${e}`, { status: 500 });
  }
};

Deno.serve(handler);
