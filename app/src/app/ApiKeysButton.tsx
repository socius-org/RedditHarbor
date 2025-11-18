'use client';

import { startTransition, useActionState, useId, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
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
import { addPasskey, type Passkey, passkeySchema } from './utils/passkey';

type ApiKeysDialogProps = {
  action: (formData: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  open: boolean;
  state: SaveApiKeysState | undefined;
};

function ApiKeysDialog({
  action,
  isPending,
  onClose,
  open,
  state,
}: ApiKeysDialogProps) {
  const formId = useId();
  const { user } = useUser();

  const [passkey, setPasskey] = useState<Passkey | null>(() => {
    const stored = localStorage.getItem('passkey');
    if (stored) {
      const parsed = passkeySchema.safeParse(JSON.parse(stored));
      if (parsed.success) {
        return parsed.data;
      }
    }
    return null;
  });

  const [addPasskeyError, setAddPasskeyError] = useState<string | null>(null);

  async function handleAddPasskey() {
    setAddPasskeyError(null);

    try {
      const userId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress;
      const displayName = user?.fullName ?? '';

      if (!userId || !email) {
        throw new Error('User information not available');
      }

      const newPasskey = await addPasskey(userId, email, displayName);
      localStorage.setItem('passkey', JSON.stringify(newPasskey));
      setPasskey(newPasskey);
    } catch (error) {
      const message = Error.isError(error)
        ? error.message
        : 'Failed to add passkey';
      setAddPasskeyError(message);
    }
  }

  // TODO: prefill form

  if (!passkey) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Add a passkey</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              To securely store your API keys, you need to add a passkey. This
              will use your device&apos;s biometric authentication (like
              fingerprint or face recognition) to protect your keys.
            </DialogContentText>
            {addPasskeyError && (
              <Alert severity="error" variant="filled">
                {addPasskeyError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            variant="contained"
            onClick={() => {
              void handleAddPasskey();
            }}
          >
            Add passkey
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose}>
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
        <Button disabled={isPending} onClick={onClose}>
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
  );
}

export function ApiKeysButton() {
  const [open, setOpen] = useState(false);

  const initialState = undefined;
  const [state, action, isPending] = useActionState(submitAction, initialState);

  function handleClose() {
    if (isPending) {
      return;
    }
    setOpen(false);
    startTransition(() => {
      action('reset');
    });
  }

  async function submitAction(
    prevState: SaveApiKeysState | undefined,
    formData: FormData | 'reset',
  ) {
    if (formData === 'reset') {
      return initialState;
    }

    const result = await saveApiKeys(prevState, formData);
    if (!result?.errors) {
      handleClose();
    }
    return result;
  }

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
      <ApiKeysDialog
        action={action}
        isPending={isPending}
        onClose={handleClose}
        open={open}
        state={state}
      />
    </>
  );
}
