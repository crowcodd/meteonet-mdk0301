'use client';

import { useSyncExternalStore } from 'react';

const ACCESS = 'meteonet.access';
const REFRESH = 'meteonet.refresh';
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** токены лежат в localStorage, а React подписывается на их изменения */
export const authStore = {
  get access() {
    return read(ACCESS);
  },
  get refresh() {
    return read(REFRESH);
  },
  set(tokens: { accessToken: string; refreshToken: string }) {
    localStorage.setItem(ACCESS, tokens.accessToken);
    localStorage.setItem(REFRESH, tokens.refreshToken);
    listeners.forEach((l) => l());
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** undefined значит ещё не прочитали (на сервере), null значит не вошёл */
export function useAccessToken(): string | null | undefined {
  return useSyncExternalStore(
    authStore.subscribe,
    () => authStore.access,
    () => undefined,
  );
}
