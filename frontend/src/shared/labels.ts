import type { CheckType, InstrumentState, MeasurementStatus, VerificationStatus } from '@/api';

export const STATUS_LABEL: Record<MeasurementStatus, string> = {
  DRAFT: 'Черновик',
  RECEIVED: 'Получено',
  FLAGGED: 'Помечено',
  RETURNED: 'Возвращено',
  RECHECKED: 'Перепроверено',
  ACCEPTED: 'Принято',
  REJECTED: 'Отклонено',
};

export const CHECK_LABEL: Record<CheckType, string> = {
  RANGE: 'Диапазон',
  NEIGHBORS: 'Соседи',
  OUTLIER: 'Выброс',
};

export const INSTRUMENT_STATE_LABEL: Record<InstrumentState, string> = {
  IN_SERVICE: 'В работе',
  BROKEN: 'Неисправен',
  VERIFICATION: 'На поверке',
  DECOMMISSIONED: 'Списан',
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  OK: 'В срок',
  DUE_SOON: 'Скоро поверка',
  OVERDUE: 'Поверка просрочена',
};
