import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ValidationReport, ValidationRunResponse } from '@/api/types'

export function useRunValidation(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ValidationRunResponse>(`/projects/${projectId}/validate`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['validation-report', projectId] }),
  })
}

export function useValidationReport(projectId: number, jobId?: number) {
  return useQuery({
    queryKey: ['validation-report', projectId, jobId],
    queryFn: async () => {
      const { data } = await api.get<ValidationReport>(`/projects/${projectId}/validation-report`, {
        params: jobId ? { jobId } : {},
      })
      return data
    },
    enabled: !!projectId,
    retry: false,
  })
}
