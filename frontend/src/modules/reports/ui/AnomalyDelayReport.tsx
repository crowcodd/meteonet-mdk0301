'use client';

import { DownloadSimple } from '@phosphor-icons/react/ssr';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader, Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { Alert, Empty, Skeleton } from '@/components/ui/states';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { formatDate, formatMinutes } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { useAnomalyDelayReport, useDownloadCsv } from '../hooks/queries';
import { defaultPeriod, toApiPeriod } from '../lib/period';

const pct = (v: number | null) => (v === null ? 'нет' : `${Math.round(v * 100)}%`);

export function AnomalyDelayReport() {
  const [range, setRange] = useState(defaultPeriod);
  const period = useMemo(() => toApiPeriod(range), [range]);
  const { data, isLoading, error } = useAnomalyDelayReport(period);
  const csv = useDownloadCsv();
  const maxDaily = Math.max(1, ...(data?.daily.map((d) => Math.max(d.flagged, d.delayed)) ?? []));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Выбросы и задержки"
        note="Помеченные замеры по станциям и типам проверок, задержанные передачи."
        aside={
          <div className="flex flex-wrap items-end gap-3">
            <Field label="С">
              <Input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))} />
            </Field>
            <Field label="По">
              <Input type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))} />
            </Field>
            <Button variant="secondary" onClick={() => csv.mutate(period)} disabled={csv.isPending || !data}>
              <DownloadSimple size={16} /> CSV
            </Button>
          </div>
        }
      />
      {csv.isError && <Alert>{getErrorMessage(csv.error)}</Alert>}

      {isLoading ? (
        <Panel><Skeleton rows={6} /></Panel>
      ) : error ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : !data || data.totals.total === 0 ? (
        <Panel><Empty title="За период замеров нет" hint="Выберите другой период." /></Panel>
      ) : (
        <>
          <Panel className="animate-rise">
            <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <Figure
                big
                label="Помечено проверками"
                value={String(data.totals.flagged)}
                sub={`из ${data.totals.total} замеров, ложных ${pct(data.totals.falsePositiveShare)}`}
              />
              <Figure
                label="После перепроверки"
                value={`${data.totals.correctedAfterRecheck} / ${data.totals.confirmedAfterRecheck}`}
                sub="исправлено / подтверждено"
              />
              <Figure label="Задержанных передач" value={String(data.totals.delayedCount)} sub={`в среднем ${formatMinutes(data.totals.delayAvgMin)}`} />
              <Figure label="Дольше всего без связи" value={formatMinutes(data.totals.maxOutageMin)} />
            </div>
            {data.topStation && data.topStation.flagged > 0 && (
              <p className="border-t border-line px-5 py-3.5 text-sm text-ink-2">
                Больше всего аномалий на станции{' '}
                <span className="font-medium text-ink">{data.topStation.stationName}</span>{' '}
                <span className="font-mono text-ink-3">{data.topStation.stationCode}</span>: {data.topStation.flagged}
              </p>
            )}
          </Panel>

          <Panel className="animate-rise [animation-delay:60ms]">
            <PanelHeader title="По станциям" />
            <Table>
              <thead>
                <tr>
                  <Th>Станция</Th>
                  <Th className="text-right">Замеров</Th>
                  <Th className="text-right">Помечено</Th>
                  <Th className="text-right">Диапазон</Th>
                  <Th className="text-right">Соседи</Th>
                  <Th className="text-right">Выброс</Th>
                  <Th className="text-right">Подтв.</Th>
                  <Th className="text-right">Испр.</Th>
                  <Th className="text-right">Откл.</Th>
                  <Th className="text-right">Ложные</Th>
                  <Th className="text-right">Задержек</Th>
                  <Th className="text-right">Всего задержка</Th>
                  <Th className="text-right">Средняя</Th>
                  <Th className="text-right">Без связи</Th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {data.stations.map((s) => (
                  <Tr key={s.stationId}>
                    <Td className="font-sans text-sm whitespace-nowrap">
                      {s.stationName} <span className="font-mono text-[12px] text-ink-3">{s.stationCode}</span>
                    </Td>
                    <Td className="text-right text-ink-2">{s.total}</Td>
                    <Td className={cn('text-right', s.flagged > 0 ? 'font-medium text-warn' : 'text-ink-3')}>{s.flagged}</Td>
                    <Td className="text-right text-ink-2">{s.flaggedRange}</Td>
                    <Td className="text-right text-ink-2">{s.flaggedNeighbors}</Td>
                    <Td className="text-right text-ink-2">{s.flaggedOutlier}</Td>
                    <Td className="text-right text-ink-2">{s.confirmedAfterRecheck}</Td>
                    <Td className="text-right text-ink-2">{s.correctedAfterRecheck}</Td>
                    <Td className="text-right text-ink-2">{s.rejected}</Td>
                    <Td className="text-right text-ink-2">{pct(s.falsePositiveShare)}</Td>
                    <Td className="text-right text-ink-2">{s.delayedCount}</Td>
                    <Td className="text-right whitespace-nowrap text-ink-2">{formatMinutes(s.delayTotalMin)}</Td>
                    <Td className="text-right whitespace-nowrap text-ink-2">{formatMinutes(s.delayAvgMin)}</Td>
                    <Td className="text-right whitespace-nowrap text-ink-2">{formatMinutes(s.maxOutageMin)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel className="animate-rise [animation-delay:120ms]">
            <PanelHeader
              title="По дням"
              aside={
                <div className="flex gap-4 text-[12px] text-ink-3">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-warn" /> помечено</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-accent" /> задержано</span>
                </div>
              }
            />
            <PanelBody>
              <ul className="flex flex-col gap-2.5">
                {data.daily.map((d) => (
                  <li key={d.date} className="grid grid-cols-[96px_1fr] items-center gap-4">
                    <span className="font-mono text-[12px] text-ink-3">{formatDate(d.date)}</span>
                    <div className="flex flex-col gap-1">
                      <Bar value={d.flagged} max={maxDaily} className="bg-warn" />
                      <Bar value={d.delayed} max={maxDaily} className="bg-accent" />
                    </div>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
        </>
      )}
    </div>
  );
}

function Figure({ label, value, sub, big }: { label: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div className="border-line px-5 py-5 not-first:border-l max-md:nth-3:border-l-0 max-md:nth-[n+3]:border-t">
      <div className="text-[13px] text-ink-3">{label}</div>
      <div className={cn('mt-2 font-mono tracking-tight', big ? 'text-4xl md:text-5xl' : 'text-2xl md:text-[28px]')}>{value}</div>
      {sub && <div className="mt-1.5 text-[13px] text-ink-3">{sub}</div>}
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('h-1.5 origin-left rounded-full transition-transform duration-700 ease-out-expo', className)}
        style={{ width: `${Math.max(value ? 1.5 : 0, (value / max) * 100)}%` }}
      />
      <span className="font-mono text-[11px] text-ink-3">{value}</span>
    </div>
  );
}
