'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ReportFailure } from '@/api';

export function useInstruments() {
  return useQuery({ queryKey: ['instruments'], queryFn: api.instruments.list });
}

export function useFailures() {
  return useQuery({ queryKey: ['failures'], queryFn: api.instruments.listFailures });
}

export function useReportFailure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReportFailure }) => api.instruments.reportFailure(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instruments'] });
      qc.invalidateQueries({ queryKey: ['failures'] });
    },
  });
}
