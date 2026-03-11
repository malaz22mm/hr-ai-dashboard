import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useAuthStore } from '@/hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [usePhone, setUsePhone] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        password,
        ...(usePhone ? { phone } : { email }),
      }

      await login(payload)
      message.success('Login successful')
      navigate('/')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please check your credentials.'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
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

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setUsePhone(false)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              !usePhone
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setUsePhone(true)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              usePhone
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Phone
          </button>
        </div>

        {!usePhone ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:opacity-50"
              placeholder="user@example.com"
            />
          </label>
        ) : (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:opacity-50"
              placeholder="+963 911111111"
            />
          </label>
        )}

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:opacity-50"
            placeholder="Enter your password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
