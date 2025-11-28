import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  LayoutDashboard,
  LogIn,
  Settings2,
  Users2,
  FileBarChart2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Employees', to: '/employees', icon: Users2 },
  { label: 'Reports', to: '/reports', icon: FileBarChart2 },
  { label: 'Settings', to: '/settings', icon: Settings2 },
]

const supportLinks = [
  { label: 'Alerts Center', to: '/reports', icon: AlertTriangle },
  { label: 'Login', to: '/login', icon: LogIn },
]

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <Fragment>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800/60 bg-slate-950 text-white transition-transform',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">HR</p>
            <p className="text-lg font-semibold tracking-tight text-white">Pulse AI</p>
          </div>
          <button
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Overview</p>
          <ul className="mt-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )
                  }
                  onClick={onClose}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Support</p>
          <ul className="mt-2 space-y-1">
            {supportLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )
                  }
                  onClick={onClose}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-900/60 px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-slate-500">System Status</p>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <p className="font-semibold text-white">All systems operational</p>
            <p className="text-xs text-slate-400">SLA 99.9% this month</p>
          </div>
        </div>
      </aside>
    </Fragment>
  )
}


