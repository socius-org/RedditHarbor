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
import { CircleAlert, CircleCheck } from 'lucide-react';
import useForkRef from '@mui/utils/useForkRef';
import { KeyRound } from 'lucide-react';
import { Alert, AlertTitle } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#app/components/ui/dialog.tsx';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '#app/components/ui/empty.tsx';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#app/components/ui/field.tsx';
import { Input } from '#app/components/ui/input.tsx';
import { PasswordInput } from '#app/components/ui/PasswordInput.tsx';
import { Separator } from '#app/components/ui/separator.tsx';
import { Spinner } from '#app/components/ui/spinner.tsx';
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
      <h3 className="text-sm font-semibold pb-1">Test connections</h3>
      <div className="flex flex-wrap gap-2">
        {connectionTestServices.map(({ id, label }) => (
          <Button
            key={id}
            variant="outline"
            disabled={isConnectionTestPending}
            loading={isConnectionTestPending && connectionTestService === id}
            onClick={() => {
              handleTestConnection(id);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      {connectionTestState && (
        <Alert variant={connectionTestState.success ? 'success' : 'destructive'}>
          {connectionTestState.success ? <CircleCheck /> : <CircleAlert />}
          <AlertTitle>{connectionTestState.message}</AlertTitle>
        </Alert>
      )}
    </>
  );
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

  return (
    <>
      <DialogHeader>
        <DialogTitle>API keys</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-2">
          <DialogDescription>
            Configure API keys for document generation. Keys are encrypted with your passkey and
            stored securely on your device.
          </DialogDescription>
          {state?.errors.formErrors.map((error) => (
            <Alert key={error} variant="destructive">
              <CircleAlert />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ))}
          <form
            id={formId}
            ref={handleFormRef}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(() => {
                action(formData);
              });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Claude API key</FieldLabel>
                <PasswordInput
                  autoFocus
                  name={'claudeKey' satisfies keyof ApiKeys}
                  placeholder="sk-ant-api03-..."
                  defaultValue={apiKeys.claudeKey}
                />
                <FieldDescription>
                  Used for DPIA and compliance document generation
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>OpenAI API key</FieldLabel>
                <PasswordInput
                  name={'openaiKey' satisfies keyof ApiKeys}
                  placeholder="sk-..."
                  defaultValue={apiKeys.openaiKey}
                />
                <FieldDescription>Alternative to Claude for document generation</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Reddit client ID</FieldLabel>
                <Input
                  name={'redditClientId' satisfies keyof ApiKeys}
                  defaultValue={apiKeys.redditClientId}
                />
                <FieldDescription>Required for data extraction in Phase 2</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Reddit client secret</FieldLabel>
                <PasswordInput
                  name={'redditClientSecret' satisfies keyof ApiKeys}
                  defaultValue={apiKeys.redditClientSecret}
                />
              </Field>
              <Field data-invalid={!!state?.errors.fieldErrors.supabaseProjectUrl?.length}>
                <FieldLabel>Supabase project URL</FieldLabel>
                <Input
                  name={'supabaseProjectUrl' satisfies keyof ApiKeys}
                  placeholder="https://your-project.supabase.co"
                  type="url"
                  defaultValue={apiKeys.supabaseProjectUrl}
                  aria-invalid={!!state?.errors.fieldErrors.supabaseProjectUrl?.length}
                />
                <FieldError
                  errors={state?.errors.fieldErrors.supabaseProjectUrl?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field>
                <FieldLabel>Supabase API key</FieldLabel>
                <PasswordInput
                  name={'supabaseApiKey' satisfies keyof ApiKeys}
                  defaultValue={apiKeys.supabaseApiKey}
                />
              </Field>
              <Field>
                <FieldLabel>OSF API key</FieldLabel>
                <PasswordInput
                  name={'osfApiKey' satisfies keyof ApiKeys}
                  defaultValue={apiKeys.osfApiKey}
                />
                <FieldDescription>Open Science Framework API key</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <Separator />
          <ConnectionTestSection formRef={formRef} />
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogClose disabled={isPending} render={<Button variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={formId} loading={isPending}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>API keys</DialogTitle>
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>{Error.isError(error) ? `${error}` : 'An unknown error occurred'}</AlertTitle>
        </Alert>
      </DialogHeader>
      <DialogFooter>
        <Button
          onClick={() => {
            resetErrorBoundary();
          }}
        >
          Try again
        </Button>
      </DialogFooter>
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
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            onClose();
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Add a passkey</DialogTitle>
            <DialogDescription>
              To securely store your API keys, you need to add a passkey. This will use your
              device&apos;s biometric authentication (like fingerprint or face recognition) to
              protect your keys.
            </DialogDescription>
            {addPasskeyError && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{addPasskeyError}</AlertTitle>
              </Alert>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                void handleAddPasskey();
              }}
            >
              Add passkey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          if (apiKeysDialogContentHandleRef.current?.getIsPending()) {
            return;
          }
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => {
            onDeriveEncryptionKey(passkey);
          }}
        >
          <Suspense
            fallback={
              <DialogHeader>
                <DialogTitle>API keys</DialogTitle>
                <Empty className="text-muted-foreground">
                  <EmptyHeader>
                    <EmptyMedia>
                      <Spinner />
                    </EmptyMedia>
                    <EmptyTitle>Decrypting API keys...</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </DialogHeader>
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
      </DialogContent>
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
      <Button variant="outline" size="lg" onClick={openDialog}>
        <KeyRound />
        API keys
      </Button>
      <ApiKeysDialog
        apiKeysState={apiKeysState}
        encryptionKeyPromise={encryptionKeyPromise}
        formRef={formRef}
        onApiKeysChange={setStoredApiKeys}
        onClose={closeDialog}
        onDeriveEncryptionKey={(newPasskey) => {
          const newEncryptionKeyPromise = authenticateAndDeriveKey(newPasskey);
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
