'use client';

import {
  useActionState,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
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

type ApiKeysDialogHandle = { getIsPending: () => boolean };

type ApiKeysDialogProps = {
  onClose: () => void;
  ref: Ref<ApiKeysDialogHandle>;
};

function ApiKeysDialog({ onClose, ref }: ApiKeysDialogProps) {
  const formId = useId();
  const [passkey, setPasskey] = useState<{
    id: string;
    publicKey: string;
  } | null>(null);

  function handleClose() {
    if (isPending) {
      return;
    }
    onClose();
  }

  function handleAddPasskey() {
    // TODO: Implement actual WebAuthn registration
    setPasskey({
      id: 'stub-id',
      publicKey: 'stub-public-key',
    });
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
          <DialogContentText>
            To securely store your API keys, you need to add a passkey. This
            will use your device&apos;s biometric authentication (like
            fingerprint or face recognition) to protect your keys.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant="contained" onClick={handleAddPasskey}>
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
          onClose={() => {
            setOpen(false);
          }}
          ref={dialogRef}
        />
      </Dialog>
    </>
  );
}
