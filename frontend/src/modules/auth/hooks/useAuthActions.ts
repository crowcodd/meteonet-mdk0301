'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, type LoginRequest } from '@/api';
import { authStore } from '@/shared/auth-store';
import { homeFor } from '../lib/home';

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      authStore.set(await api.auth.login(body));
      return api.auth.me();
    },
    onSuccess: (me) => {
      qc.setQueryData(['me'], me);
      router.replace(homeFor(me.role));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.logout().catch(() => undefined),
    onSettled: () => {
      authStore.clear();
      qc.clear();
      router.replace('/login');
    },
  });
}
