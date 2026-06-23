# Frontend Architecture — HR Dashboard

Deep dive into **structure**, **composition**, and **cross-cutting** concerns. All route and endpoint names below match `back/COMPLETE_API_REFERENCE.md` unless explicitly marked as **not implemented** in the UI.

---

## 1. Folder structure (annotated)

```text
src/
├── main.tsx                 # React root; Ant Design reset CSS; AppProviders
├── App.tsx                  # BrowserRouter + route table
├── index.css                # Global styles (Tailwind layers)
├── app/                     # Route-level pages (feature screens)
│   ├── auth/                # Login, VerifyEmail, ForgotPassword
│   ├── dashboard/           # Dashboard.tsx
│   ├── employees/           # List, details
│   ├── reports/             # Charts from /employees/stats (+ fallback)
│   ├── settings/            # Mostly static UI; links to Users
│   └── users/               # SUPER_ADMIN users CRUD (axios)
├── api/                     # Fetch-based “integration” layer
│   ├── httpClient.ts        # fetch wrapper, 401 → refresh, 204 handling
│   ├── refreshMutex.ts      # single-flight refresh
│   ├── errors.ts            # ApiError + Nest message normalization
│   ├── body.ts              # readResponseBodyUnknown
│   ├── env.ts               # getApiBaseUrl()
│   └── resources/           # authApi, employeesApi, usersApi, lookupsApi
├── auth/                    # Session domain
│   ├── authStore.ts         # Zustand: login, logout, claims
│   ├── jwt.ts               # decodeJwtPayload (no verify), exp helper
│   ├── tokenStorage.ts      # localStorage vs sessionStorage keys
│   └── sessionEvents.ts     # emitSessionExpired bridge
├── features/                # React Query hooks (optional / parallel to lib/api)
│   ├── auth/hooks/
│   ├── employees/hooks/
│   └── users/hooks/
├── components/              # Presentational + Ant Design composition
├── layout/                  # MainLayout (Sidebar + Navbar + Outlet)
├── routes/                  # ProtectedRoute, RequireRole
├── providers/               # QueryProvider → QueryClientProvider
├── query/                   # queryClient.ts, queryKeys.ts
├── lib/                     # Axios apiClient + mappers + domain types
│   ├── api.ts               # Primary runtime API used by most pages
│   ├── apiErrors.ts         # getApiErrorMessage (ApiError + Axios)
│   ├── employees/           # mapper, lookups cache, apiTypes
│   └── types.ts             # Employee UI model, query params
├── hooks/useAuth.ts         # Re-export of auth store
└── utils/                   # pagination, queryString, sanitize
```

**Important:** `src/api/` (fetch) and `src/lib/api.ts` (axios) **coexist**. This is not a “clean hexagon” boundary yet; it is a **pragmatic migration shape** where new resources were added with `httpClient` while the heaviest employee/dashboard code stayed on Axios interceptors.

---

## 2. Component architecture

- **Pages** (`src/app/*`) own **data loading orchestration** (many use `useEffect` + `useState`).
- **Smart presentational components** (`EmployeeTable`, `AddEditEmployeeModal`, `ChartCard`, `StatsCard`) receive **props**; they do not import the API directly (except through Ant Design internals).
- **Layout** (`MainLayout`) is a **routing outlet wrapper**: it does not fetch data; it stitches **Sidebar** + **Navbar** around child routes.

This is closer to **“route containers + presentational children”** than strict **atomic design**. For a defense, you can describe it as **pragmatic separation**: tables and modals are reusable; screens hold workflow and API wiring.

---

## 3. Feature-based structure

`src/features/*` encodes **TanStack Query** hooks as reusable units:

- `useEmployeesQuery` / `useEmployeeStatsQuery` → `employeesApi` (fetch).
- `useLookupsBundleQuery` → `lookupsApi.all()` (parallel `GET /lookups/*`).
- `useUsersListQuery` → `usersApi.list` (**sanitized**).
- `useAuthMutations` → `authApi` + store updates.

**Current gap:** the main screens **do not import** these hooks; they call `@/lib/api` directly. The feature folder is **ready for consolidation** but is not the single source of truth yet.

---

## 4. State management architecture

| Concern | Tool | Location |
|---------|------|----------|
| Auth tokens + role/email | Zustand | `authStore.ts` |
| Server list data on most pages | React local state | e.g. `EmployeesList.tsx` |
| Server data (optional) | React Query | `features/*/hooks` |
| Lookups for mapping | In-memory module cache | `lib/employees/lookups.ts` |
| Employee dataset for dashboard fallback | Module-level cache | `lib/api.ts` (`cachedEmployeesDataset`) |

