import type { AxiosInstance } from 'axios';
import { http } from '@/shared/http';
import type { LoginRequest, Me, Tokens } from './auth.model';

export class AuthApi {
  constructor(private readonly http: AxiosInstance) {}

  login = (body: LoginRequest) => this.http.post<Tokens>('/auth/login', body).then((r) => r.data);
  logout = () => this.http.post('/auth/logout').then(() => undefined);
  me = () => this.http.get<Me>('/auth/me').then((r) => r.data);
}

export const authApi = new AuthApi(http);
