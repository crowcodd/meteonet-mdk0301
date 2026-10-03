'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type ReportPeriod } from '@/api';

export function useAnomalyDelayReport(period: ReportPeriod) {
  return useQuery({ queryKey: ['report', 'anomalies-delays', period], queryFn: () => api.reports.anomaliesDelays(period) });
}

export function useDownloadCsv() {
  return useMutation({
    mutationFn: async (period: ReportPeriod) => {
      const blob = await api.reports.anomaliesDelaysCsv(period);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anomalies-delays_${period.from.slice(0, 10)}_${period.to.slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
