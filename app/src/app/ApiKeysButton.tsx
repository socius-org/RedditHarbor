'use client';

import {
  Suspense,
  use,
  useActionState,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useUser } from '@clerk/clerk-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import KeyIcon from '@mui/icons-material/Key';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {
  apiKeysSchema,
  saveApiKeys,
  type ApiKeys,
  type SaveApiKeysState,
} from './actions/saveApiKeys';
import {
  addPasskey,
  authenticateAndDeriveKey,
  type Passkey,
  passkeySchema,
} from './utils/passkey';
import { decryptText, encryptedDataSchema } from './utils/encryption';

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

async function getApiKeys(encryptionKey: CryptoKey): Promise<ApiKeys> {
  const stored = localStorage.getItem('apiKeys');
  if (stored) {
    const parsed = encryptedDataSchema.safeParse(JSON.parse(stored));
    if (parsed.success) {
      const decrypted = await decryptText(parsed.data, encryptionKey);
      const parsedApiKeys = apiKeysSchema.safeParse(JSON.parse(decrypted));
      if (parsedApiKeys.success) {
        return parsedApiKeys.data;
      }
    }
  }

  return {
    claudeKey: '',
    openaiKey: '',
    redditClientId: '',
    redditClientSecret: '',
    supabaseProjectUrl: '',
    supabaseApiKey: '',
    osfApiKey: '',
  };
}

type ApiKeysDialogContentHandle = { getIsPending: () => boolean };

type ApiKeysDialogContentProps = {
  apiKeysPromise: Promise<ApiKeys>;
  encryptionKeyPromise: Promise<CryptoKey>;
  onClose: () => void;
  onInvalidateApiKeys: (encryptionKey: CryptoKey) => void;
  ref: Ref<ApiKeysDialogContentHandle>;
};

function ApiKeysDialogContent({
  apiKeysPromise,
  encryptionKeyPromise,
  onClose,
  onInvalidateApiKeys,
  ref,
}: ApiKeysDialogContentProps) {
  const encryptionKey = use(encryptionKeyPromise);
  const apiKeys = use(apiKeysPromise);

  const formId = useId();

  function handleClose() {
    if (isPending) {
      return;
    }
    onClose();
  }

  async function submitAction(
    _prevState: SaveApiKeysState | undefined,
    formData: FormData,
  ) {
    const result = await saveApiKeys(encryptionKey, formData);
    if (!result?.errors) {
      onInvalidateApiKeys(encryptionKey);
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
            Configure API keys for document generation. Keys are encrypted with
            your passkey and stored securely on your device.
          </DialogContentText>
          {state?.errors?.formErrors.map((error) => (
            <Alert key={error} severity="error" variant="filled">
              {error}
            </Alert>
          ))}
          <form action={action} id={formId}>
            <TextField
              autoFocus
              name={'claudeKey' satisfies keyof ApiKeys}
              label="Claude API key"
              helperText="Used for DPIA and compliance document generation"
              placeholder="sk-ant-api03-..."
              type="password"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.claudeKey}
            />
            <TextField
              name={'openaiKey' satisfies keyof ApiKeys}
              label="OpenAI API key"
              helperText="Alternative to Claude for document generation"
              placeholder="sk-..."
              type="password"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.openaiKey}
            />
            <TextField
              name={'redditClientId' satisfies keyof ApiKeys}
              label="Reddit client ID"
              helperText="Required for data extraction in Phase 2"
              type="text"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.redditClientId}
            />
            <TextField
              name={'redditClientSecret' satisfies keyof ApiKeys}
              label="Reddit client secret"
              type="password"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.redditClientSecret}
            />
            <TextField
              name={'supabaseProjectUrl' satisfies keyof ApiKeys}
              label="Supabase project URL"
              placeholder="https://your-project.supabase.co"
              error={!!state?.errors?.fieldErrors.supabaseProjectUrl?.length}
              helperText={state?.errors?.fieldErrors.supabaseProjectUrl?.join(
                '. ',
              )}
              type="url"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.supabaseProjectUrl}
            />
            <TextField
              name={'supabaseApiKey' satisfies keyof ApiKeys}
              label="Supabase API key"
              type="password"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.supabaseApiKey}
            />
            <TextField
              name={'osfApiKey' satisfies keyof ApiKeys}
              label="OSF API key"
              helperText="Open Science Framework API key"
              type="password"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={apiKeys.osfApiKey}
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

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <>
      <DialogContent>
        <Alert severity="error" variant="filled">
          {Error.isError(error) ? `${error}` : 'An unknown error occurred'}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          variant="contained"
          onClick={() => {
            resetErrorBoundary();
          }}
        >
          Try again
        </Button>
      </DialogActions>
    </>
  );
}

