import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { ThemeProvider } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { theme } from './theme';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, SignOutButton } from './clerk';
import { ApiKeysButton } from './ApiKeysButton';
import { ApiKeysDialogProvider } from './ApiKeysDialogContext';
import { ReactQueryClientProvider } from './ReactQueryClientProvider';

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

function AppHeader() {
  return (
    <AppBar position="sticky">
      <Toolbar variant="dense">
        <Stack direction="row" alignItems="center" spacing={2} flex={1}>
          <Typography variant="h6" component="div">
            RedditHarbor
          </Typography>
          <Typography color="inherit" sx={{ opacity: 0.7 }}>
            PETLP framework
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ApiKeysButton />
          <SignOutButton />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <html lang="en" className={roboto.variable}>
        <body>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
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
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
