import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { MappingRule } from '@/api/types'

export function useMappingRules(projectId: number) {
  return useQuery({
    queryKey: ['mapping', projectId],
    queryFn: async () => {
      const { data } = await api.get<MappingRule[]>(`/projects/${projectId}/mapping`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateMappingRule(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<MappingRule, 'id'>) => {
      const { data } = await api.post(`/projects/${projectId}/mapping`, payload)
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['mapping', projectId] })
      await qc.refetchQueries({ queryKey: ['mapping', projectId], type: 'active' })
    },
  })
}

export function useUpdateMappingRule(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ruleId, payload }: { ruleId: number; payload: Omit<MappingRule, 'id'> }) => {
      const { data } = await api.put(`/projects/${projectId}/mapping/${ruleId}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapping', projectId] }),
  })
}

export function useDeleteMappingRule(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId: number) => {
      await api.delete(`/projects/${projectId}/mapping/${ruleId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapping', projectId] }),
  })
}

export interface MappingSuggestion {
  sourceTable: string
  sourceField: string
  targetTable: string
  targetField: string
  dataType: string
  required: boolean
  reasoning: string
  transformation: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW_REQUIRED'
}

export interface AutoMapResponse {
  projectId: number
  suggestedCount: number
  createdCount: number
  suggestions: MappingSuggestion[]
  skipped?: { key: string; reason: string }[]
}

export function useAutoMap(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AutoMapResponse>(`/projects/${projectId}/mapping/auto-map`)
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['mapping', projectId] })
      await qc.refetchQueries({ queryKey: ['mapping', projectId], type: 'active' })
    },
  })
}
