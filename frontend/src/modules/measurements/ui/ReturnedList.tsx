'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ChatCircleText } from '@phosphor-icons/react/ssr';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Measurement } from '@/api';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader, Panel, PanelBody } from '@/components/ui/panel';
import { Alert, Empty, Skeleton } from '@/components/ui/states';
import { formatDateTime, formatValue } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { useRecheck, useReturnedMeasurements } from '../hooks/queries';
import { returnComment } from '../lib/return-comment';
import { ChecksList, MeasurementHistory } from './MeasurementDetails';

export function ReturnedList() {
  const { data, isLoading, error } = useReturnedMeasurements();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Возвращённые замеры"
        note="Исправьте значение или подтвердите его с обоснованием, проверка запустится заново."
      />
      {isLoading ? (
        <Panel><Skeleton rows={5} /></Panel>
      ) : error ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : !data?.length ? (
        <Panel><Empty title="Возвращённых замеров нет" hint="Когда руководитель вернёт замер на перепроверку, он появится здесь." /></Panel>
      ) : (
        data.map((m, i) => <ReturnedCard key={m.id} measurement={m} index={i} />)
      )}
    </div>
  );
}

const toNumber = (v: string) => Number(v.trim().replace(',', '.'));

const schema = z.object({
  value: z.string().trim().min(1, 'Введите значение').refine((v) => Number.isFinite(toNumber(v)), 'Должно быть числом'),
  reason: z.string().trim().min(3, 'Опишите, что проверили').max(500),
});

function ReturnedCard({ measurement: m, index }: { measurement: Measurement; index: number }) {
  const recheck = useRecheck();
  const comment = returnComment(m);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { value: String(m.value), reason: '' },
  });

  return (
    <Panel className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
      <PanelBody className="flex flex-col gap-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight">{m.parameter.name}</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              срок {formatDateTime(m.observedAt)}, прибор «{m.instrument.name}», ревизия {m.currentRevision}
            </p>
          </div>
          <span className="font-mono text-2xl tracking-tight">
            {formatValue(m.value, m.parameter.precision, m.parameter.unit)}
          </span>
        </div>

        {comment && (
          <div className="flex items-start gap-2.5 rounded-xl bg-bad-soft/70 px-3.5 py-3 text-sm">
            <ChatCircleText size={18} className="mt-px shrink-0 text-bad" />
            <div>
              <span className="text-ink-3">Руководитель: </span>
              {comment}
            </div>
          </div>
        )}

        <ChecksList measurement={m} />

        <form
          className="grid gap-3 border-t border-line pt-5 sm:grid-cols-[160px_1fr_auto] sm:items-end"
          onSubmit={handleSubmit((v) => recheck.mutate({ id: m.id, body: { value: toNumber(v.value), reason: v.reason } }))}
          noValidate
        >
          <Field label={`Значение, ${m.parameter.unit}`} error={formState.errors.value?.message}>
            <Input inputMode="decimal" className="font-mono" {...register('value')} />
          </Field>
          <Field label="Обоснование" error={formState.errors.reason?.message}>
            <Input placeholder="Например, перепроверил показания, была опечатка" {...register('reason')} />
          </Field>
          <Button type="submit" disabled={recheck.isPending} trailing={<ArrowRight size={16} />} className="sm:mb-px">
            {recheck.isPending ? 'Отправляем' : 'Отправить'}
          </Button>
        </form>
        {recheck.isError && <Alert>{getErrorMessage(recheck.error)}</Alert>}

        <details className="group text-sm">
          <summary className="cursor-pointer list-none text-[13px] text-ink-3 transition-colors hover:text-ink">
            <span className="group-open:hidden">Показать историю</span>
            <span className="hidden group-open:inline">Скрыть историю</span>
          </summary>
          <div className="mt-3"><MeasurementHistory measurement={m} /></div>
        </details>
      </PanelBody>
    </Panel>
  );
}
