import { httpClient } from '@/api/httpClient'
import type {
  ResetPasswordDto,
  SignInDto,
  SignInResult,
  TokensDto,
  UserIdDto,
  VerifyAccountDto,
} from '@/types/dto'
import { isTokensDto, isVerificationRequiredDto } from '@/types/dto'

export const authApi = {
  signIn(payload: SignInDto): Promise<SignInResult> {
    return httpClient.request<SignInResult>('/auth/local/signin', {
      method: 'POST',
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    })
  },

  verify(payload: VerifyAccountDto): Promise<TokensDto> {
    return httpClient.request<TokensDto>('/auth/verify', {
      method: 'POST',
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    })
  },

  resendVerification(payload: UserIdDto): Promise<void> {
    return httpClient.request<void>('/auth/resend-verification-code', {
      method: 'POST',
      body: payload,
      skipAuth: true,
      skipRefresh: true,
      parse: 'void',
    })
  },

  requestResetPassword(payload: UserIdDto): Promise<void> {
    return httpClient.request<void>('/auth/request-reset-password', {
      method: 'POST',
      body: payload,
      skipAuth: true,
      skipRefresh: true,
      parse: 'void',
    })
  },

  resetPassword(payload: ResetPasswordDto): Promise<void> {
    return httpClient.request<void>('/auth/reset-password', {
      method: 'POST',
      body: payload,
      skipAuth: true,
      skipRefresh: true,
      parse: 'void',
    })
  },

  logout(): Promise<void> {
    return httpClient.request<void>('/auth/logout', {
      method: 'POST',
      parse: 'void',
    })
  },
}

export function narrowSignInResult(raw: unknown): SignInResult {
  if (isVerificationRequiredDto(raw)) return raw
  if (isTokensDto(raw)) return raw
  throw new Error('Unexpected sign-in response shape')
}
