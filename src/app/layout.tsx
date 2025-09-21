// src/app/layout.tsx
import Header from '@/components/Header';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amply — Book Bands Faster',
  description: 'Bands & venues connect and confirm gigs in minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <AppRouterCacheProvider>
        <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
          <div className="mx-auto max-w-6xl px-4">
            <Header />
            {children}
            <footer className="py-12 text-center text-sm text-white/40">
              © {new Date().getFullYear()} Amply — Amplify your gigs.
            </footer>
          </div>
        </body>
      </AppRouterCacheProvider>
    </html>
  );
}
