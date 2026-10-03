'use client';

import { ArrowCounterClockwise, Check, Clock, X } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import type { Measurement, ReviewAction } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader, Panel, PanelBody } from '@/components/ui/panel';
import { Alert, Empty, Skeleton } from '@/components/ui/states';
import { ChecksList, MeasurementHistory } from '@/modules/measurements';
import { formatDateTime, formatValue } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { useAnomalies, useReview } from '../hooks/queries';

export function AnomaliesList() {
  const { data, isLoading, error } = useAnomalies();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Аномалии"
        note="Замеры, по которым проверка дала подозрение. Верните на станцию, примите или отклоните."
        aside={data?.length ? <span className="font-mono text-sm text-ink-3">{data.length} на разборе</span> : undefined}
      />
      {isLoading ? (
        <Panel><Skeleton rows={5} /></Panel>
      ) : error ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : !data?.length ? (
        <Panel><Empty title="Разбирать нечего" hint="Все поступившие замеры прошли автоматическую проверку." /></Panel>
      ) : (
        data.map((m, i) => <AnomalyCard key={m.id} measurement={m} index={i} />)
      )}
    </div>
  );
}

function AnomalyCard({ measurement: m, index }: { measurement: Measurement; index: number }) {
  const review = useReview();
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const commentError = touched && !comment.trim() ? 'Решение нужно обосновать' : undefined;

  const act = (action: ReviewAction) => {
    setTouched(true);
    if (comment.trim()) review.mutate({ id: m.id, action, comment: comment.trim() });
  };

  return (
    <Panel className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
      <PanelBody className="flex flex-col gap-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight">
              {m.station.name}, {m.parameter.name.toLowerCase()}
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              <span className="font-mono">{m.station.code}</span>, срок {formatDateTime(m.observedAt)}, прибор «
              {m.instrument.name}»
            </p>
            {(m.delayed || m.currentRevision > 1) && (
              <div className="mt-2 flex gap-1.5">
                {m.delayed && (
                  <Badge tone="warn">
                    <Clock size={12} /> задержанная передача
                  </Badge>
                )}
                {m.currentRevision > 1 && <Badge tone="accent">после перепроверки, ревизия {m.currentRevision}</Badge>}
              </div>
            )}
          </div>
          <span className="font-mono text-2xl tracking-tight">
            {formatValue(m.value, m.parameter.precision, m.parameter.unit)}
          </span>
        </div>

        <ChecksList measurement={m} />

        <div className="flex flex-col gap-3 border-t border-line pt-5 md:flex-row md:items-end">
          <div className="flex-1">
            <Field label="Комментарий к решению" error={commentError}>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Например, проверьте показания термометра"
                aria-invalid={!!commentError}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 md:mb-px">
            <Button variant="secondary" onClick={() => act('return')} disabled={review.isPending}>
              <ArrowCounterClockwise size={16} /> На станцию
            </Button>
            <Button onClick={() => act('accept')} disabled={review.isPending}>
              <Check size={16} /> Принять
            </Button>
            <Button variant="danger" onClick={() => act('reject')} disabled={review.isPending}>
              <X size={16} /> Отклонить
            </Button>
          </div>
        </div>
        {review.isError && <Alert>{getErrorMessage(review.error)}</Alert>}

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
