/**
 * Reference API client for Talabaty HR–style Nest backends.
 * - Handles 204/no-body responses safely
 * - Injects access tokens; refreshes once on 401 with a single-flight mutex
 * - Normalizes Nest validation errors
 *
 * Copy into your Vite app (e.g. src/api/safeApiClient.ts) and wire storage + logout.
 */

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly messages: string[];

  constructor(status: number, body: unknown, messages: string[]) {
    super(messages[0] ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.messages = messages;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export function normalizeNestErrorBody(body: unknown): string[] {
  const o = asRecord(body);
  if (!o) return ['Request failed'];
  const msg = o.message;
  if (typeof msg === 'string') return [msg];
  if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) return msg as string[];
  const error = o.error;
  if (typeof error === 'string') return [error];
  return ['Request failed'];
}

async function readJsonSafely(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

export type TokenStorage = {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  setTokens: (t: TokenPair) => void;
  clear: () => void;
};

export type SafeApiClientOptions = {
  baseUrl: string;
  storage: TokenStorage;
  logout: () => void | Promise<void>;
  fetchImpl?: typeof fetch;
};

const defaultFetch: typeof fetch = (...args: Parameters<typeof fetch>) => globalThis.fetch(...args);

export function createSafeApiClient(opts: SafeApiClientOptions) {
  const fetchFn = opts.fetchImpl ?? defaultFetch;
  const { baseUrl, storage, logout } = opts;

  let refreshPromise: Promise<TokenPair> | null = null;

  async function refreshTokensLocked(): Promise<TokenPair> {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const rt = storage.getRefresh();
        if (!rt) throw new ApiError(401, null, ['Missing refresh token']);

        const url = `${baseUrl.replace(/\/$/, '')}/auth/refresh`;
        const res = await fetchFn(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${rt}` },
        });

        if (res.status === 204) {
          throw new ApiError(res.status, null, ['Unexpected empty refresh response']);
        }

        const body = await readJsonSafely(res);
        if (!res.ok) {
          const messages = normalizeNestErrorBody(body);
          throw new ApiError(res.status, body, messages);
        }

        const obj = asRecord(body);
        const access = obj && typeof obj.access_token === 'string' ? obj.access_token : null;
        const refresh = obj && typeof obj.refresh_token === 'string' ? obj.refresh_token : null;
        if (!access || !refresh) {
          throw new ApiError(res.status, body, ['Refresh response missing tokens']);
        }
        const pair: TokenPair = { access_token: access, refresh_token: refresh };
        storage.setTokens(pair);
        return pair;
      })().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  async function request<T>(
    path: string,
    init: RequestInit & { skipAuth?: boolean; parse?: 'json' | 'void' } = {},
  ): Promise<T> {
    const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = new Headers(init.headers);

    const skipAuth = init.skipAuth === true;
    if (!skipAuth) {
      const at = storage.getAccess();
      if (at) headers.set('Authorization', `Bearer ${at}`);
    }

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const doFetch = async () =>
      fetchFn(url, {
        ...init,
        headers,
        credentials: init.credentials ?? 'include',
      });

    let res = await doFetch();

    // One retry after refresh when access expired
    if (res.status === 401 && !skipAuth) {
      try {
        await refreshTokensLocked();
        const at2 = storage.getAccess();
        if (at2) headers.set('Authorization', `Bearer ${at2}`);
        res = await doFetch();
      } catch {
        await Promise.resolve(logout());
        throw new ApiError(401, null, ['Session expired']);
      }
    }

    const parse = init.parse ?? (res.status === 204 ? 'void' : 'json');

    if (parse === 'void' || res.status === 204) {
      if (!res.ok) {
        const body = await readJsonSafely(res);
        throw new ApiError(res.status, body, normalizeNestErrorBody(body));
      }
      return undefined as T;
    }

    const body = await readJsonSafely(res);
    if (!res.ok) {
      throw new ApiError(res.status, body, normalizeNestErrorBody(body));
    }
    return body as T;
  }

  return {
    request,
    refreshTokensLocked,
    /** POST /auth/local/signin — returns tokens OR verification payload (caller must narrow). */
    signIn(payload: { email?: string; phone?: string; password: string }) {
      return request<unknown>('/auth/local/signin', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      });
    },
    /** POST /auth/verify */
    verifyAccount(payload: { userId: string; code: number }) {
      return request<TokenPair>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      });
    },
    /** All 204 auth helpers */
    logoutPost() {
      return request<void>('/auth/logout', { method: 'POST', parse: 'void' });
    },
    resendVerification(payload: { userId: string }) {
      return request<void>('/auth/resend-verification-code', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
        parse: 'void',
      });
    },
    requestResetPassword(payload: { userId: string }) {
      return request<void>('/auth/request-reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
        parse: 'void',
      });
    },
    resetPassword(payload: { userId: string; code: number; email: string; newPassword: string }) {
      return request<void>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
        parse: 'void',
      });
    },
  };
}

export type SafeApiClient = ReturnType<typeof createSafeApiClient>;
