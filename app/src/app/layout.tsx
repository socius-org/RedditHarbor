import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from './clerk';

const RAW_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!RAW_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk publishable key');
}
const PUBLISHABLE_KEY = RAW_PUBLISHABLE_KEY;

const roboto = Roboto({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  icons: { icon: '/favicon.png' },
  title: 'RedditHarbor',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <html lang="en" className={roboto.variable}>
        <body>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SignedIn>{children}</SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
