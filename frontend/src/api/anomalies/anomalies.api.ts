import type { AxiosInstance } from 'axios';
import { http } from '@/shared/http';
import type { Measurement } from '../measurements/measurements.model';

export type ReviewAction = 'return' | 'accept' | 'reject';

export class AnomaliesApi {
  constructor(private readonly http: AxiosInstance) {}

  list = () => this.http.get<Measurement[]>('/anomalies').then((r) => r.data);
  review = (id: number, action: ReviewAction, comment: string) =>
    this.http.post<Measurement>(`/anomalies/${id}/${action}`, { comment }).then((r) => r.data);
}

export const anomaliesApi = new AnomaliesApi(http);
