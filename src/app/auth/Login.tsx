import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('hr.admin@example.com')
  const [password, setPassword] = useState('password')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    login({
      user: { name: 'HR Admin', role: 'People Operations' },
      token: 'secure-token',
    })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white bg-white p-6 shadow-xl shadow-slate-900/5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">HR Pulse</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to access the HR AI workspace.</p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Work email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Continue
        </button>
      </form>
    </div>
  )
}

