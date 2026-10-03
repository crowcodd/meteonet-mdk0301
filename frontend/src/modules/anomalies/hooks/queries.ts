'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ReviewAction } from '@/api';

export function useAnomalies() {
  return useQuery({ queryKey: ['anomalies'], queryFn: api.anomalies.list });
}

export function useReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, comment }: { id: number; action: ReviewAction; comment: string }) =>
      api.anomalies.review(id, action, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anomalies'] }),
  });
}
