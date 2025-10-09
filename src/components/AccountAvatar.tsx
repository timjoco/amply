'use client';

import { Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function AccountAvatar({
  size = 40,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <Avatar
      sx={(t) => ({
        width: size,
        height: size,
        fontWeight: 800,
        fontSize: Math.max(12, Math.round(size * 0.38)),
        letterSpacing: 0.25,
        color: '#fff',
        border: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.45),
        background:
          'radial-gradient(120px 120px at 30% 20%, rgba(168,85,247,0.8), rgba(124,58,237,0.9))',
        boxShadow: `0 0 0 1px ${alpha(
          t.palette.primary.main,
          0.12
        )}, 0 6px 16px rgba(0,0,0,.35)`,
      })}
    >
      {children}
    </Avatar>
  );
}
