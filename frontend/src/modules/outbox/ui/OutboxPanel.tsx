'use client';

import { PaperPlaneTilt, Trash } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { Alert } from '@/components/ui/states';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { useAutoFlush, useConnection, useOutbox } from '../hooks/useOutbox';
import { removeItems } from '../lib/outbox-store';

export function OutboxPanel() {
  const items = useOutbox();
  const { online, simulatedOffline, setSimulatedOffline } = useConnection();
  const flush = useAutoFlush();
  const sendable = items.some((i) => !i.error);

  return (
    <Panel>
      <PanelHeader
        title="Очередь передачи"
        note="Без связи замеры копятся здесь и уходят пакетом с пометкой «задержанная передача»."
      />
      <PanelBody className="flex flex-col gap-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-canvas/70 px-3.5 py-3">
          <span className="text-sm">Имитировать отсутствие связи</span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={simulatedOffline}
              onChange={(e) => setSimulatedOffline(e.target.checked)}
            />
            <span className="h-6 w-10 rounded-full bg-ink/15 transition-colors duration-300 ease-out-expo peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
            <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out-expo peer-checked:translate-x-4" />
          </span>
        </label>

        {items.length === 0 ? (
          <p className="py-2 text-sm text-ink-3">Очередь пуста, всё передано.</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((i) => (
              <li key={i.clientId} className="flex animate-rise items-start justify-between gap-3 border-t border-line py-3 first:border-t-0">
                <div className="min-w-0 text-sm">
                  <div className="truncate">{i.label}</div>
                  <div className={cn('mt-0.5 text-[12px]', i.error ? 'text-bad' : 'text-ink-3')}>
                    {i.error ?? `в очереди с ${formatDateTime(i.queuedAt)}`}
                  </div>
                </div>
                {i.error && (
                  <Button variant="ghost" size="icon" onClick={() => removeItems([i.clientId])} aria-label="Убрать из очереди">
                    <Trash size={16} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {flush.isError && <Alert>{getErrorMessage(flush.error)}</Alert>}
        <Button variant="secondary" onClick={() => flush.mutate()} disabled={!online || flush.isPending || !sendable}>
          <PaperPlaneTilt size={16} />
          {flush.isPending ? 'Отправляем' : 'Отправить накопленное'}
        </Button>
      </PanelBody>
    </Panel>
  );
}
