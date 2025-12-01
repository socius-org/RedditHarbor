'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useApiKeysDialog } from '../ApiKeysDialogContext';
import { useApiKeys } from '../ApiKeysButton';

export function AiProviderBanner() {
  const [storedApiKeys] = useApiKeys();
  const [, setOpen] = useApiKeysDialog();

  if (storedApiKeys?.claudeKey || storedApiKeys?.openaiKey) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      action={
        <Button
          color="inherit"
          size="small"
          variant="outlined"
          onClick={() => {
            setOpen(true);
          }}
        >
          Configure now
        </Button>
      }
      variant="outlined"
    >
      No AI provider configured. Add API keys to enable document generation.
    </Alert>
  );
}
