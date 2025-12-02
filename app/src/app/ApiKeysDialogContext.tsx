'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type ApiKeysDialogContextType = [boolean, Dispatch<SetStateAction<boolean>>];

const ApiKeysDialogContext = createContext<ApiKeysDialogContextType | null>(
  null,
);

export function ApiKeysDialogProvider({ children }: { children: ReactNode }) {
  const state = useState(false);
  return <ApiKeysDialogContext value={state}>{children}</ApiKeysDialogContext>;
}

export function useApiKeysDialog() {
  const context = useContext(ApiKeysDialogContext);
  if (!context) {
    throw new Error('Forgot to wrap in `ApiKeysDialogProvider`');
  }
  return context;
}
