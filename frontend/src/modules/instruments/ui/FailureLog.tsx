'use client';

import { Panel, PanelHeader } from '@/components/ui/panel';
import { Alert, Empty, Skeleton } from '@/components/ui/states';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { formatDateTime } from '@/shared/format';
import { getErrorMessage } from '@/shared/http';
import { useFailures } from '../hooks/queries';

export function FailureLog({ showStation = false }: { showStation?: boolean }) {
  const { data, isLoading, error } = useFailures();

  return (
    <Panel>
      <PanelHeader title="Журнал сбоев" />
      {isLoading ? (
        <Skeleton rows={4} />
      ) : error ? (
        <div className="px-5 pb-5"><Alert>{getErrorMessage(error)}</Alert></div>
      ) : !data?.length ? (
        <Empty title="Сбоев не было" hint="Отметка поломки на экране приборов добавит запись сюда." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Когда</Th>
              {showStation && <Th>Станция</Th>}
              <Th>Прибор</Th>
              <Th>Что случилось</Th>
              <Th>Замена</Th>
              <Th>Сообщил</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => (
              <Tr key={f.id}>
                <Td className="font-mono text-[13px] whitespace-nowrap text-ink-2">{formatDateTime(f.openedAt)}</Td>
                {showStation && (
                  <Td className="whitespace-nowrap">
                    {f.station.name} <span className="font-mono text-[12px] text-ink-3">{f.station.code}</span>
                  </Td>
                )}
                <Td>
                  {f.instrument.name} <span className="font-mono text-[12px] text-ink-3">{f.instrument.model}</span>
                </Td>
                <Td className="max-w-[40ch]">{f.description}</Td>
                <Td className="text-ink-2">{f.reserveInstrument?.name ?? <span className="text-ink-3">нет</span>}</Td>
                <Td className="text-ink-2">{f.reportedBy}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  );
}
