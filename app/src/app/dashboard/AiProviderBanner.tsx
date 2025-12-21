'use client';

import { TriangleAlert } from 'lucide-react';
import { Alert, AlertAction, AlertDescription } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';
import { useApiKeysDialog } from '../ApiKeysDialogContext';

export function AiProviderBanner() {
  const { openDialog, storedApiKeys } = useApiKeysDialog();

  if (storedApiKeys?.claudeKey || storedApiKeys?.openaiKey) {
    return null;
  }

  return (
    // pr-21 to fit button width
    <Alert variant="warning" className="has-data-[slot=alert-action]:pr-21">
      <TriangleAlert />
      <AlertDescription className="text-wrap">
        No AI provider configured. Add API keys to enable document generation.
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" onClick={openDialog} size="sm">
          Configure
        </Button>
      </AlertAction>
    </Alert>
  );
}
