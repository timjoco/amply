import AppFrame from '@/components/AppFrame';
import EmotionRegistry from '@/components/EmotionRegistry';
import ThemeClient from '@/components/ThemeClient';
import type { Metadata } from 'next';
import './globals.css';

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
          </ThemeClient>
        </EmotionRegistry>
      </body>
    </html>
  );
}
