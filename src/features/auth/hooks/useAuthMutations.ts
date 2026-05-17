import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/resources/authApi'
import { useAuthStore } from '@/auth/authStore'
import type { ResetPasswordDto, SignInDto, UserIdDto, VerifyAccountDto } from '@/types/dto'
import { queryKeys } from '@/query/keys'

export function useSignInMutation() {
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (payload: SignInDto) => login(payload),
  })
}

export function useVerifyAccountMutation() {
  const qc = useQueryClient()
  const setSession = useAuthStore((s) => s.setSessionFromTokens)
  return useMutation({
    mutationFn: (payload: VerifyAccountDto) => authApi.verify(payload),
    onSuccess: (tokens) => {
      setSession(tokens.access_token, tokens.refresh_token)
      void qc.invalidateQueries({ queryKey: queryKeys.auth.root })
    },
  })
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (payload: UserIdDto) => authApi.resendVerification(payload),
  })
}

export function useRequestResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: UserIdDto) => authApi.requestResetPassword(payload),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordDto) => authApi.resetPassword(payload),
  })
}

export function useLogoutMutation() {
  const qc = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      qc.clear()
    },
  })
}
