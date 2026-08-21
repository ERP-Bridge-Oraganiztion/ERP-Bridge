import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GitBranch, ArrowRight } from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { Input, FieldLabel } from '@/components/Field'
import { Button } from '@/components/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@erpbridge.com')
  const [organizationName, setOrganizationName] = useState('ERP Bridge')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate(
      { organizationName, email, password },
      {
        onSuccess: () => {
          const redirectTo = (location.state as { from?: Location })?.from?.pathname || '/'
          navigate(redirectTo, { replace: true })
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center border border-ink bg-ink text-paper">
            <GitBranch size={20} />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">ERP Bridge</h1>
          <p className="mt-1 text-sm text-graphite-500">Universal ERP to SAP Migration Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-4">
            <FieldLabel>Organization name</FieldLabel>
            <Input required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your company name" autoComplete="organization" />
          </div>
          <div className="mb-4">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div className="mb-5">
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {login.isError && (
            <p className="mb-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
              Invalid email or password. Please try again.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
            {!login.isPending && <ArrowRight size={15} />}
          </Button>
        </form>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest2 text-graphite-400">
          Seeded login — admin@erpbridge.com / Password123
        </p>
      </div>
    </div>
  )
}
