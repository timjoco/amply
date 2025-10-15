import FooterGuard from '@/components/Footers/FooterGuard';
import AppFrame from '@/components/Styling/AppFrame';
import EmotionRegistry from '@/components/Styling/EmotionRegistry';
import ThemeClient from '@/components/Styling/ThemeClient';
import type { Metadata } from 'next';
import './globals.css';
import GlobalCreateHost from './shared/GlobalCreateHost'; // ← add this

export const metadata: Metadata = {
  title: 'Amplee',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <EmotionRegistry>
          <ThemeClient>
            <AppFrame>{children}</AppFrame>
            <GlobalCreateHost />
            <FooterGuard />
          </ThemeClient>
        </EmotionRegistry>
      </body>
    </html>
  );
}
