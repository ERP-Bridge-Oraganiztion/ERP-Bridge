import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Settings, GitBranch } from 'lucide-react'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-graphite-200 bg-paper md:flex">
      <div className="flex items-center gap-2 border-b border-graphite-200 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center border border-ink bg-ink text-paper">
          <GitBranch size={16} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-ink">ERP Bridge</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">
            SAP Migration
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-ink text-paper' : 'text-graphite-700 hover:bg-graphite-100'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-graphite-200 px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-400">
          v1.0.0 — Enterprise
        </p>
      </div>
    </aside>
  )
}
