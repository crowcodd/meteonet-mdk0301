import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { authStore } from './auth-store';

/** общий http-клиент: сам подставляет токен, а на 401 один раз обновляет его и повторяет запрос */
export const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((config) => {
  const token = authStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshTokens(): Promise<string> {
  const refreshToken = authStore.refresh;
  if (!refreshToken) throw new Error('no refresh token');
  const { data } = await axios.post('/api/auth/refresh', { refreshToken });
  authStore.set(data);
  return data.accessToken;
}

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  const isAuthCall = original?.url?.startsWith('/auth/');
  if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
    throw error;
  }
  original._retried = true;
  try {
    refreshing ??= refreshTokens().finally(() => (refreshing = null));
    const token = await refreshing;
    original.headers.Authorization = `Bearer ${token}`;
    return http(original);
  } catch {
    authStore.clear();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.assign('/login');
    throw error;
  }
});

/** запрос вообще не дошёл до сервера, то есть нет сети или сервер лежит */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Нет связи с сервером';
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message.join('; ');
    if (message) return message;
    return `Ошибка ${error.response.status}`;
  }
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}
