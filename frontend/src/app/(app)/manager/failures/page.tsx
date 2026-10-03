import { PageHeader } from '@/components/ui/panel';
import { FailureLog } from '@/modules/instruments';

export default function FailuresPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Сбои приборов" note="Записи журнала сбоев со всех станций сети." />
      <div className="animate-rise"><FailureLog showStation /></div>
    </div>
  );
}
