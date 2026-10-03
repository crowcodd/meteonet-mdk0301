'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { api } from '@/api';
import { markErrors, offlineSimulationStore, outboxStore, removeItems } from '../lib/outbox-store';

export function useOutbox() {
  return useSyncExternalStore(outboxStore.subscribe, outboxStore.get, () => outboxStore.fallback);
}

function subscribeNetwork(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  const unsub = offlineSimulationStore.subscribe(listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
    unsub();
  };
}

/** связь есть, если браузер онлайн и не включена имитация обрыва */
export function useConnection() {
  const simulatedOffline = useSyncExternalStore(offlineSimulationStore.subscribe, offlineSimulationStore.get, () => false);
  const browserOnline = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);
  return {
    online: browserOnline && !simulatedOffline,
    simulatedOffline,
    setSimulatedOffline: (v: boolean) => offlineSimulationStore.set(v),
  };
}

/** отправляем очередь одним пакетом: принятое и дубли убираем, ошибочные записи оставляем с текстом ошибки */
export function useFlushOutbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const items = outboxStore.get();
      if (items.length === 0) return [];
      return api.measurements.submitBatch(items.map((i) => ({ ...i.payload, clientId: i.clientId })));
    },
    onSuccess: (results) => {
      removeItems(results.filter((r) => r.status !== 'error').map((r) => r.clientId));
      markErrors(new Map(results.filter((r) => r.status === 'error').map((r) => [r.clientId, r.error ?? 'Ошибка'])));
      qc.invalidateQueries({ queryKey: ['measurements'] });
    },
  });
}

/** как только связь вернулась, очередь уходит сама */
export function useAutoFlush() {
  const { online } = useConnection();
  const items = useOutbox();
  const flush = useFlushOutbox();
  const pending = items.filter((i) => !i.error).length;

  useEffect(() => {
    if (online && pending > 0 && !flush.isPending) flush.mutate();
    // flush сюда не добавляем, объект мутации новый на каждом рендере и эффект зациклится
  }, [online, pending]);

  return flush;
}
