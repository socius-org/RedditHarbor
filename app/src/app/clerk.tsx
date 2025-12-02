'use client';

import { useClerk } from '@clerk/clerk-react';
import Button from '@mui/material/Button';

export { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <Button
      color="inherit"
      size="small"
      onClick={() => {
        void signOut();
      }}
    >
      Sign out
    </Button>
  );
}
