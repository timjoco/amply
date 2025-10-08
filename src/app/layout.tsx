'use client';

import AppFrame from '@/components/AppFrame';
import Footer from '@/components/Footer';
import theme from '@/theme';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import * as React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppFrame>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh', // keep footer at bottom on short pages
              }}
            >
              <Box component="main" sx={{ flexGrow: 1 }}>
                <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                  {children}
                </Container>
              </Box>

              <Footer />
            </Box>
          </ThemeProvider>
        </AppFrame>
      </body>
    </html>
  );
}
