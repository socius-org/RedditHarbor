import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { ButtonTest } from './ButtonTest';

// TODO: switch to Inter
// const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const roboto = Roboto({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  icons: { icon: '/favicon.png' },
  title: 'RedditHarbor',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <ButtonTest />
        </ThemeProvider>
      </body>
    </html>
  );
}
