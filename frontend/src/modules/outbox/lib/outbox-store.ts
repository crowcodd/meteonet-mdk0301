import type { CreateMeasurement } from '@/api';
import { createLocalStore } from './local-store';

/** черновик замера, который ждёт отправки */
export interface OutboxItem {
  clientId: string;
  payload: CreateMeasurement;
  label: string;
  queuedAt: string;
  error?: string;
}

const EMPTY: OutboxItem[] = [];

export const outboxStore = createLocalStore<OutboxItem[]>('meteonet.outbox', EMPTY);
export const offlineSimulationStore = createLocalStore<boolean>('meteonet.simulate-offline', false);

export function enqueue(payload: CreateMeasurement, label: string): OutboxItem {
  const item: OutboxItem = { clientId: crypto.randomUUID(), payload, label, queuedAt: new Date().toISOString() };
  outboxStore.set([...outboxStore.get(), item]);
  return item;
}

export function removeItems(clientIds: string[]) {
  const drop = new Set(clientIds);
  outboxStore.set(outboxStore.get().filter((i) => !drop.has(i.clientId)));
}

export function markErrors(errors: Map<string, string>) {
  outboxStore.set(outboxStore.get().map((i) => (errors.has(i.clientId) ? { ...i, error: errors.get(i.clientId) } : i)));
}
