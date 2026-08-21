import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { initials } from '@/lib/format'

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between border-b border-graphite-200 bg-paper px-6 py-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-graphite-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-ink font-mono text-[11px] font-medium text-ink">
              {initials(user.name)}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none text-ink">{user.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex items-center gap-1.5 border border-graphite-300 px-3 py-1.5 text-xs font-medium text-graphite-700 hover:border-ink hover:text-ink"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  )
}
