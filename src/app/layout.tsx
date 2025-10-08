// src/app/layout.tsx
import AppFrame from '@/components/AppFrame'; // server wrapper that passes initialAuthed
import EmotionRegistry from '@/components/EmotionRegistry';
import ThemeClient from '@/components/ThemeClient'; // or your ThemeProvider+CssBaseline wrapper
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
