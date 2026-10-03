import { PageHeader } from '@/components/ui/panel';
import { MeasurementForm, StationMeasurements } from '@/modules/measurements';
import { OutboxPanel } from '@/modules/outbox';

export default function ObserverPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ввод замеров" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 animate-rise flex-col gap-6">
          <MeasurementForm />
          <StationMeasurements />
        </div>
        <div className="animate-rise [animation-delay:80ms] lg:sticky lg:top-24 lg:self-start">
          <OutboxPanel />
        </div>
      </div>
    </div>
  );
}
