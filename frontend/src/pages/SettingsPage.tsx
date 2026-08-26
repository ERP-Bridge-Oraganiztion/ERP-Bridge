import { useState, type FormEvent } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { useMe } from '@/hooks/useAuth'
import { api } from '@/api/client'
import { Button } from '@/components/Button'
import { Trash2, KeyRound } from 'lucide-react'
import { Input, Select, FieldLabel } from '@/components/Field'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/format'

export default function SettingsPage() {
  const { data: user, isLoading } = useMe()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('VIEWER')
  const members = useQuery({ queryKey: ['organization-members'], queryFn: async () => (await api.get('/admin/users')).data, enabled: user?.role === 'ADMIN' })
  const createMember = useMutation({
    mutationFn: async (payload: { name: string; username: string; email: string; password: string; role: string }) => (await api.post('/admin/users', payload)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization-members'] }); setName(''); setUsername(''); setEmail(''); setPassword('') },
  })
  const deleteMember = useMutation({
    mutationFn: async (userId: number) => api.delete('/admin/users', { params: { userId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization-members'] }),
  })
  const resetPassword = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => api.patch('/admin/users', { userId, password }),
  })
  function handleCreateMember(event: FormEvent) { event.preventDefault(); createMember.mutate({ name, username, email, password, role }) }
  function handleResetPassword(member: any) {
    const nextPassword = window.prompt(`New password for ${member.name}`)
    if (nextPassword) resetPassword.mutate({ userId: member.id, password: nextPassword })
  }

  return (
    <Layout title="Settings" subtitle="Account and session details">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          {isLoading || !user ? (
            <p className="text-sm text-graphite-500">Loading profile…</p>
          ) : (
            <dl className="space-y-4">
              {[
                ['Name', user.name],
                ['Organization', user.organizationName || 'Not assigned'],
                ['Email', user.email],
                ['Role', user.role.replace('_', ' ')],
                ['Status', user.status],
                ['Member since', formatDate(user.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-graphite-100 pb-3 last:border-0 last:pb-0">
                  <dt className="eyebrow">{label}</dt>
                  <dd className="text-sm font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardBody>
      </Card>
      {user?.role === 'ADMIN' && (
        <Card className="mt-4 max-w-2xl">
          <CardHeader><CardTitle>Organization members</CardTitle></CardHeader>
          <CardBody>
            <p className="mb-4 text-sm text-graphite-600">Create login accounts for your office team. Members sign in with this organization name.</p>
            <form onSubmit={handleCreateMember} className="grid gap-3 sm:grid-cols-2">
              <div><FieldLabel>Member name</FieldLabel><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Team member name" /></div>
              <div><FieldLabel>Username</FieldLabel><Input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Team username" /></div>
              <div><FieldLabel>Email</FieldLabel><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@company.com" /></div>
              <div><FieldLabel>Temporary password</FieldLabel><Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Strong password" /></div>
              <div><FieldLabel>Role</FieldLabel><Select value={role} onChange={(e) => setRole(e.target.value)}><option value="VIEWER">Viewer</option><option value="CONSULTANT">Consultant</option><option value="PROJECT_MANAGER">Project Manager</option></Select></div>
              {createMember.isError && <p className="sm:col-span-2 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">{(createMember.error as any)?.response?.data?.message || 'Could not create member.'}</p>}
              <div className="sm:col-span-2"><Button type="submit" disabled={createMember.isPending}>{createMember.isPending ? 'Creating…' : 'Create member account'}</Button></div>
            </form>
            <div className="mt-5 border-t border-graphite-200 pt-4">
              <p className="eyebrow mb-2">Current members</p>
              {members.data?.map((member: any) => (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">#{member.id} {member.name}</p>
                    <p className="text-xs text-graphite-500">{member.email} · {member.role} · {member.status}</p>
                  </div>
                  {member.id !== user?.id && member.role !== 'ADMIN' && (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleResetPassword(member)}><KeyRound size={13} /> Reset password</Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => { if (window.confirm(`Delete ${member.name}'s account?`)) deleteMember.mutate(member.id) }}><Trash2 size={13} /> Delete</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </Layout>
  )
}
