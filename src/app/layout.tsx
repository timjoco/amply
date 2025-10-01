// src/app/layout.tsx
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amplee',
  description: 'A CRM built for musicians by musicians.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRouterCacheProvider>
      <html>
        <body>
          <Header />
          {children}
          <Footer />
        </body>
      </html>
    </AppRouterCacheProvider>
  );
}
