import type { MeasurementStatus } from '@/api';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { STATUS_LABEL } from '@/shared/labels';

const TONE: Record<MeasurementStatus, BadgeTone> = {
  DRAFT: 'neutral',
  RECEIVED: 'neutral',
  FLAGGED: 'warn',
  RETURNED: 'bad',
  RECHECKED: 'accent',
  ACCEPTED: 'good',
  REJECTED: 'neutral',
};

export function StatusBadge({ status }: { status: MeasurementStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