---

## 5. Authentication architecture

- **Login path:** Zustand `login` → `authApi.signIn` (fetch, `skipAuth` + `skipRefresh`) → tokens or verification redirect.
- **Persistence:** `tokenStorage` keys `hr_access_token` / `hr_refresh_token`.
- **Hydration:** `initializeAuth` on `ProtectedRoute` mount.
- **Session expiry:** `emitSessionExpired` → `clearSession` (registered once in store factory).
- **Claims:** `decodeJwtPayload` on access token → `sub`, `email`, `role`. **Client-side only** — fine for UI; API enforces real authorization.

---

## 6. API layer architecture

Two entry points share **`refreshTokenPair`**:

1. **`httpClient.request`** — builds URL via `getApiBaseUrl`, sets `credentials: 'include'`, on 401 calls mutex, retries once.
2. **`apiClient` (axios)** — request interceptor adds access token; response interceptor on 401 retries once after mutex.

See [FRONTEND_API_LAYER.md](./FRONTEND_API_LAYER.md).

---

## 7. React Query architecture

- **Provider:** `AppProviders` → `QueryProvider` → `queryClient` from `query/queryClient.ts`.
- **Defaults:** `staleTime` 60s, `gcTime` 10m, **mutation retry disabled**, query retry distinguishes 4xx vs 5xx (`ApiError` only—axios errors are not `ApiError` unless wrapped).

**Auth-aware queries:** hooks accept `enabled`; nothing globally gates queries on auth because unauthorized users never mount protected routes.

---

## 8. Routing architecture

Defined in `App.tsx`:

| Path | Guard | Content |
|------|-------|---------|
| `/login`, `/verify`, `/forgot-password` | Public | Auth flows |
| `/` (index), `/employees`, `/employees/:id`, `/reports`, `/settings` | `ProtectedRoute` | Main app |
| `/users` | `ProtectedRoute` + `RequireRole allow={['SUPER_ADMIN']}` | User admin |

Unknown paths → `Navigate` to `/`.

---

## 9. Protected routes

`ProtectedRoute`:

1. On mount, **`initializeAuth()`** reads storage and sets `isAuthenticated` / claims.
2. While `isLoading`, shows a **spinner**.
3. If not authenticated after load → **`navigate('/login')`**.
4. Else render children (typically `MainLayout`).

This is **client-only** protection (hides UI). Sensitive data still requires valid JWT on the server.

---

## 10. Role-based authorization

- **`RequireRole`:** if `role` not in `allow`, render `<Navigate to={fallbackPath} />` (default `/`).
- **`Sidebar`:** filters out items with `superAdminOnly` unless `role === 'SUPER_ADMIN'`.
- **Employee writes:** backend requires `SUPER_ADMIN`; the UI may still show buttons to `ADMIN` users — expect **403** if server rejects (handled via `getApiErrorMessage`).

---

## 11. Layout system

- **Sidebar:** fixed drawer on mobile; full column on desktop (`lg:pl-72` on content).
- **Navbar:** sticky header; user menu triggers **logout** (store + navigation).
- **`MainLayout`:** hosts `<Outlet />` for nested routes.

---

## 12. Reusable UI patterns

- **Stats + charts:** `StatsCard` + `ChartCard` (Recharts inside).
- **Data table:** `EmployeeTable` encapsulates Ant Design `Table` filters, row selection, link to details via `Link` + `state`.
- **Forms:** Ant Design `Form` in modals (`UsersList`, `AddEditEmployeeModal`).
- **Feedback:** `message.*` from Ant Design for transient errors/success.

---

## 13. Technical decision: why two HTTP stacks?

| Approach | Pros | Cons |
|----------|------|------|
| **Keep axios + interceptors** (current for employees) | Mature retry pattern; easy `validateStatus` for 204 logout | Duplicated semantics vs fetch layer |
| **fetch + httpClient only** | One code path; explicit parse modes | Would require porting all `lib/api.ts` helpers |
| **tRPC / OpenAPI codegen** | End-to-end types | Extra tooling; backend is plain REST today |

**Scalability:** Consolidating on **one client** reduces cognitive load. **Maintainability:** as long as both use **`refreshTokenPair`**, refresh correctness is preserved.

---

## 14. Weaknesses and improvements

