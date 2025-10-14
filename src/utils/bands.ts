import type { Band, MembershipRole } from '@/types/db';

/** A band record enriched with the current user's membership role. */
export type BandWithRole = Band & { role?: MembershipRole }; // Band already has avatar_url

/** Minimal shape from Supabase join. */
type BandLite = {
  id?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

/** Row shape returned by: from('band_members').select('role, bands(id, name, avatar_url)') */
export type RawMembershipRow = {
  role?: string | null;
  bands?: BandLite | BandLite[] | null;
};

export function normalizeRole(role: unknown): MembershipRole | undefined {
  const r = String(role ?? '')
    .toLowerCase()
    .trim();
  if (r === 'admin' || r === 'member') return r;
  return undefined;
}

export function mapMembershipRowsToBands(
  rows: RawMembershipRow[] | null | undefined
): BandWithRole[] {
  return (rows ?? [])
    .map((r) => {
      const raw = r.bands;
      const b: BandLite | undefined = Array.isArray(raw)
        ? raw[0]
        : raw ?? undefined;
      const id = b?.id ?? undefined;
      const name = (b?.name ?? '').trim();
      if (!id || !name) return null;

      return {
        id: String(id),
        name: String(name),
        avatar_url: b?.avatar_url ?? null, // ← carry it through
        role: normalizeRole(r.role), // may be undefined
      } as BandWithRole;
    })
    .filter((x): x is BandWithRole => Boolean(x));
}

/** Admin first, then member, then unknown roles last. */
export function sortBandsByRolePriority(bands: BandWithRole[]): BandWithRole[] {
  const order: Record<Exclude<MembershipRole, never> | 'unknown', number> = {
    admin: 0,
    member: 1,
    unknown: 2,
  };
  return [...bands].sort((a, b) => {
    const aKey = a.role ?? 'unknown';
    const bKey = b.role ?? 'unknown';
    return order[aKey] - order[bKey] || a.name.localeCompare(b.name);
  });
}
