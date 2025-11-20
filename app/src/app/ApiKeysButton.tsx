'use client';

import {
  useActionState,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
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

function getStoredPasskey(): Passkey | null {
  const stored = localStorage.getItem('passkey');
  if (stored) {
    const parsed = passkeySchema.safeParse(JSON.parse(stored));
    if (parsed.success) {
      return parsed.data;
    }
  }
  return null;
}

type ApiKeysDialogContentHandle = { getIsPending: () => boolean };

type ApiKeysDialogContentProps = {
  onClose: () => void;
  ref: Ref<ApiKeysDialogContentHandle>;
};

function ApiKeysDialogContent({ onClose, ref }: ApiKeysDialogContentProps) {
  const formId = useId();

  function handleClose() {
    if (isPending) {
      return;
    }
    onClose();
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

  const [state, action, isPending] = useActionState(submitAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [
    isPending,
  ]);

  return (
    <>
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
    </>
  );
}

type ApiKeysDialogProps = Pick<ApiKeysDialogContentProps, 'onClose'> & {
  open: boolean;
};

function ApiKeysDialog({ onClose, open }: ApiKeysDialogProps) {
  const { user } = useUser();

  const [passkey, setPasskey] = useState<Passkey | null>(getStoredPasskey);
  const [addPasskeyError, setAddPasskeyError] = useState<string | null>(null);

  const apiKeysDialogContentHandleRef =
    useRef<ApiKeysDialogContentHandle>(null);

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
    <Dialog
      open={open}
      onClose={() => {
        if (apiKeysDialogContentHandleRef.current?.getIsPending()) {
          return;
        }
        onClose();
      }}
    >
      <DialogTitle>API keys</DialogTitle>
      <ApiKeysDialogContent
        onClose={onClose}
        ref={apiKeysDialogContentHandleRef}
      />
    </Dialog>
  );
}

export function ApiKeysButton() {
  const [open, setOpen] = useState(false);

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
        onClose={() => {
          setOpen(false);
        }}
        open={open}
      />
    </>
  );
}
