import type { AxiosInstance } from 'axios';
import { http } from '@/shared/http';
import type { BatchItem, BatchResultItem, CreateMeasurement, Measurement, Recheck } from './measurements.model';

export class MeasurementsApi {
  constructor(private readonly http: AxiosInstance) {}

  submit = (body: CreateMeasurement) => this.http.post<Measurement>('/measurements', body).then((r) => r.data);
  submitBatch = (items: BatchItem[]) =>
    this.http.post<{ items: BatchResultItem[] }>('/measurements/batch', { items }).then((r) => r.data.items);
  listStation = () => this.http.get<Measurement[]>('/measurements/station').then((r) => r.data);
  listReturned = () => this.http.get<Measurement[]>('/measurements/returned').then((r) => r.data);
  recheck = (id: number, body: Recheck) =>
    this.http.post<Measurement>(`/measurements/${id}/recheck`, body).then((r) => r.data);
}

export const measurementsApi = new MeasurementsApi(http);
