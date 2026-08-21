import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ConnectorInfo, ConnectorStatus, MetadataResponse, SourceSystem } from '@/api/types'

export function useConnectorList() {
  return useQuery({
    queryKey: ['connectors'],
    queryFn: async () => {
      const { data } = await api.get<{ connectors: ConnectorInfo[] }>('/connectors')
      return data.connectors
    },
  })
}

export function useSourceSystems() {
  return useQuery({
    queryKey: ['source-systems'],
    queryFn: async () => {
      const { data } = await api.get<{ sourceSystems: SourceSystem[] }>('/source-systems')
      return data.sourceSystems
    },
    staleTime: Infinity, // this list is static
  })
}

export function useConnectorStatus(projectId: number) {
  return useQuery({
    queryKey: ['connector-status', projectId],
    queryFn: async () => {
      const { data } = await api.get<ConnectorStatus>(`/projects/${projectId}/connector`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useTestConnector() {
  return useMutation({
    mutationFn: async (payload: {
      connectorType: string
      host?: string
      port?: number
      databaseName?: string
      username?: string
      password?: string
    }) => {
      const { data } = await api.post('/connectors/test', payload)
      return data as { status: string; latencyMs: number; message: string }
    },
  })
}

export function useSaveConnectorConfig(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      connectorType: string
      host?: string
      port?: number
      databaseName?: string
      username?: string
      password?: string
    }) => {
      const { data } = await api.post(`/projects/${projectId}/connector`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connector-status', projectId] }),
  })
}

export function useUploadSourceFile(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, tableName }: { file: File; tableName: string }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('tableName', tableName)
      const { data } = await api.post<MetadataResponse>(`/projects/${projectId}/upload`, form)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metadata', projectId] })
      qc.invalidateQueries({ queryKey: ['connector-status', projectId] })
    },
  })
}

export function useMetadata(projectId: number) {
  return useQuery({
    queryKey: ['metadata', projectId],
    queryFn: async () => {
      const { data } = await api.get<MetadataResponse>(`/projects/${projectId}/metadata`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useIngestFromDatabase(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tableName: string) => {
      const { data } = await api.post<MetadataResponse>(`/projects/${projectId}/connector/ingest`, { tableName })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metadata', projectId] })
      qc.invalidateQueries({ queryKey: ['connector-status', projectId] })
    },
  })
}
