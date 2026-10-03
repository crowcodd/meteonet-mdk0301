import type { AxiosInstance } from 'axios';
import { http } from '@/shared/http';
import type { Failure, Instrument, ReportFailure } from './instruments.model';

export class InstrumentsApi {
  constructor(private readonly http: AxiosInstance) {}

  list = () => this.http.get<Instrument[]>('/instruments').then((r) => r.data);
  reportFailure = (id: number, body: ReportFailure) =>
    this.http.post<Failure>(`/instruments/${id}/failure`, body).then((r) => r.data);
  listFailures = () => this.http.get<Failure[]>('/failures').then((r) => r.data);
}

export const instrumentsApi = new InstrumentsApi(http);
