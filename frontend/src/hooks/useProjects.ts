import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PageResponse, Project } from '@/api/types'

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', status ?? 'ALL'],
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Project>>('/projects', {
        params: { size: 50, ...(status ? { status } : {}) },
      })
      return data.content
    },
  })
}

export function useProject(id?: number) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; sourceErp: string; targetErp?: string }) => {
      const { data } = await api.post<Project>('/projects', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/projects/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
