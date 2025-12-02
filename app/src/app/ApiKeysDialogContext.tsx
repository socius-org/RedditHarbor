'use client';

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type Ref,
} from 'react';
import isEqual from 'react-fast-compare';
import {
  decryptApiKeys,
  encryptedApiKeysSchema,
  type ApiKeys,
  type EncryptedApiKeys,
} from './actions/saveApiKeys';
import {
  authenticateAndDeriveKey,
  passkeySchema,
  type Passkey,
} from './utils/passkey';
import { useLocalStorageState } from './utils/useLocalStorageState';

function parsePasskey(value: string | null) {
  if (value) {
    const parsed = passkeySchema.safeParse(JSON.parse(value));
    if (parsed.success) {
      return parsed.data;
    }
  }
  return null;
}

function usePasskey() {
  const [storedPasskey, setStoredPasskey] = useLocalStorageState('passkey');
  function setPasskey(newPasskey: Passkey) {
    setStoredPasskey(JSON.stringify(newPasskey));
  }
  return [parsePasskey(storedPasskey), setPasskey] as const;
}

function parseApiKeys(value: string | null): EncryptedApiKeys | null {
  if (value) {
    const parsed = encryptedApiKeysSchema.safeParse(JSON.parse(value));
    if (parsed.success) {
      return parsed.data;
    }
  }
  return null;
}

function useApiKeys() {
  const [storedApiKeys, setStoredApiKeys] = useLocalStorageState('apiKeys');
  function setApiKeys(newApiKeys: EncryptedApiKeys) {
    setStoredApiKeys(JSON.stringify(newApiKeys));
  }
  return [parseApiKeys(storedApiKeys), setApiKeys] as const;
}

type ApiKeysState = {
  encrypted: EncryptedApiKeys | null;
  promise: Promise<ApiKeys>;
};

type ApiKeysDialogContextType = {
  apiKeysState: ApiKeysState | null;
  closeDialog: () => void;
  encryptionKeyPromise: Promise<CryptoKey> | null;
  formRef: Ref<HTMLFormElement>;
  open: boolean;
  openDialog: () => void;
  passkey: Passkey | null;
  setApiKeysState: Dispatch<ApiKeysState>;
  setEncryptionKeyPromise: Dispatch<Promise<CryptoKey>>;
  setPasskey: Dispatch<Passkey>;
  setStoredApiKeys: Dispatch<EncryptedApiKeys>;
  storedApiKeys: EncryptedApiKeys | null;
};

const ApiKeysDialogContext = createContext<ApiKeysDialogContextType | null>(
  null,
);

export function ApiKeysDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const [encryptionKeyPromise, setEncryptionKeyPromise] =
    useState<Promise<CryptoKey> | null>(null);

  const [apiKeysState, setApiKeysState] = useState<ApiKeysState | null>(null);

  const [passkey, setPasskey] = usePasskey();
  const [storedApiKeys, setStoredApiKeys] = useApiKeys();

  const formRef = useRef<HTMLFormElement>(null);

  const syncApiKeysPromise = useEffectEvent(
    (stored: EncryptedApiKeys | null) => {
      if (
        encryptionKeyPromise &&
        !isEqual(apiKeysState?.encrypted ?? null, stored)
      ) {
        setApiKeysState({
          encrypted: stored,
          promise: encryptionKeyPromise.then((key) =>
            decryptApiKeys(stored, key),
          ),
        });
        formRef.current?.reset();
      }
    },
  );

  useEffect(() => {
    syncApiKeysPromise(storedApiKeys);
  }, [storedApiKeys]);

  function openDialog() {
    if (passkey && !encryptionKeyPromise) {
      const newEncryptionKeyPromise = authenticateAndDeriveKey(passkey);
      setEncryptionKeyPromise(newEncryptionKeyPromise);
      setApiKeysState({
        encrypted: storedApiKeys,
        promise: newEncryptionKeyPromise.then((key) =>
          decryptApiKeys(storedApiKeys, key),
        ),
      });
    }
    setOpen(true);
  }

  return (
    <ApiKeysDialogContext
      value={{
        apiKeysState,
        closeDialog: () => {
          setOpen(false);
        },
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
      }}
    >
      {children}
    </ApiKeysDialogContext>
  );
}

export function useApiKeysDialog() {
  const context = useContext(ApiKeysDialogContext);
  if (!context) {
    throw new Error('Forgot to wrap in `ApiKeysDialogProvider`');
  }
  return context;
}
