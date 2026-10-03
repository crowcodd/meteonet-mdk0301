'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CreateMeasurement, type Recheck } from '@/api';
import { isNetworkError } from '@/shared/http';
import { enqueue, useConnection } from '@/modules/outbox';

export const measurementKeys = {
  station: ['measurements', 'station'] as const,
  returned: ['measurements', 'returned'] as const,
};

export function useParameters() {
  return useQuery({ queryKey: ['parameters'], queryFn: api.reference.parameters, staleTime: Infinity });
}

export function useStationMeasurements() {
  return useQuery({ queryKey: measurementKeys.station, queryFn: api.measurements.listStation });
}

export function useReturnedMeasurements() {
  return useQuery({ queryKey: measurementKeys.returned, queryFn: api.measurements.listReturned });
}

type SubmitResult = { queued: true } | { queued: false; status: string };

/** если связи нет или запрос не дошёл, замер кладём в очередь, чтобы он не потерялся */
export function useSubmitMeasurement() {
  const qc = useQueryClient();
  const { online } = useConnection();
  return useMutation({
    mutationFn: async ({ payload, label }: { payload: CreateMeasurement; label: string }): Promise<SubmitResult> => {
      if (!online) {
        enqueue(payload, label);
        return { queued: true };
      }
      try {
        const m = await api.measurements.submit(payload);
        return { queued: false, status: m.status };
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        enqueue(payload, label);
        return { queued: true };
      }
    },
    onSuccess: (r) => {
      if (!r.queued) qc.invalidateQueries({ queryKey: measurementKeys.station });
    },
  });
}

export function useRecheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Recheck }) => api.measurements.recheck(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements'] }),
  });
}
