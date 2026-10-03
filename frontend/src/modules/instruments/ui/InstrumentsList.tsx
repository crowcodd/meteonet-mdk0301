'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Instrument, VerificationStatus } from '@/api';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Alert, Skeleton } from '@/components/ui/states';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { formatDate } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { INSTRUMENT_STATE_LABEL, VERIFICATION_LABEL } from '@/shared/labels';
import { useInstruments, useReportFailure } from '../hooks/queries';

const VERIFICATION_TONE: Record<VerificationStatus, BadgeTone> = { OK: 'neutral', DUE_SOON: 'warn', OVERDUE: 'bad' };

export function InstrumentsList() {
  const { data, isLoading, error } = useInstruments();
  const [broken, setBroken] = useState<Instrument | null>(null);
  const instruments = data ?? [];

  return (
    <Panel>
      <PanelHeader title="Приборы в эксплуатации" note="Состояние, роль и сроки поверки приборов станции." />
      {isLoading ? (
        <Skeleton rows={7} />
      ) : error ? (
        <div className="px-5 pb-5"><Alert>{getErrorMessage(error)}</Alert></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Прибор</Th>
              <Th>Параметры</Th>
              <Th>Роль</Th>
              <Th>Состояние</Th>
              <Th>Поверка до</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {instruments.map((i) => (
              <Tr key={i.id} className={cn(broken?.id === i.id && 'bg-ink/[0.025]')}>
                <Td>
                  <div className="font-medium">{i.name}</div>
                  <div className="font-mono text-[12px] text-ink-3">{i.model}</div>
                </Td>
                <Td className="text-ink-2">{i.parameters.map((p) => p.name).join(', ')}</Td>
                <Td className="text-ink-2">{i.role === 'PRIMARY' ? 'основной' : 'резервный'}</Td>
                <Td>
                  <Badge tone={i.state === 'IN_SERVICE' ? 'good' : i.state === 'BROKEN' ? 'bad' : 'neutral'}>
                    {INSTRUMENT_STATE_LABEL[i.state]}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap">
                  <div className="font-mono text-[13px]">{formatDate(i.nextVerificationAt)}</div>
                  {i.verificationStatus !== 'OK' && (
                    <Badge tone={VERIFICATION_TONE[i.verificationStatus]} className="mt-1">
                      {VERIFICATION_LABEL[i.verificationStatus]}
                    </Badge>
                  )}
                </Td>
                <Td className="text-right">
                  {i.state === 'IN_SERVICE' && (
                    <Button variant="ghost" size="sm" onClick={() => setBroken(i)}>
                      <Wrench size={15} /> Поломка
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {broken && (
        <FailureForm
          key={broken.id}
          instrument={broken}
          reserves={instruments.filter(
            (r) =>
              r.id !== broken.id &&
              r.role === 'RESERVE' &&
              r.state === 'IN_SERVICE' &&
              r.parameters.some((p) => broken.parameters.some((bp) => bp.id === p.id)),
          )}
          onDone={() => setBroken(null)}
        />
      )}
    </Panel>
  );
}

const schema = z.object({
  description: z.string().trim().min(3, 'Опишите неисправность').max(1000),
  reserveInstrumentId: z.string(),
});

function FailureForm({ instrument, reserves, onDone }: { instrument: Instrument; reserves: Instrument[]; onDone: () => void }) {
  const report = useReportFailure();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { description: '', reserveInstrumentId: reserves[0] ? String(reserves[0].id) : '' },
  });

  return (
    <form
      className="m-2 mt-0 flex animate-rise flex-col gap-4 rounded-xl bg-canvas/70 p-4"
      onSubmit={handleSubmit((v) =>
        report.mutate(
          {
            id: instrument.id,
            body: {
              description: v.description,
              reserveInstrumentId: v.reserveInstrumentId ? Number(v.reserveInstrumentId) : undefined,
            },
          },
          { onSuccess: onDone },
        ),
      )}
      noValidate
    >
      <h3 className="text-[15px] font-semibold tracking-tight">
        Поломка: {instrument.name} <span className="font-mono text-[13px] font-normal text-ink-3">{instrument.model}</span>
      </h3>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Field label="Что случилось" error={formState.errors.description?.message}>
          <Textarea {...register('description')} />
        </Field>
        <Field label="Перейти на резервный" hint={reserves.length === 0 ? 'Подходящих резервных приборов нет' : undefined}>
          <Select {...register('reserveInstrumentId')} disabled={reserves.length === 0}>
            <option value="">Без замены</option>
            {reserves.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}, {r.model}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {report.isError && <Alert>{getErrorMessage(report.error)}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={report.isPending}>
          {report.isPending ? 'Сохраняем' : 'Отметить неисправным'}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
