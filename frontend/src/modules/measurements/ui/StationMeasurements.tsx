'use client';

import { Clock } from '@phosphor-icons/react/ssr';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Alert, Empty, Skeleton } from '@/components/ui/states';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { formatDateTime, formatValue } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { CHECK_LABEL } from '@/shared/labels';
import { useStationMeasurements } from '../hooks/queries';
import { StatusBadge } from './StatusBadge';

export function StationMeasurements() {
  const { data, isLoading, error } = useStationMeasurements();

  return (
    <Panel>
      <PanelHeader title="Последние замеры станции" />
      {isLoading ? (
        <Skeleton rows={6} />
      ) : error ? (
        <div className="px-5 pb-5"><Alert>{getErrorMessage(error)}</Alert></div>
      ) : !data?.length ? (
        <Empty title="Замеров пока нет" hint="Первый замер появится здесь сразу после передачи." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Срок</Th>
              <Th>Параметр</Th>
              <Th className="text-right">Значение</Th>
              <Th>Статус</Th>
              <Th>Подозрение</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <Tr key={m.id}>
                <Td className="font-mono text-[13px] whitespace-nowrap text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    {formatDateTime(m.observedAt)}
                    {m.delayed && (
                      <span title="Задержанная передача" aria-label="Задержанная передача" className="text-warn">
                        <Clock size={14} />
                      </span>
                    )}
                  </span>
                </Td>
                <Td>{m.parameter.name}</Td>
                <Td className="text-right font-mono whitespace-nowrap">
                  {formatValue(m.value, m.parameter.precision, m.parameter.unit)}
                </Td>
                <Td><StatusBadge status={m.status} /></Td>
                <Td className="text-[13px] text-warn">
                  {m.checks.filter((c) => c.verdict === 'SUSPECT').map((c) => CHECK_LABEL[c.type]).join(', ')}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  );
}
