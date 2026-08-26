import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, GitBranch, Eye, EyeOff } from 'lucide-react'
import { api } from '@/api/client'
import { Input, FieldLabel } from '@/components/Field'
import { Button } from '@/components/Button'

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await api.post('/auth/register', { name, organizationName, username, email, password })
      navigate('/login', { state: { registered: true } })
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Could not create your organization.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center border border-ink bg-ink text-paper"><GitBranch size={20} /></div>
          <h1 className="font-display text-xl font-semibold text-ink">Create your workspace</h1>
          <p className="mt-1 text-sm text-graphite-500">You will become the organization administrator.</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-4"><FieldLabel>Your name</FieldLabel><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" /></div>
          <div className="mb-4"><FieldLabel>Organization name</FieldLabel><Input required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Your company name" autoComplete="organization" /></div>
          <div className="mb-4"><FieldLabel>Username</FieldLabel><Input required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" autoComplete="username" /></div>
          <div className="mb-4"><FieldLabel>Email</FieldLabel><Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" /></div>
          <div className="mb-5"><FieldLabel>Password</FieldLabel><div className="relative"><Input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Strong password" autoComplete="new-password" className="pr-10" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-3 text-graphite-500">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
          {error && <p className="mb-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Creating workspace...' : 'Create organization'}{!pending && <ArrowRight size={15} />}</Button>
          <p className="mt-5 text-center text-sm text-graphite-600">Already have an account? <Link to="/login" className="font-semibold text-ink underline underline-offset-4">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}
