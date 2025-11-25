// Based on https://github.com/mui/material-ui/blob/755f39474ef3f2497e8953944fdc783416e1a113/packages/mui-utils/src/useLocalStorageState/useLocalStorageState.ts

'use client';
import {
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from 'react';

// storage events only work across tabs, we'll use an event emitter to announce within the current tab
const currentTabChangeListeners = new Map<string, Set<() => void>>();

function noop() {
  // Do nothing.
}

function onCurrentTabStorageChange(key: string, handler: () => void) {
  let listeners = currentTabChangeListeners.get(key);

  if (!listeners) {
    listeners = new Set();
    currentTabChangeListeners.set(key, listeners);
  }

  listeners.add(handler);
}

function offCurrentTabStorageChange(key: string, handler: () => void) {
  const listeners = currentTabChangeListeners.get(key);
  if (!listeners) {
    return;
  }

  listeners.delete(handler);

  if (listeners.size === 0) {
    currentTabChangeListeners.delete(key);
  }
}

function emitCurrentTabStorageChange(key: string) {
  const listeners = currentTabChangeListeners.get(key);
  if (listeners) {
    listeners.forEach((listener) => {
      listener();
    });
  }
}

function subscribe(
  area: Storage,
  key: string,
  callback: () => void,
): () => void {
  function storageHandler(event: StorageEvent) {
    if (event.storageArea === area && event.key === key) {
      callback();
    }
  }
  window.addEventListener('storage', storageHandler);
  onCurrentTabStorageChange(key, callback);
  return () => {
    window.removeEventListener('storage', storageHandler);
    offCurrentTabStorageChange(key, callback);
  };
}

function getSnapshot(area: Storage, key: string): string | null {
  try {
    return area.getItem(key);
  } catch {
    // ignore
    // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage
    return null;
  }
}

function setValue(area: Storage, key: string, value: string | null) {
  try {
    if (value === null) {
      area.removeItem(key);
    } else {
      area.setItem(key, value);
    }
  } catch {
    // ignore
    // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage
    return;
  }
  emitCurrentTabStorageChange(key);
}

type Initializer = () => string | null;

type UseStorageStateHookResult = [
  string | null,
  Dispatch<SetStateAction<string | null>>,
];

const serverValue: UseStorageStateHookResult = [null, noop];

function useLocalStorageStateServer(): UseStorageStateHookResult {
  return serverValue;
}

/**
 * Sync state to local storage so that it persists through a page refresh. Usage is
 * similar to useState except we pass in a storage key so that we can default
 * to that value on page load instead of the specified initial value.
 *
 * Since the storage API isn't available in server-rendering environments, we
 * return null during SSR and hydration.
 */
function useLocalStorageStateBrowser(
  key: string,
  initializer: string | null | Initializer = null,
): UseStorageStateHookResult {
  const [initialValue] = useState(initializer);
  const area = window.localStorage;

  function subscribeKey(callback: () => void) {
    return subscribe(area, key, callback);
  }

  function getKeySnapshot() {
    return getSnapshot(area, key) ?? initialValue;
  }

  // Start with null for the hydration, and then switch to the actual value.
  function getKeyServerSnapshot() {
    return null;
  }

  const storedValue = useSyncExternalStore(
    subscribeKey,
    getKeySnapshot,
    getKeyServerSnapshot,
  );

  function setStoredValue(value: SetStateAction<string | null>) {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setValue(area, key, valueToStore);
  }

  return [storedValue, setStoredValue];
}

export const useLocalStorageState =
  typeof window === 'undefined'
    ? useLocalStorageStateServer
    : useLocalStorageStateBrowser;
