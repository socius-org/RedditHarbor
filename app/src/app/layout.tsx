import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, SignOutButton } from './clerk';
import { ApiKeysButton } from './ApiKeysButton';
import { ApiKeysDialogProvider } from './ApiKeysDialogContext';
import { ReactQueryClientProvider } from './ReactQueryClientProvider';

const RAW_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!RAW_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk publishable key');
}
const PUBLISHABLE_KEY = RAW_PUBLISHABLE_KEY;

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  icons: { icon: '/favicon.png' },
  title: 'RedditHarbor',
};

function AppHeader() {
  return (
    <header className="bg-background sticky top-0 z-50 border-b">
      <div className="flex h-12 px-4">
        <div className="flex flex-1 items-center gap-4">
          <span className="text-xl font-medium">RedditHarbor</span>
          <span className="text-muted-foreground">PETLP framework</span>
        </div>
        <div className="flex items-center gap-2">
          <ApiKeysButton />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider attribute="class" disableTransitionOnChange>
            <ReactQueryClientProvider>
              <SignedIn>
                <ApiKeysDialogProvider>
                  <AppHeader />
                  {children}
                </ApiKeysDialogProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </ReactQueryClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