1. **Unify data fetching** — migrate `Dashboard`, `EmployeesList`, `UsersList`, `Reports` to React Query hooks already present under `src/features/`.
2. **Remove duplicate auth helpers** — align `VerifyEmail` with `useVerifyAccountMutation` / `authApi.verify` so tokens match backend contract.
3. **Sanitize all user list consumers** or enforce DTO mapping at a single `fetchUsers` implementation.

---

## 15. Major technical decisions (pros, cons, scale, maintainability)

### Vite + React 19

- **Why:** Fast dev feedback for a UI-heavy dashboard; React 19 is the current major line in `package.json`.
- **Alternatives:** Next.js (SSR not required for internal HR tool), CRA (deprecated trajectory).
- **Pros:** Simple static deploy to Netlify / similar; ESM-native.
- **Cons:** No file-based routing (manual `App.tsx` table).
- **Scale:** Excellent for SPA asset size; SEO not a focus here.
- **Maintainability:** Standard React patterns; easy onboarding.

### Ant Design for data grids

- **Why:** Employee directory needs sortable, filterable tables without building from primitives.
- **Alternatives:** TanStack Table, MUI DataGrid, AG Grid.
- **Pros:** Large component set; accessible patterns for enterprise users.
- **Cons:** Bundle weight; visual style must be blended with Tailwind (as done in layout).
- **Scale:** Table virtualization not used — large page sizes may need revisit.
- **Maintainability:** Declarative column config centralizes filter wiring.

### Tailwind + Lucide icons

- **Why:** Rapid layout consistency for shell (sidebar/nav) alongside Ant Design content.
- **Alternatives:** Pure Ant Design layout, CSS modules.
- **Pros:** Cohesive marketing-style chrome; small icon set via `lucide-react`.
- **Cons:** Two styling systems to learn.
- **Maintainability:** Use `cn()` utility to avoid class chaos.

### Zustand for auth

- **Why:** Minimal API for global session; avoids Context boilerplate.
- **Alternatives:** Redux Toolkit, Context + `useReducer`, Jotai.
- **Pros:** Tiny store file; easy to read in defense.
- **Cons:** No built-in devtools by default (can add).
- **Scale:** Auth is one slice — no Redux needed.
- **Maintainability:** Keep auth side effects (logout, session events) in one module.

### TanStack React Query

- **Why:** Industry standard for caching, retries, deduplication; hooks already scaffolded under `src/features/`.
- **Alternatives:** SWR, plain `useEffect`, RTK Query.
- **Pros:** Fine-grained `staleTime` / `gcTime`; great for lookup bundles.
- **Cons:** Currently **underutilized** — dual patterns hurt maintainability until migrated.
- **Scale:** Excellent for many readers; needs adoption on main pages.
- **Maintainability:** **Action item:** make Query the single read path.

### Dual HTTP clients (fetch + Axios)

- **Why:** Incremental introduction of `httpClient` without rewriting the large `lib/api.ts` employee module.
- **Alternatives:** Big-bang migration to fetch; generate client from OpenAPI.
- **Pros:** Shared `refreshTokenPair` preserves correctness.
- **Cons:** Two error types; two configuration paths.
- **Scale:** Acceptable; cognitive cost grows with team size.
- **Maintainability:** Medium unless consolidated.

### Client-side dashboard aggregation

- **Why:** Code comment states intent — one controlled dataset avoids duplicate failing calls and parameter mismatches across multiple stats requests.
- **Alternatives:** rely solely on `GET /employees/stats` per dimension; BFF aggregation endpoint.
- **Pros:** Resilient demo when stats endpoint flaky (`fetchEmployeeStats` already falls back for reports).
- **Cons:** Expensive for large `N` employees (many paginated GETs).
- **Scale:** Poor beyond low thousands without backend-side aggregates.
- **Maintainability:** Logic is centralized in `lib/api.ts` but dense.

### Employee details via router state

- **Why:** No `GET /employees/:id` in published API reference — avoids inventing endpoints.
- **Alternatives:** Add backend detail route; or refetch list and find by id client-side.
- **Pros:** Zero extra network; instant navigation from table.
- **Cons:** Broken on refresh / deep link — explicitly messaged in UI.
- **Maintainability:** Clear until API evolves.

### Optional `sessionStorage` for tokens

- **Why:** Reduces persistence on shared workstations when `VITE_AUTH_STORAGE=session`.
- **Alternatives:** HTTP-only cookies (requires deeper backend + CSRF strategy).
- **Pros:** One env toggle.
- **Cons:** localStorage default still XSS-sensitive — standard SPA trade-off.
- **Maintainability:** Document env for security reviewers.
