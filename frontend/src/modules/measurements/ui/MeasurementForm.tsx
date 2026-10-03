'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { Alert } from '@/components/ui/states';
import { cn } from '@/lib/cn';
import { useInstruments } from '@/modules/instruments';
import { formatDateTime, lastObservationTerm, toDateTimeLocal } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { STATUS_LABEL } from '@/shared/labels';
import { useParameters, useSubmitMeasurement } from '../hooks/queries';

const toNumber = (v: string) => Number(v.trim().replace(',', '.'));

const schema = z.object({
  parameterId: z.string().min(1, 'Выберите параметр'),
  instrumentId: z.string().min(1, 'Выберите прибор'),
  observedAt: z.string().min(1, 'Укажите срок наблюдения'),
  value: z
    .string()
    .trim()
    .min(1, 'Введите значение')
    .refine((v) => Number.isFinite(toNumber(v)), 'Значение должно быть числом'),
});

type FormValues = z.infer<typeof schema>;

export function MeasurementForm() {
  const { data: parameters = [] } = useParameters();
  const { data: instruments = [] } = useInstruments();
  const submit = useSubmitMeasurement();
  const [notice, setNotice] = useState<{ tone: 'success' | 'info'; text: string } | null>(null);

  const { register, handleSubmit, formState, control, setValue, resetField } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { parameterId: '', instrumentId: '', observedAt: toDateTimeLocal(lastObservationTerm()), value: '' },
  });

  const parameterId = Number(useWatch({ control, name: 'parameterId' }));
  const parameter = parameters.find((p) => p.id === parameterId);
  // только исправные приборы станции, которые меряют выбранный параметр
  const available = instruments.filter((i) => i.state === 'IN_SERVICE' && i.parameters.some((p) => p.id === parameterId));

  // при смене параметра сбрасываем прибор, а если подходит ровно один, сразу подставляем его
  const onlyInstrument = available.length === 1 ? String(available[0]!.id) : '';
  useEffect(() => {
    setValue('instrumentId', onlyInstrument);
  }, [parameterId, onlyInstrument, setValue]);

  const onSubmit = handleSubmit(async (v) => {
    setNotice(null);
    const payload = {
      parameterId: Number(v.parameterId),
      instrumentId: Number(v.instrumentId),
      observedAt: new Date(v.observedAt).toISOString(),
      value: toNumber(v.value),
    };
    const label = `${parameter?.name ?? 'Параметр'}, ${formatDateTime(payload.observedAt)}: ${v.value} ${parameter?.unit ?? ''}`;
    const result = await submit.mutateAsync({ payload, label }).catch(() => null);
    if (!result) return;
    setNotice(
      result.queued
        ? { tone: 'info', text: 'Связи нет, замер сохранён в очереди и уйдёт сам' }
        : { tone: 'success', text: `Передано, статус «${STATUS_LABEL[result.status as keyof typeof STATUS_LABEL]}»` },
    );
    resetField('value');
  });

  return (
    <Panel>
      <PanelHeader title="Новый замер" note="Центр проверяет значение сразу после получения." />
      <PanelBody>
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-2">Параметр</legend>
            <div className="flex flex-wrap gap-2">
              {parameters.map((p) => (
                <label key={p.id} className="cursor-pointer">
                  <input type="radio" value={p.id} className="peer sr-only" {...register('parameterId')} />
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm ring-1 ring-line transition-[background-color,color,box-shadow] duration-300 ease-out-expo',
                      'hover:ring-ink/20 peer-checked:bg-ink peer-checked:text-white peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                    )}
                  >
                    {p.name}
                    <span className="text-[12px] opacity-60">{p.unit}</span>
                  </span>
                </label>
              ))}
            </div>
            {formState.errors.parameterId && (
              <p className="mt-2 text-[13px] text-bad">{formState.errors.parameterId.message}</p>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr]">
            <Field
              label="Прибор"
              error={formState.errors.instrumentId?.message}
              hint={parameter && available.length === 0 ? 'Нет исправного прибора для этого параметра' : undefined}
            >
              <Select aria-invalid={!!formState.errors.instrumentId} disabled={!parameter} {...register('instrumentId')}>
                <option value="">{parameter ? 'Выберите прибор' : 'Сначала параметр'}</option>
                {available.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}, {i.model}
                    {i.role === 'RESERVE' ? ' (резерв)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Срок" error={formState.errors.observedAt?.message} hint="Срочные каждые 3 часа">
              <Input type="datetime-local" aria-invalid={!!formState.errors.observedAt} {...register('observedAt')} />
            </Field>
            <Field
              label="Значение"
              error={formState.errors.value?.message}
              hint={parameter && `от ${parameter.minValue} до ${parameter.maxValue}`}
            >
              <div className="relative">
                <Input
                  inputMode="decimal"
                  className="pr-14 font-mono text-base"
                  aria-invalid={!!formState.errors.value}
                  {...register('value')}
                />
                {parameter && (
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-ink-3">
                    {parameter.unit}
                  </span>
                )}
              </div>
            </Field>
          </div>

          {submit.isError && <Alert>{getErrorMessage(submit.error)}</Alert>}
          {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
          <Button type="submit" disabled={submit.isPending} className="self-start" trailing={<ArrowRight size={16} />}>
            {submit.isPending ? 'Передаём' : 'Передать в центр'}
          </Button>
        </form>
      </PanelBody>
    </Panel>
  );
}
