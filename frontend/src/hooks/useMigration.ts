import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ExportResponse, MigrationStatus } from '@/api/types'

export function useStartMigration(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/migration/start`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['migration-status', projectId] }),
  })
}

export function useMigrationStatus(projectId: number, jobId?: number, poll = false) {
  return useQuery({
    queryKey: ['migration-status', projectId, jobId],
    queryFn: async () => {
      const { data } = await api.get<MigrationStatus>(`/projects/${projectId}/migration/status`, {
        params: jobId ? { jobId } : {},
      })
      return data
    },
    enabled: !!projectId,
    retry: false,
    refetchInterval: poll ? 2000 : false,
  })
}

export function useStopMigration(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (jobId?: number) => {
      const { data } = await api.post(`/projects/${projectId}/migration/stop`, null, {
        params: jobId ? { jobId } : {},
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['migration-status', projectId] }),
  })
}

export function useExport(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { jobId: number; format: string }) => {
      const { data } = await api.post<ExportResponse>(`/projects/${projectId}/export`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export interface SapPushResponse {
  jobId: number
  status: string
  recordsSent: number
  recordsFailed: number
  message: string
}

export function usePushToSap(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { jobId: number; endpointUrl: string; username?: string; password?: string }) => {
      const { data } = await api.post<SapPushResponse>(`/projects/${projectId}/export/sap-push`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}
