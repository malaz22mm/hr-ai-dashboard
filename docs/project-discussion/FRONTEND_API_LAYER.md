# API Integration Layer — HR Dashboard Frontend

This document walks through **`httpClient`**, **`refreshMutex`**, resource modules, and **`lib/api.ts` (axios)** with a focus on **why each abstraction exists** and **how errors and edge cases** are handled. Endpoint names match **`back/COMPLETE_API_REFERENCE.md`** only.

---

## 1. Big picture: two clients, one refresh contract

| Module | Transport | Used by |
|--------|-----------|---------|
| `src/api/httpClient.ts` | `fetch` | `authApi`, `employeesApi`, `usersApi`, `lookupsApi` |
| `src/lib/api.ts` | `axios` (`apiClient`) | `Dashboard`, `EmployeesList`, `Reports`, `UsersList`, `lookups.ts`, auth helpers in some auth screens |

**Shared:** `refreshTokenPair` from `src/api/refreshMutex.ts`, `tokenStorage`, `getApiBaseUrl`.

**Why two stacks exist:** Historical layering — the employee mapper and dashboard bundle were built first on Axios interceptors; a thinner fetch layer was added for clearer control over JSON vs void responses and for resource modules that normalize errors as `ApiError`.

---

## 2. `env.ts` — base URL

```ts
import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'https://hr-back-iza2.vercel.app'
```

Trailing slashes stripped. Matches integration guide priority; hardcoded URL is a **deployment default** (document it in defense as “fallback for demos”).

---

## 3. `httpClient.ts` — fetch wrapper

### Responsibilities

1. **Build absolute URL** from path + `getApiBaseUrl()`.
2. **Inject access token** unless `skipAuth`.
3. **Serialize JSON bodies** when given plain objects; preserve `FormData` / `Blob` as `BodyInit`.
4. **Default `credentials: 'include'`** (aligns with integration guide cookie-ready posture; JWT still primary).
5. **On 401:** if allowed, call **`refreshTokenPair`**, update `Authorization`, **retry once**.
6. **Choose parse mode:** default JSON; for **204** or `parse: 'void'`, return **`undefined`** without `JSON.parse`.

### Flags

- **`skipAuth`:** public routes (`/auth/local/signin`, etc.).
- **`skipRefresh`:** login/refresh must not recurse.

### URL exclusions for refresh (defensive)

Refresh is skipped when URL contains `/auth/refresh`, `/auth/local/signin`, `/auth/verify` — even if `skipRefresh` were mis-set.

### Why this abstraction exists

- **Single place** for “401 means try mutex refresh then retry” on the fetch side.
- **`parse: 'void'`** documents endpoints that **return no JSON** (Nest 204).

### Request flow (text)

```txt
request(path, init)
  → merge headers + Bearer access
  → fetch
  → if 401 && can refresh → refreshTokenPair → set header → fetch again
  → if 204 or parse void → return undefined (or throw ApiError if !ok)
  → else read body → if !ok throw ApiError else return JSON
```

---

## 4. `refreshMutex.ts`

**Purpose:** Serialize refresh into **one network call**; store new pair; return the same promise to concurrent waiters.

**Defensive parsing:** `parseTokens` requires both string tokens; otherwise **`ApiError` “Invalid token response”** — avoids silently continuing with half a session.

**204 on refresh:** Treated as error (`Unexpected empty refresh`) because contract expects **JSON tokens** (`TokensDto`).

**Why it exists:** Prevent **refresh token rotation races** (documented Nest behavior: old refresh invalidated after success).

---

## 5. `body.ts` — `readResponseBodyUnknown`

Reads **`res.text()`** then tries `JSON.parse`. If proxy returns HTML error page, callers get **string** body — `normalizeErrorMessages` still yields a generic message.

**Why:** `res.json()` throws on HTML; this keeps error paths **one code path**.

---

## 6. `errors.ts` — `ApiError` + Nest normalization

**`normalizeErrorMessages(body)`** handles Nest defaults:

- `message: string`
- `message: string[]` (ValidationPipe)
- fallback `error: string`

**`toUserFacingMessage`:** prefers first message from `ApiError`.

**Why:** The backend has **no global envelope**; errors are raw Nest shapes.

---

## 7. `authApi.ts`

| Method | Route | Notes |
|--------|-------|------|
| `signIn` | `POST /auth/local/signin` | skipAuth, skipRefresh |
| `verify` | `POST /auth/verify` | same |
| `resendVerification` | `POST /auth/resend-verification-code` | `parse: 'void'` |
| `requestResetPassword` | `POST /auth/request-reset-password` | void |
| `resetPassword` | `POST /auth/reset-password` | void |
| `logout` | `POST /auth/logout` | authenticated; void |

**`narrowSignInResult`:** runtime discriminator between tokens vs verification — **defensive** against unexpected shapes.

---

## 8. `employeesApi.ts`

- **`list(query)`** — clamps `skip`/`take` (`pagination.ts`), builds query string, `GET /employees`, then **`normalizePaginatedEmployees`**: if response is wrong-shaped, returns **empty data + zero meta** instead of throwing — **defensive** for broken proxies.
- **`stats(groupBy)`** — `GET /employees/stats?groupBy=...` with **API enum strings** (`EmployeeStatsGroupBy` in dto matches backend: `department_id`, etc.).

