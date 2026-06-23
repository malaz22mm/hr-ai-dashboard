# State Management — HR Dashboard Frontend

How **Zustand** and **TanStack React Query** divide responsibilities, how **auth state** is restored, and where **module-level caches** fit.

---

## 1. Zustand store architecture (`authStore.ts`)

**Single store:** `useAuthStore` created via `create<AuthState>(...)`.

### State fields

| Field | Meaning |
|-------|---------|
| `accessToken`, `refreshToken` | Mirrors persisted tokens (also in storage) |
| `userId`, `email`, `role` | From **decoded access JWT** (UX + guards) |
| `isAuthenticated` | True when both tokens hydrated |
| `isLoading` | True until `initializeAuth` finishes |

### Actions

- **`initializeAuth`** — read storage; if both tokens present, populate store + claims; else `isLoading: false`.
- **`setSessionFromTokens`** — write storage + decode + set authenticated.
- **`login`** — `authApi.signIn`; branch verify vs tokens; errors wrapped as `Error` with user-facing message.
- **`logout`** — `authApi.logout` best-effort; always `clearSession`.
- **`clearSession`** — wipe storage + null out fields.

### Side effect registration

On first store creation, **`setSessionExpiredHandler(() => get().clearSession())`** — connects **`emitSessionExpired`** from HTTP layers to **synchronous** session cleanup.

---

## 2. Auth state lifecycle (timeline)

1. **Cold load:** `isLoading: true` until `initializeAuth`.
2. **Hydrated session:** tokens present → `isAuthenticated: true`, claims set.
3. **Login success:** tokens → same as hydration path.
4. **Refresh success:** `tokenStorage` updated inside mutex; **Zustand still holds old access until next full login** — the **interceptors/httpClient read fresh token from storage** on each request. **Minor inconsistency:** in-memory `accessToken` in Zustand can lag after silent refresh; UI email/role still valid until access TTL swaps. *Improvement:* subscribe store to mutex completion or re-read claims after refresh.
5. **Logout / expiry:** `clearSession` → `isAuthenticated: false`.

---

## 3. Claims extraction (`jwt.ts` + `applyClaimsFromAccessToken`)

- **`decodeJwtPayload`:** base64url decode of second JWT segment; returns `sub`, `email`, `role`, `exp`, etc.
- **`role` typing:** only **`ADMIN`** and **`SUPER_ADMIN`** accepted; other values → `null` (UI treats as unknown).

**Security note:** This is **not** cryptographic verification. Attackers can spoof UI-only state; **API** must enforce `@Roles()` and guards.

---

## 4. Session restoration

Triggered by **`ProtectedRoute`** → **`useEffect` → `initializeAuth`**.

**Edge case:** Refresh token valid, access expired — first protected API call triggers **401 → refresh**; user sees brief loading only if no request fires. *Optional enhancement:* proactive refresh when `isJwtLikelyExpired(access)` before navigation (helper exists but is unused in `initializeAuth`).

---

## 5. Logout cleanup

- **Server:** `POST /auth/logout` invalidates refresh server-side (per backend architecture).
- **Client:** `clearSession` removes local tokens.
- **React Query:** **`useLogoutMutation`** (in features) calls **`qc.clear()`** — not used by Navbar; **cache may survive** store logout today. *Improvement:* call `queryClient.clear()` from store logout or Navbar after logout.

---

## 6. React Query setup (`queryClient.ts`)

```ts
defaultOptions: {
  queries: {
    staleTime: 60_000,
    gcTime: 600_000,
    retry: (failureCount, error) => { /* ApiError 4xx vs 5xx */ },
  },
  mutations: { retry: false },
}
```

- **`staleTime` 1 minute:** data “fresh” without refetch on remount within a minute.
- **`gcTime` 10 minutes:** cached inactive data kept in memory.
- **Retries:** Only when `isApiError` — axios-driven pages **bypass** this intelligence.

---

## 7. Query keys (`queryKeys.ts`)

Structured constants:

- `employees.list(query)` — includes full query object (stable spread in hooks).
- `employees.stats(groupBy)`
- `users.list(search)`
- `lookups.bundle`
- `auth.root`

**Why:** Predictable **invalidation** after mutations (e.g. `useVerifyAccountMutation` invalidates `auth` root).

---

## 8. Caching strategies by feature (intended use)

| Hook | staleTime | Notes |
|------|-----------|-------|
| `useEmployeesQuery` | default 60s | `keepPreviousData` for smooth pagination |
| `useEmployeeStatsQuery` | 5 minutes | stats change less often |
| `useLookupsBundleQuery` | 30 minutes | lookup tables stable |
| `useUsersListQuery` | default | list can change on admin actions |

**Reality:** Main screens often **bypass** these hooks, so **defaults don’t apply** there.

---

## 9. Invalidation patterns

- **`useVerifyAccountMutation`:** `invalidateQueries({ queryKey: auth })` on success.
- **Employee CRUD (axios):** `invalidateEmployeesDataset()` and `invalidateLookups()` — **manual** cache bust for module singletons, not React Query keys.

---

## 10. Optimistic updates

**None implemented** in this repository. Mutations wait for server acknowledgment.

---

## 11. Why React Query was chosen

- **Declarative cache** for list/stats endpoints.
- **Centralized retry** policy for transient 5xx / cold starts.
- **De-duplication** of in-flight requests (valuable for lookups bundle).
- Standard ecosystem fit with React 18/19.

**Trade-off:** Hooks exist alongside imperative code — team must **converge** for maintainability.

---

## 12. Zustand vs React Query — responsibility split

| Concern | Zustand | React Query |
|---------|---------|-------------|
| JWT strings | Yes (mirror + storage) | No |
| User/display claims | Yes | No |
| Server rows (employees, users) | Not ideally | Yes (when hooks used) |
| Loading/error **per query** | Manual in pages | Built-in |
| Logout clearing server cache | Should trigger | `clear()` / `removeQueries` |

**Rule of thumb:** **Auth identity** → Zustand; **remote collections** → React Query (target architecture). **Today:** many collections sit in **`useState`**.

---

## 13. Module-level state (outside Zustand/Query)

| Module | State | Purpose |
|--------|-------|---------|
| `lib/api.ts` | `cachedEmployeesDataset`, promises | Dashboard + stats fallback |
| `lib/employees/lookups.ts` | `cachedLookups`, `lookupsPromise` | Avoid N× lookup fetches per row map |
| `refreshMutex.ts` | `refreshInFlight` | Correctness |

**Risk:** Module cache **survives HMR** partially in dev; **cleared on full reload**. Manual `invalidate*` on writes mitigates staleness for employees.

---

## 14. Future improvements (honest)

1. **Single data layer** — all reads through React Query; drop duplicate `useState` fetches.
2. **Align Zustand tokens after refresh** — optional `patch` after mutex.
3. **Logout + `queryClient.clear()`** in one place.
