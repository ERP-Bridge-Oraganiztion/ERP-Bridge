import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { api } from '@/api/client'
import { Input, FieldLabel } from '@/components/Field'
import { Button } from '@/components/Button'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await api.post('/auth/forgot-password', { identifier })
    } finally {
      setPending(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center"><div className="mb-4 flex h-11 w-11 items-center justify-center border border-ink bg-ink text-paper"><GitBranch size={20} /></div><h1 className="font-display text-xl font-semibold text-ink">Reset your password</h1><p className="mt-1 text-sm text-graphite-500">Enter your email or username to continue.</p></div>
        <form onSubmit={handleSubmit} className="card p-6">
          {submitted ? <p className="border border-ink bg-graphite-50 px-3 py-3 text-sm text-ink">If an account matches, reset instructions will be sent to its email.</p> : <><div className="mb-5"><FieldLabel>Email or username</FieldLabel><Input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@company.com or username" autoComplete="username" /></div><Button type="submit" className="w-full" disabled={pending}>{pending ? 'Sending...' : 'Send reset instructions'}</Button></>}
          <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-ink underline underline-offset-4"><ArrowLeft size={14} /> Back to sign in</Link>
        </form>
      </div>
    </div>
  )
}
