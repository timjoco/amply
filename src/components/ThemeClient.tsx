'use client';

import theme from '@/theme';
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';

export default function ThemeClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={(t) => ({
          'html, body, #__next, body > div:first-of-type': {
            minHeight: '100%',
            backgroundColor: `${t.palette.background.default} !important`,
          },
          body: { margin: 0 },
        })}
      />
      {children}
    </ThemeProvider>
  );
}
