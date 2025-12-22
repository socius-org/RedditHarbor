'use client';

import { useClerk } from '@clerk/clerk-react';
import { Button } from '#app/components/ui/button.tsx';

export { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={() => {
        void signOut();
      }}
    >
      Sign out
    </Button>
  );
}
