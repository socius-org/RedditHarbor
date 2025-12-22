'use client';

import { TriangleAlert } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';
import { useApiKeysDialog } from '../ApiKeysDialogContext';

export function AiProviderBanner() {
  const { openDialog, storedApiKeys } = useApiKeysDialog();

  if (storedApiKeys?.claudeKey || storedApiKeys?.openaiKey) {
    return null;
  }

  return (
    // pr-0 to prevent the description text from wrapping.
    <Alert variant="warning" className="has-data-[slot=alert-action]:pr-0">
      <TriangleAlert />
      <AlertTitle>No AI provider configured.</AlertTitle>
      <AlertDescription>Add API keys to enable document generation.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="xs" onClick={openDialog}>
          Configure
        </Button>
      </AlertAction>
    </Alert>
  );
}
