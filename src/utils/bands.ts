import type { Band, MembershipRole } from '@/types/db';

/**
 * A band record enriched with the current user's membership role.
 * Example roles supported here: 'admin' | 'member'
 * 'editor' to be added here update normalizeRole + sort order.)
 */
export type BandWithRole = Band & { role: MembershipRole };

/** Minimal shape for a related band returned from Supabase joins. */
type BandLite = { id?: string | null; name?: string | null };

/**
 * Row shape returned by:
 *   from('band_members').select('role, bands(id, name)')
 * Supabase may return `bands` as a single object or an array depending
 * on the join; we handle both.
 */
export type RawMembershipRow = {
  role?: string | null;
  bands?: BandLite | BandLite[] | null;
};

/**
 * Normalize any incoming role-like value to a supported MembershipRole.
 * - Lowercases and trims input.
 * - Falls back to 'member' if unexpected.
 * NOTE: 'editor', to be added to the allowlist here.
 */
export function normalizeRole(role: unknown): MembershipRole {
  const r = String(role ?? '')
    .toLowerCase()
    .trim();
  if (r === 'admin' || r === 'member') return r;
  console.warn(
    '[normalizeRole] unexpected role, defaulting to "member":',
    role
  );
  return 'member';
}

/**
 * Convert raw membership join rows into clean BandWithRole items.
 * - Accepts both `bands` as object or array (uses the first element).
 * - Filters out rows without a valid id/name.
 * - Normalizes the role via `normalizeRole`.
 */
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
        role: normalizeRole(r.role),
      } as BandWithRole;
    })
    .filter((x): x is BandWithRole => Boolean(x));
}

/**
 * Stable sort that prioritizes bands by role, then alphabetically by name.
 * Current priority: admin (0) before member (1).
 * once 'editor' is added, extend the order map accordingly.
 */
export function sortBandsByRolePriority(bands: BandWithRole[]): BandWithRole[] {
  const order: Record<MembershipRole, number> = {
    admin: 0,
    member: 1,
  };
  return [...bands].sort(
    (a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name)
  );
}
