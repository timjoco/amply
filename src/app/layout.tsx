// src/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
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
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <div className="mx-auto max-w-6xl px-4">
          <header className="flex items-center justify-between py-6">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              <span className="text-white">Amply</span>
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
                beta
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/bands" className="hover:text-white/80">
                Bands
              </a>
              <a href="/venues" className="hover:text-white/80">
                Venues
              </a>
              <a href="/requests" className="hover:text-white/80">
                Requests
              </a>
              <a
                href="/signup"
                className="rounded-lg bg-white text-black px-3 py-1.5 font-medium hover:bg-white/90"
              >
                Sign up
              </a>
            </nav>
          </header>
          {children}
          <footer className="py-12 text-center text-sm text-white/40">
            © {new Date().getFullYear()} Amply — Amplify your gigs.
          </footer>
        </div>
      </body>
    </html>
  );
}
