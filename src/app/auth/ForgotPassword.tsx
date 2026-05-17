import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { requestResetPassword, resetPassword } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/apiErrors'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      await requestResetPassword({ userId })
      message.success('Reset code sent to your email')
      setStep('reset')
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not request reset'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      await resetPassword({
        userId,
        email,
        code: Number(code),
        newPassword,
      })
      message.success('Password updated. Sign in with your new password.')
      navigate('/login')
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not reset password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={step === 'request' ? handleRequest : handleReset}
        className="w-full max-w-sm rounded-2xl border border-white bg-white p-6 shadow-xl shadow-slate-900/5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">HR Pulse</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {step === 'request' ? 'Reset password' : 'Set new password'}
        </h1>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          User ID
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            disabled={step === 'reset'}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </label>

        {step === 'reset' && (
          <>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Code from email
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Please wait...' : step === 'request' ? 'Send code' : 'Update password'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </div>
  )
}
