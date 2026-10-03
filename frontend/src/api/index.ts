import { anomaliesApi } from './anomalies/anomalies.api';
import { authApi } from './auth/auth.api';
import { instrumentsApi } from './instruments/instruments.api';
import { measurementsApi } from './measurements/measurements.api';
import { referenceApi } from './reference/reference.api';
import { reportsApi } from './reports/reports.api';

export const api = {
  auth: authApi,
  measurements: measurementsApi,
  anomalies: anomaliesApi,
  instruments: instrumentsApi,
  reference: referenceApi,
  reports: reportsApi,
};

export type * from './auth/auth.model';
export type * from './measurements/measurements.model';
export type * from './instruments/instruments.model';
export type * from './reference/reference.model';
export type * from './reports/reports.model';
export type { ReviewAction } from './anomalies/anomalies.api';
