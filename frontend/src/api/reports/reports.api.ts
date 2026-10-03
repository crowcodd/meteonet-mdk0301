import type { AxiosInstance } from 'axios';
import { http } from '@/shared/http';
import type { AnomalyDelayReport, ReportPeriod } from './reports.model';

export class ReportsApi {
  constructor(private readonly http: AxiosInstance) {}

  anomaliesDelays = (period: ReportPeriod) =>
    this.http.get<AnomalyDelayReport>('/reports/anomalies-delays', { params: period }).then((r) => r.data);
  anomaliesDelaysCsv = (period: ReportPeriod) =>
    this.http
      .get<Blob>('/reports/anomalies-delays/csv', { params: period, responseType: 'blob' })
      .then((r) => r.data);
}

export const reportsApi = new ReportsApi(http);
