'use client';

import theme from '@/theme';
import { CssBaseline, ThemeProvider } from '@mui/material';

export default function ThemeClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
