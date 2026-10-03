'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { useAccessToken } from '@/shared/auth-store';

export const meKey = ['me'] as const;

export function useMe() {
  const token = useAccessToken();
  const query = useQuery({ queryKey: meKey, queryFn: api.auth.me, enabled: !!token, staleTime: Infinity });
  return { ...query, token };
}
