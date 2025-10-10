// src/types/db.ts
export type MembershipRole = 'admin' | 'member';

export type Band = {
  id: string;
  name: string;
};

export type BandMembershipRow = {
  band_id: string;
  user_id: string;
  band_role: MembershipRole;
  created_at: string;
};