type ApiKeysDialogProps = Pick<
  ApiKeysDialogContentProps,
  'onClose' | 'onInvalidateApiKeys'
> & {
  apiKeysPromise: Promise<ApiKeys> | null;
  encryptionKeyPromise: Promise<CryptoKey> | null;
  onDeriveEncryptionKey: (passkey: Passkey) => void;
  open: boolean;
};

function ApiKeysDialog({
  apiKeysPromise,
  encryptionKeyPromise,
  onClose,
  onDeriveEncryptionKey,
  onInvalidateApiKeys,
  open,
}: ApiKeysDialogProps) {
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
      onDeriveEncryptionKey(newPasskey);
    } catch (error) {
      const message = Error.isError(error)
        ? error.message
        : 'Failed to add passkey';
      setAddPasskeyError(message);
    }
  }

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
      fullWidth
      open={open}
      onClose={() => {
        if (apiKeysDialogContentHandleRef.current?.getIsPending()) {
          return;
        }
        onClose();
      }}
    >
      <DialogTitle>API keys</DialogTitle>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          onDeriveEncryptionKey(passkey);
        }}
      >
        <Suspense
          fallback={
            <DialogContent>
              <Stack alignItems="center" spacing={1}>
                <CircularProgress />
                <DialogContentText>Decrypting API keys...</DialogContentText>
              </Stack>
            </DialogContent>
          }
        >
          {encryptionKeyPromise && apiKeysPromise ? (
            <ApiKeysDialogContent
              apiKeysPromise={apiKeysPromise}
              encryptionKeyPromise={encryptionKeyPromise}
              onClose={onClose}
              onInvalidateApiKeys={onInvalidateApiKeys}
              ref={apiKeysDialogContentHandleRef}
            />
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </Dialog>
  );
}

export function ApiKeysButton() {
  const [open, setOpen] = useState(false);

  const [encryptionKeyPromise, setEncryptionKeyPromise] =
    useState<Promise<CryptoKey> | null>(null);

  const [apiKeysPromise, setApiKeysPromise] = useState<Promise<ApiKeys> | null>(
    null,
  );

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<KeyIcon />}
        variant="outlined"
        onClick={() => {
          const storedPasskey = getStoredPasskey();
          if (storedPasskey && !encryptionKeyPromise) {
            const newEncryptionKeyPromise =
              authenticateAndDeriveKey(storedPasskey);
            setEncryptionKeyPromise(newEncryptionKeyPromise);
            setApiKeysPromise(newEncryptionKeyPromise.then(getApiKeys));
          }
          setOpen(true);
        }}
      >
        API keys
      </Button>
      <ApiKeysDialog
        apiKeysPromise={apiKeysPromise}
        encryptionKeyPromise={encryptionKeyPromise}
        onClose={() => {
          setOpen(false);
        }}
        onDeriveEncryptionKey={(passkey) => {
          const newEncryptionKeyPromise = authenticateAndDeriveKey(passkey);
          setEncryptionKeyPromise(newEncryptionKeyPromise);
          setApiKeysPromise(newEncryptionKeyPromise.then(getApiKeys));
        }}
        onInvalidateApiKeys={(encryptionKey) => {
          setApiKeysPromise(getApiKeys(encryptionKey));
        }}
        open={open}
      />
    </>
  );
}
