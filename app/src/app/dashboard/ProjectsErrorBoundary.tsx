'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

function ProjectsErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={resetErrorBoundary}>
          Retry
        </Button>
      }
    >
      {Error.isError(error) ? `${error}` : 'Failed to load projects'}
    </Alert>
  );
}

export function ProjectsErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary FallbackComponent={ProjectsErrorFallback}>{children}</ErrorBoundary>;
}
