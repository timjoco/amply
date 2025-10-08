'use client';

import { Button, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/bands', label: 'Bands' },
  { href: '/events', label: 'Events' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <Stack direction="row" spacing={1}>
      {links.map((l) => {
        const active = pathname?.startsWith(l.href);
        return (
          <Button
            key={l.href}
            component={NextLink}
            href={l.href}
            size="small"
            color="inherit"
            sx={(t) => ({
              borderRadius: 999,
              textTransform: 'none',
              px: 1.5,
              minHeight: 34,
              ...(active && {
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.35),
                backgroundColor: alpha('#7C3AED', 0.12),
              }),
              ...(!active && {
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.18),
                '&:hover': {
                  backgroundColor: alpha('#7C3AED', 0.08),
                  borderColor: alpha(t.palette.primary.main, 0.35),
                },
              }),
            })}
          >
            {l.label}
          </Button>
        );
      })}
    </Stack>
  );
}
