'use client';

import Chip from '@mui/material/Chip';
import { alpha, keyframes } from '@mui/material/styles';

type Props = {
  role: 'admin' | 'member';
  size?: 'small' | 'medium';
};

const pulse = keyframes`
  0%   { transform: translateZ(0) scale(1);   opacity: .75; }
  50%  { transform: translateZ(0) scale(1.04); opacity: 1; }
  100% { transform: translateZ(0) scale(1);   opacity: .75; }
`;

export default function RolePill({ role, size = 'small' }: Props) {
  const isAdmin = role === 'admin';

  return (
    <Chip
      size={size}
      label={role.toUpperCase()}
      sx={(t) => ({
        // prevent stretching in flex/Stack parents
        alignSelf: 'flex-start',
        display: 'inline-flex',
        width: 'auto',
        maxWidth: 'max-content',
        flexShrink: 0,

        fontWeight: 800,
        letterSpacing: 0.6,
        borderRadius: 999,
        px: 1.25,
        // Admin
        ...(isAdmin
          ? {
              color: '#fff',
              backgroundImage:
                'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)',
              backgroundSize: '200% 100%',
              border: `1px solid ${alpha(t.palette.primary.main, 0.55)}`,

              boxShadow: `
                inset 0 0 10px ${alpha('#A855F7', 0.45)},
                0 0 12px ${alpha('#7C3AED', 0.55)},
                0 0 32px ${alpha('#7C3AED', 0.35)}
              `,
              position: 'relative',
              overflow: 'visible',

              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -6,
                borderRadius: 999,
                background:
                  'radial-gradient(closest-side, rgba(168,85,247,.35), transparent 70%)',
                filter: 'blur(6px)',
                zIndex: -1,
                animation: `${pulse} 2.8s ease-in-out infinite`,
                pointerEvents: 'none',
              },

              transition: 'background-position .4s ease, box-shadow .2s ease',
              '&:hover': {
                backgroundPosition: '100% 0%',
                boxShadow: `
                  inset 0 0 12px ${alpha('#A855F7', 0.55)},
                  0 0 16px ${alpha('#7C3AED', 0.65)},
                  0 0 42px ${alpha('#7C3AED', 0.45)}
                `,
              },
            }
          : {
              // MEMBER
              color: alpha('#fff', 0.9),
              backgroundColor: alpha('#A855F7', 0.1),
              border: `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
              boxShadow: `inset 0 0 0 1px ${alpha('#A855F7', 0.06)}`,
            }),
      })}
    />
  );
}
