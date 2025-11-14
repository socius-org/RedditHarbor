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

type ApiKeysDialogHandle = { getIsPending: () => boolean };

type ApiKeysDialogProps = {
  onClose: () => void;
  ref: Ref<ApiKeysDialogHandle>;
};

function ApiKeysDialog({ onClose, ref }: ApiKeysDialogProps) {
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

  function handleClose() {
    if (isPending) {
      return;
    }
    onClose();
  }

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

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [
    isPending,
  ]);

  if (!passkey) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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
    </>
  );
}

export function ApiKeysButton() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<ApiKeysDialogHandle>(null);

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
      <Dialog
        open={open}
        onClose={() => {
          // Since the pending state is managed inside the dialog,
          // we need a ref to check the value.
          // Note that we're not checking it in the handler below
          // because it seems like when the action fires,
          // `ref.getIsPending()` is still true.
          if (dialogRef.current?.getIsPending()) {
            return;
          }
          setOpen(false);
        }}
      >
        <ApiKeysDialog
          ref={dialogRef}
          onClose={() => {
            setOpen(false);
          }}
        />
      </Dialog>
    </>
  );
}
