/** маленькое хранилище поверх localStorage, на которое можно подписаться через useSyncExternalStore */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } | null = null;

  const get = (): T => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (cache && cache.raw === raw) return cache.value;
    let value = fallback;
    try {
      value = raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      value = fallback;
    }
    cache = { raw, value };
    return value;
  };

  const set = (next: T) => {
    localStorage.setItem(key, JSON.stringify(next));
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener();
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  return { get, set, subscribe, fallback };
}
