import { Menu, Search, Bell } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'

type NavbarProps = {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 lg:flex">
            <Search className="h-4 w-4" />
            <input
              type="search"
              placeholder="Search employees, alerts..."
              className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 px-3 py-1.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? 'Guest'}</p>
              <p className="text-xs text-slate-500">{user?.role ?? 'Visitor'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-center text-sm font-bold leading-10 text-white">
              {user?.name
                ?.split(' ')
                .map((chunk) => chunk[0])
                .slice(0, 2)
                .join('') ?? 'HR'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


