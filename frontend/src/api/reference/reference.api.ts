import type { AxiosInstance } from 'axios';
import { http } from '@/shared/http';
import type { Parameter, Station } from './reference.model';

export class ReferenceApi {
  constructor(private readonly http: AxiosInstance) {}

  parameters = () => this.http.get<Parameter[]>('/parameters').then((r) => r.data);
  stations = () => this.http.get<Station[]>('/stations').then((r) => r.data);
}

export const referenceApi = new ReferenceApi(http);
