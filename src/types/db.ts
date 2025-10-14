// src/types/db.ts
export type MembershipRole = 'admin' | 'member';

export type Band = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type BandMembershipRow = {
  band_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
};
