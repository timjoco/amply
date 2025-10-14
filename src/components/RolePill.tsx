/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Chip, type ChipProps } from '@mui/material';
import {
  alpha,
  keyframes,
  type SxProps,
  type Theme,
} from '@mui/material/styles';

type Role = 'admin' | 'member';

type Props = Omit<ChipProps, 'label' | 'color'> & {
  role: Role;
  sx?: SxProps<Theme>;
};

const pulse = keyframes`
  0%   { transform: translateZ(0) scale(1);    opacity: .75; }
  50%  { transform: translateZ(0) scale(1.04); opacity: 1;   }
  100% { transform: translateZ(0) scale(1);    opacity: .75; }
`;

function toObjectSx(
  sx: SxProps<Theme> | undefined,
  theme: Theme
): Record<string, any> {
  if (!sx) return {};
  if (typeof sx === 'function')
    return (sx as (t: Theme) => Record<string, any>)(theme);
  if (Array.isArray(sx)) {
    return sx.reduce<Record<string, any>>((acc, item) => {
      if (!item) return acc;
      if (typeof item === 'function')
        return { ...acc, ...(item as any)(theme) };
      return { ...acc, ...(item as Record<string, any>) };
    }, {});
  }
  return sx as Record<string, any>;
}

export default function RolePill({ role, size = 'small', sx, ...rest }: Props) {
  const isAdmin = role === 'admin';
  const label = isAdmin ? 'Admin' : 'Member';

  return (
    <Chip
      size={size}
      label={label.toUpperCase()}
      sx={(theme) => {
        const base = {
          alignSelf: 'flex-start',
          display: 'inline-flex',
          width: 'auto',
          maxWidth: { xs: 120, sm: 'max-content' }, // <-- cap width on very small screens
          flexShrink: 0,

          borderRadius: 999,
          // responsive root padding & height
          px: { xs: 0.75, sm: 1.25 }, // <-- tighter on xs
          height: { xs: 22, sm: 28 }, // <-- shorter on xs
          fontWeight: 800,
          letterSpacing: { xs: 0.4, sm: 0.6 }, // <-- slightly less letterspacing on xs

          // ensure inner label isn't adding extra padding
          '& .MuiChip-label': {
            paddingInline: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: { xs: 10, sm: 12 }, // <-- smaller font on xs
            lineHeight: 1.1,
          },

          ...(isAdmin
            ? {
                color: '#fff',
                backgroundImage:
                  'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)',
                backgroundSize: '200% 100%',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.55)}`,
                boxShadow: `
                  inset 0 0 10px ${alpha('#A855F7', 0.45)},
                  0 0 12px ${alpha('#7C3AED', 0.55)},
                  0 0 32px ${alpha('#7C3AED', 0.35)}
                `,
                position: 'relative',
                overflow: 'visible',
                // softer glow on xs to avoid overlapping nearby text
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: { xs: -2, sm: -6 }, // <-- smaller halo on xs
                  borderRadius: 999,
                  background: {
                    xs: 'transparent', // <-- disable halo on xs
                    sm: 'radial-gradient(closest-side, rgba(168,85,247,.35), transparent 70%)',
                  },
                  filter: { xs: 'none', sm: 'blur(6px)' },
                  zIndex: -1,
                  animation: {
                    xs: 'none',
                    sm: `${pulse} 2.8s ease-in-out infinite`,
                  },
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
                color: alpha('#fff', 0.8),
                backgroundColor: alpha('#A855F7', 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                boxShadow: `inset 0 0 0 1px ${alpha('#A855F7', 0.06)}`,
              }),
        };

        const user = toObjectSx(sx, theme);
        return { ...base, ...user };
      }}
      {...rest}
    />
  );
}
