import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GitBranch, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import { Input, FieldLabel } from '@/components/Field'
import { Button } from '@/components/Button'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('admin@erpbridge.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate(
      { identifier, password, rememberMe },
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
            <FieldLabel>Email or username</FieldLabel>
            <Input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@company.com or username"
              autoComplete="username"
            />
          </div>
          <div className="mb-5">
            <FieldLabel>Password</FieldLabel>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" className="pr-10" />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-3 text-graphite-500 hover:text-ink">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-graphite-600"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me</label>
            <Link to="/forgot-password" className="font-medium text-ink underline underline-offset-4">Forgot password?</Link>
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
          <p className="mt-5 text-center text-sm text-graphite-600">New to ERP Bridge? <Link to="/signup" className="font-semibold text-ink underline underline-offset-4">Sign up</Link></p>
        </form>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest2 text-graphite-400">
          Demo login — admin@erpbridge.com / Password123
        </p>
      </div>
    </div>
  )
}
