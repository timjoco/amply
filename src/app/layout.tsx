'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import theme from '@/theme'; // your custom MUI theme
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
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh', // keep footer at bottom on short pages
            }}
          >
            <Header />

            <Box component="main" sx={{ flexGrow: 1 }}>
              {/* Use a Container here if you want consistent page gutters */}
              <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                {children}
              </Container>
            </Box>

            <Footer />
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
