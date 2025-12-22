'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertAction, AlertTitle } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';

function ProjectsErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{Error.isError(error) ? `${error}` : 'Failed to load projects'}</AlertTitle>
      <AlertAction>
        <Button variant="outline" size="xs" onClick={resetErrorBoundary}>
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function ProjectsErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary FallbackComponent={ProjectsErrorFallback}>{children}</ErrorBoundary>;
}