**Why normalization:** UI should not crash on partial JSON during demos or misconfigured environments.

---

## 9. `usersApi.ts`

- **`list`** — `GET /users?search=`; **`sanitizeUsersResponse`** strips `hashedPassword` and similar (see `utils/sanitize.ts`).
- **`create`** — `POST /users` returns **`string`** message (201 per reference) — typed as `Promise<string>`.
- **`remove`** — `DELETE /users/:id` with **`parse: 'void'`** for 204.

---

## 10. `lookupsApi.ts`

**`all()`** runs **parallel** GETs to every route in `COMPLETE_API_REFERENCE` under `/lookups/...`, returns a **bundle object**.

**`getJsonArray`:** if response is not an array → **`[]`** — avoids map crashes.

---

## 11. Axios `apiClient` (`lib/api.ts`) — complementary behavior

### Request interceptor

Attaches **`Authorization: Bearer`** from `tokenStorage.getAccessToken()`.

### Response interceptor

On **401**, if URL is not refresh/signin/verify:

1. Set `_retry` flag.
2. `await refreshTokenPair()`.
3. Update `originalRequest.headers.Authorization`.
4. **`return apiClient(originalRequest)`**.

On refresh failure: **`emitSessionExpired()`**, **`tokenStorage.clearTokens()`**, **`window.location.href = '/login'`**.

**Difference vs fetch:** Axios path **hard redirects** to login on refresh failure; fetch path throws after **`emitSessionExpired()`** (store clears; UI depends on route).

### Logout helper

`validateStatus: (status) => status === 204 || status === 401` — **204 handling** without treating as Axios error.

### Employee layer

- **`mapEmployeesQueryToApi`** — maps UI filters to **camelCase query DTO** keys expected by Nest (`departmentId`, `minAge`, … per backend docs).
- **`mapApiEmployeeToEmployee`** — snake_case row + lookup maps → rich **`Employee`** UI model.
- **`fetchEmployeeStats`** — tries **`GET /employees/stats`**; **on any error**, falls back to **`loadEmployeesDataset()`** and **in-memory aggregation** — resilience when stats endpoint or DB is down (charts still show something).
- **`fetchDashboardBundle`** — **does not call `/employees/stats`**; it **pages through `GET /employees`** until all rows loaded, then computes cards — trades bandwidth for **one cohesive snapshot** (documented in code comments).

**Why `fetchAllEmployeesPaginated`:** Ensures dashboard math sees **full dataset** while respecting server `take` cap (10 in code).

---

## 12. Error handling strategy (summary)

| Layer | Client errors | Server errors |
|-------|---------------|---------------|
| fetch / httpClient | `ApiError` with normalized messages | same |
| axios screens | `getApiErrorMessage` reads axios `response.data.message` or 403 string | Network errors → fallback |

**Gap:** Axios failures are **not** normalized to `ApiError`, so React Query `retry` default that checks `isApiError` **does not apply** to hooks if they were switched to axios without wrapping.

---

## 13. 204 handling

| Endpoint | Client handling |
|----------|-----------------|
| `POST /auth/logout` | `parse: 'void'` (fetch) / `validateStatus` (axios helper) |
| `POST /auth/resend-verification-code` | void |
| `DELETE /users/:id` | void |
| `DELETE /employees/:id` | axios delete; axios treats 204 as success |

**httpClient:** explicitly treats **204** as **no JSON** even if `parse` unset (`mode = res.status === 204 ? 'void' : json`).

---

## 14. Retry strategy

- **React Query (global):** retry 5xx up to 2 times; **no retry on 4xx** when error is `ApiError`.
- **Http client:** **one** automatic retry after refresh (not exponential backoff).
- **Axios interceptor:** **one** retry after refresh via `_retry` flag.

---

## 15. Request / response normalization (checklist)

- **Query params:** `toQueryString` omits null/undefined; booleans stringified.
- **Pagination meta:** `normalizePaginationMeta` coerces numbers; **`computeTotalPages`** if `pages` missing.
- **Users:** sanitize sensitive keys for `usersApi` — **not** for `fetchUsers` in `lib/api.ts`.
- **Employees list response:** fallback empty list if shape invalid (`employeesApi`).

---

## 16. Defensive programming techniques (-catalog)

1. **Discriminated union** for sign-in (`narrowSignInResult`).
2. **Array guards** (`Array.isArray`) before map.
3. **Mutex** for refresh.
4. **Optional retry** only when semantics safe (idempotent GET).
5. **Stats fallback** to client aggregation.
6. **Lookup fetch** — empty array on failure (`lookups.ts` fetchLookupList).

---

## 17. Known mismatches vs docs (frontend-side)

| Topic | Docs | Code |
|-------|------|------|
| Verify OTP | Returns tokens | `verifyAccount` (axios) discards body; page sends user to login |
| Users GET | May include password hash | `UsersList` uses unsanitized `fetchUsers` |
| Dashboard | Could use `GET /employees/stats` | Bundle uses full employee pagination + local aggregation |
| Integration guide | Mentions vacations/attendance | No UI calls (types only) |

These are **implementation choices or gaps**, not contradictions in Swagger itself.
