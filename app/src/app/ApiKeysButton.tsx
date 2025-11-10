'use client';

import { useActionState, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import KeyIcon from '@mui/icons-material/Key';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { saveApiKeys, type SaveApiKeysState } from './actions/saveApiKeys';

export function ApiKeysButton() {
  const formId = useId();
  const [open, setOpen] = useState(false);

  function handleClose() {
    if (isPending) {
      return;
    }
    setOpen(false);
  }

  async function submitAction(
    prevState: SaveApiKeysState | undefined,
    formData: FormData,
  ) {
    const result = await saveApiKeys(prevState, formData);
    if (!result?.errors) {
      handleClose();
    }
    return result;
  }

  // TODO: prefill form
  const [state, action, isPending] = useActionState(submitAction, undefined);

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<KeyIcon />}
        variant="outlined"
        onClick={() => {
          setOpen(true);
        }}
      >
        API keys
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>API keys</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <DialogContentText>
              Configure API keys for document generation.
            </DialogContentText>
            {state?.errors?.formErrors.map((error) => (
              <Alert key={error} severity="error" variant="filled">
                {error}
              </Alert>
            ))}
            <form action={action} id={formId}>
              <TextField
                autoFocus
                autoComplete="off"
                name="claudeKey"
                label="Claude API key"
                helperText="Used for DPIA and compliance document generation"
                placeholder="sk-ant-api03-..."
                type="password"
                margin="dense"
                size="small"
                fullWidth
              />
              <TextField
                autoComplete="off"
                name="openaiKey"
                label="OpenAI API key"
                helperText="Alternative to Claude for document generation"
                placeholder="sk-..."
                type="password"
                margin="dense"
                size="small"
                fullWidth
              />
            </form>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="contained"
            loading={isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
