'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useApiKeysDialog } from '../ApiKeysDialogContext';

export function AiProviderBanner() {
  const { openDialog, storedApiKeys } = useApiKeysDialog();

  if (storedApiKeys?.claudeKey || storedApiKeys?.openaiKey) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" variant="outlined" onClick={openDialog}>
          Configure now
        </Button>
      }
      variant="outlined"
    >
      No AI provider configured. Add API keys to enable document generation.
    </Alert>
  );
}
