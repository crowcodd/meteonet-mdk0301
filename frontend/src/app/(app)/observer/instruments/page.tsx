import { PageHeader } from '@/components/ui/panel';
import { FailureLog, InstrumentsList } from '@/modules/instruments';

export default function InstrumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Приборы" note="Отметьте поломку, если прибор вышел из строя. При наличии резерва станция перейдёт на него." />
      <div className="animate-rise"><InstrumentsList /></div>
      <div className="animate-rise [animation-delay:80ms]"><FailureLog /></div>
    </div>
  );
}
