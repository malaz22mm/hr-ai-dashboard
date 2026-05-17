/**
 * Example React 18 auth provider wiring `createSafeApiClient`.
 * Adjust routing library imports to match your app.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  ApiError,
  type TokenPair,
  type SafeApiClient,
  createSafeApiClient,
} from './SAFE_API_CLIENT';

const ACCESS_KEY = 'hr_access_token';
const REFRESH_KEY = 'hr_refresh_token';

const tokenStorage = {
  getAccess: () => sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => sessionStorage.getItem(REFRESH_KEY),
  setTokens: (t: TokenPair) => {
    sessionStorage.setItem(ACCESS_KEY, t.access_token);
    sessionStorage.setItem(REFRESH_KEY, t.refresh_token);
  },
  clear: () => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: 'ADMIN' | 'SUPER_ADMIN' | string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  client: SafeApiClient;
  tokens: TokenPair | null;
  claims: JwtPayload | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  signInWithPassword: (email: string, password: string) => Promise<TokenPair | VerificationRequired>;
  verifyOtp: (userId: string, code: number) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};

type VerificationRequired = {
  verificationId: string;
  message: string;
};

function isTokenPair(x: unknown): x is TokenPair {
  if (x === null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.access_token === 'string' && typeof o.refresh_token === 'string';
}

function isVerificationRequired(x: unknown): x is VerificationRequired {
  if (x === null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.verificationId === 'string' && typeof o.message === 'string';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function getBaseUrl() {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base) return 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<TokenPair | null>(() => {
    const access = tokenStorage.getAccess();
    const refresh = tokenStorage.getRefresh();
    if (access && refresh) return { access_token: access, refresh_token: refresh };
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const claims = useMemo(
    () => (tokens ? decodeJwtPayload(tokens.access_token) : null),
    [tokens],
  );

  const logoutLocal = useCallback(() => {
    tokenStorage.clear();
    setTokens(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (tokens?.access_token) {
        await createSafeApiClient({
          baseUrl: getBaseUrl(),
          storage: {
            ...tokenStorage,
            getAccess: () => tokens.access_token,
            getRefresh: () => tokens.refresh_token,
            setTokens: tokenStorage.setTokens,
            clear: tokenStorage.clear,
          },
          logout: logoutLocal,
        }).logoutPost();
      }
    } catch {
      // Still clear locally — session may already be invalid server-side
    } finally {
      logoutLocal();
    }
  }, [tokens, logoutLocal]);

  const client = useMemo(
    () =>
      createSafeApiClient({
        baseUrl: getBaseUrl(),
        storage: {
          ...tokenStorage,
          getAccess: () => tokens?.access_token ?? tokenStorage.getAccess(),
          getRefresh: () => tokens?.refresh_token ?? tokenStorage.getRefresh(),
          setTokens: (t) => {
            tokenStorage.setTokens(t);
            setTokens(t);
          },
          clear: () => {
            tokenStorage.clear();
            setTokens(null);
          },
        },
        logout: () => {
          logoutLocal();
        },
      }),
    [tokens, logoutLocal],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const raw = await createSafeApiClient({
        baseUrl: getBaseUrl(),
        storage: tokenStorage,
        logout: logoutLocal,
      }).signIn({ email, password });

      if (isVerificationRequired(raw)) return raw;
      if (!isTokenPair(raw)) {
        throw new ApiError(200, raw, ['Unexpected sign-in response shape']);
      }
      tokenStorage.setTokens(raw);
      setTokens(raw);
      return raw;
    },
    [logoutLocal],
  );

  const verifyOtp = useCallback(
    async (userId: string, code: number) => {
      setError(null);
      const pair = await createSafeApiClient({
        baseUrl: getBaseUrl(),
        storage: tokenStorage,
        logout: logoutLocal,
      }).verifyAccount({ userId, code });
      tokenStorage.setTokens(pair);
      setTokens(pair);
    },
    [logoutLocal],
  );

  const value: AuthContextValue = {
    client,
    tokens,
    claims,
    isAuthenticated: Boolean(tokens?.access_token),
    isSuperAdmin: claims?.role === 'SUPER_ADMIN',
    signInWithPassword,
    verifyOtp,
    logout,
    error,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Route guard example — use with react-router `<Outlet/>` or v6 data routers */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // return <Navigate to="/login" replace />;
    return null;
  }
  return <>{children}</>;
}
