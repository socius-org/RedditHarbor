'use client';

import {
  startTransition,
  Suspense,
  use,
  useActionState,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type RefObject,
} from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useUser } from '@clerk/clerk-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useForkRef from '@mui/utils/useForkRef';
import {
  decryptApiKeys,
  saveApiKeys,
  type ApiKeys,
  type EncryptedApiKeys,
  type SaveApiKeysState,
} from './actions/saveApiKeys';
import { useApiKeysDialog } from './ApiKeysDialogContext';
import { testConnection, type TestConnectionService } from './actions/testConnection';
import { addPasskey, authenticateAndDeriveKey, type Passkey } from './utils/passkey';

const connectionTestServices: { id: TestConnectionService; label: string }[] = [
  { id: 'claude', label: 'Claude' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'supabase', label: 'Supabase' },
  { id: 'osf', label: 'OSF' },
];

type ConnectionTestSectionProps = {
  formRef: RefObject<HTMLFormElement | null>;
};

function ConnectionTestSection({ formRef }: ConnectionTestSectionProps) {
  const [connectionTestState, connectionTestAction, isConnectionTestPending] = useActionState(
    testConnection,
    undefined,
  );

  const [connectionTestService, setConnectionTestService] = useState<TestConnectionService | null>(
    null,
  );

  function handleTestConnection(service: TestConnectionService) {
    const form = formRef.current;
    if (!form) {
      return;
    }

    setConnectionTestService(service);
    const formData = new FormData(form);
    formData.append('service', service);

    startTransition(() => {
      connectionTestAction(formData);
    });
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Test connections
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {connectionTestServices.map(({ id, label }) => (
          <Button
            key={id}
            variant="outlined"
            disabled={isConnectionTestPending}
            loading={isConnectionTestPending && connectionTestService === id}
            onClick={() => {
              handleTestConnection(id);
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>
      {connectionTestState && (
        <Alert severity={connectionTestState.success ? 'success' : 'error'}>
          {connectionTestState.message}
        </Alert>
      )}
    </>
  );
}

function usePasswordToggle() {
  const [showKeys, setShowKeys] = useState<Record<keyof ApiKeys, boolean>>({
    claudeKey: false,
    openaiKey: false,
    redditClientId: false,
    redditClientSecret: false,
    supabaseProjectUrl: false,
    supabaseApiKey: false,
    osfApiKey: false,
  });

  function toggleShowKey(key: keyof ApiKeys) {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return function getPasswordToggleProps(
    fieldName: keyof ApiKeys,
  ): Pick<TextFieldProps, 'type' | 'slotProps'> {
    const isVisible = showKeys[fieldName];
    return {
      type: isVisible ? 'text' : 'password',
      slotProps: {
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                size="small"
                title={isVisible ? 'Hide' : 'Show'}
                onClick={() => {
                  toggleShowKey(fieldName);
                }}
                // https://github.com/mui/material-ui/blob/6da6eb2/docs/data/material/components/text-fields/InputAdornments.tsx#L20-L26
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onMouseUp={(event) => {
                  event.preventDefault();
                }}
              >
                {isVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      },
    };
  };
}

type ApiKeysDialogContentHandle = { getIsPending: () => boolean };

type ApiKeysDialogContentProps = {
  apiKeysState: {
    encrypted: EncryptedApiKeys | null;
    promise: Promise<ApiKeys>;
  };
  encryptionKeyPromise: Promise<CryptoKey>;
  formRef: Ref<HTMLFormElement>;
  onApiKeysChange: (value: EncryptedApiKeys) => void;
  onClose: () => void;
  onInvalidateApiKeys: (encrypted: EncryptedApiKeys, newApiKeys: ApiKeys) => void;
  ref: Ref<ApiKeysDialogContentHandle>;
};

function ApiKeysDialogContent({
  apiKeysState,
  encryptionKeyPromise,
  formRef: formRefProp,
  onApiKeysChange,
  onClose,
  onInvalidateApiKeys,
  ref,
}: ApiKeysDialogContentProps) {
  const encryptionKey = use(encryptionKeyPromise);
  const apiKeys = use(apiKeysState.promise);

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const handleFormRef = useForkRef(formRef, formRefProp);

  async function submitAction(_prevState: SaveApiKeysState | undefined, formData: FormData) {
    const result = await saveApiKeys(encryptionKey, onApiKeysChange, onInvalidateApiKeys, formData);
    if (!result?.errors) {
      onClose();
    }
    return result;
  }

  const [state, action, isPending] = useActionState(submitAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [isPending]);

  const getPasswordToggleProps = usePasswordToggle();

  /**
   * Gets the default value for a form field, prioritising user input from failed
   * submissions over stored values. This prevents React 19's form reset behaviour
   * where failed form submissions would result in user input getting lost.
   */
  function getDefaultValue(key: keyof ApiKeys): string {
    const value = state?.formData.get(key);
    return typeof value === 'string' ? value : apiKeys[key];
  }

  return (
    <>
      <DialogContent>
        <Stack spacing={1}>
          <DialogContentText>
            Configure API keys for document generation. Keys are encrypted with your passkey and
            stored securely on your device.
          </DialogContentText>
          {state?.errors.formErrors.map((error) => (
            <Alert key={error} severity="error" variant="filled">
              {error}
            </Alert>
          ))}
          <form action={action} id={formId} ref={handleFormRef}>
            <TextField
              autoFocus
              name={'claudeKey' satisfies keyof ApiKeys}
              label="Claude API key"
              helperText="Used for DPIA and compliance document generation"
              placeholder="sk-ant-api03-..."
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('claudeKey')}
              {...getPasswordToggleProps('claudeKey')}
            />
            <TextField
              name={'openaiKey' satisfies keyof ApiKeys}
              label="OpenAI API key"
              helperText="Alternative to Claude for document generation"
              placeholder="sk-..."
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('openaiKey')}
              {...getPasswordToggleProps('openaiKey')}
            />
            <TextField
              name={'redditClientId' satisfies keyof ApiKeys}
              label="Reddit client ID"
              helperText="Required for data extraction in Phase 2"
              type="text"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('redditClientId')}
            />
            <TextField
              name={'redditClientSecret' satisfies keyof ApiKeys}
              label="Reddit client secret"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('redditClientSecret')}
              {...getPasswordToggleProps('redditClientSecret')}
            />
            <TextField
              name={'supabaseProjectUrl' satisfies keyof ApiKeys}
              label="Supabase project URL"
              placeholder="https://your-project.supabase.co"
              error={!!state?.errors.fieldErrors.supabaseProjectUrl?.length}
              helperText={state?.errors.fieldErrors.supabaseProjectUrl?.[0]}
              type="url"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('supabaseProjectUrl')}
            />
            <TextField
              name={'supabaseApiKey' satisfies keyof ApiKeys}
              label="Supabase API key"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('supabaseApiKey')}
              {...getPasswordToggleProps('supabaseApiKey')}
            />
            <TextField
              name={'osfApiKey' satisfies keyof ApiKeys}
              label="OSF API key"
              helperText="Open Science Framework API key"
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('osfApiKey')}
              {...getPasswordToggleProps('osfApiKey')}
            />
          </form>
          <Divider />
          <ConnectionTestSection formRef={formRef} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={formId} variant="contained" loading={isPending}>
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
  'formRef' | 'onApiKeysChange' | 'onClose' | 'onInvalidateApiKeys'
> & {
  apiKeysState: {
    encrypted: EncryptedApiKeys | null;
    promise: Promise<ApiKeys>;
  } | null;
  encryptionKeyPromise: Promise<CryptoKey> | null;
  onDeriveEncryptionKey: (passkey: Passkey) => void;
  onPasskeyChange: (passkey: Passkey) => void;
  open: boolean;
  passkey: Passkey | null;
};

function ApiKeysDialog({
  apiKeysState,
  encryptionKeyPromise,
  formRef,
  onApiKeysChange,
  onClose,
  onDeriveEncryptionKey,
  onInvalidateApiKeys,
  onPasskeyChange,
  open,
  passkey,
}: ApiKeysDialogProps) {
  const { user } = useUser();

  const [addPasskeyError, setAddPasskeyError] = useState<string | null>(null);

  const apiKeysDialogContentHandleRef = useRef<ApiKeysDialogContentHandle>(null);

  // Extracted due to https://github.com/facebook/react/blob/36df5e8b42a97df4092f9584e4695bf4537853d5/compiler/packages/babel-plugin-react-compiler/src/HIR/BuildHIR.ts#L279-L290
  function validateUser() {
    const userId = user?.id;
    const email = user?.primaryEmailAddress?.emailAddress;
    const displayName = user?.fullName ?? '';

    if (!userId || !email) {
      throw new Error('User information not available');
    }

    return { userId, email, displayName };
  }

  async function handleAddPasskey() {
    setAddPasskeyError(null);

    try {
      const { userId, email, displayName } = validateUser();
      const newPasskey = await addPasskey(userId, email, displayName);
      onPasskeyChange(newPasskey);
      onDeriveEncryptionKey(newPasskey);
    } catch (error) {
      const message = Error.isError(error) ? error.message : 'Failed to add passkey';
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
              To securely store your API keys, you need to add a passkey. This will use your
              device&apos;s biometric authentication (like fingerprint or face recognition) to
              protect your keys.
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
          {encryptionKeyPromise && apiKeysState ? (
            <ApiKeysDialogContent
              apiKeysState={apiKeysState}
              encryptionKeyPromise={encryptionKeyPromise}
              formRef={formRef}
              onApiKeysChange={onApiKeysChange}
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
  const {
    apiKeysState,
    closeDialog,
    encryptionKeyPromise,
    formRef,
    open,
    openDialog,
    passkey,
    setApiKeysState,
    setEncryptionKeyPromise,
    setPasskey,
    setStoredApiKeys,
    storedApiKeys,
  } = useApiKeysDialog();

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<KeyIcon />}
        variant="outlined"
        onClick={openDialog}
      >
        API keys
      </Button>
      <ApiKeysDialog
        apiKeysState={apiKeysState}
        encryptionKeyPromise={encryptionKeyPromise}
        formRef={formRef}
        onApiKeysChange={setStoredApiKeys}
        onClose={closeDialog}
        onDeriveEncryptionKey={(passkey) => {
          const newEncryptionKeyPromise = authenticateAndDeriveKey(passkey);
          setEncryptionKeyPromise(newEncryptionKeyPromise);
          setApiKeysState({
            encrypted: storedApiKeys,
            promise: newEncryptionKeyPromise.then((key) => decryptApiKeys(storedApiKeys, key)),
          });
        }}
        onInvalidateApiKeys={(encrypted, newApiKeys) => {
          setApiKeysState({
            encrypted,
            promise: Promise.resolve(newApiKeys),
          });
        }}
        onPasskeyChange={setPasskey}
        open={open}
        passkey={passkey}
      />
    </>
  );
}
