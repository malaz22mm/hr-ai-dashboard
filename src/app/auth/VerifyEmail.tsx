import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/resources/authApi'
import { useAuthStore } from '@/auth/authStore'
import { getApiErrorMessage } from '@/lib/apiErrors'

const VERIFICATION_USER_KEY = 'hr_verification_user_id'

export function getStoredVerificationUserId(): string | null {
  return sessionStorage.getItem(VERIFICATION_USER_KEY)
}

export function setStoredVerificationUserId(userId: string) {
  sessionStorage.setItem(VERIFICATION_USER_KEY, userId)
}

export function clearStoredVerificationUserId() {
  sessionStorage.removeItem(VERIFICATION_USER_KEY)
}

export default function VerifyEmail() {
  const navigate = useNavigate()
  const setSessionFromTokens = useAuthStore((s) => s.setSessionFromTokens)
  const [userId, setUserId] = useState(() => getStoredVerificationUserId() ?? '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const tokens = await authApi.verify({ userId, code: Number(code) })
      setSessionFromTokens(tokens.access_token, tokens.refresh_token)
      clearStoredVerificationUserId()
      message.success('Email verified. Welcome!')
      navigate('/')
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Verification failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!userId) {
      message.warning('Enter your user ID first')
      return
    }
    setResending(true)
    try {
      await authApi.resendVerification({ userId })
      message.success('Verification code sent')
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not resend code'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white bg-white p-6 shadow-xl shadow-slate-900/5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">HR Pulse</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Verify your email</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the code sent to your inbox.</p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          User ID
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Verification code
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button
          type="button"
          disabled={resending}
          onClick={handleResend}
          className="mt-3 w-full text-sm text-slate-600 underline"
        >
          Resend code
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </div>
  )
}
