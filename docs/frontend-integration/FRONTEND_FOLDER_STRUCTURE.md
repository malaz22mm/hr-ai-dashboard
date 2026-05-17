# Recommended Frontend Folder Structure

Target: **Vite + React + TypeScript + TanStack Query**, SPA with feature-based modules.

---

## Layout

```text
src/
├── app/                      # App shell: routes, providers, layout
│   ├── providers/
│   │   ├── AppProviders.tsx  # QueryClient + Auth + Theme
│   │   └── AuthProvider.tsx
│   ├── routes/
│   │   ├── routes.tsx        # Route config / createBrowserRouter
│   │   └── guards.tsx        # RequireAuth, RequireSuperAdmin
│   └── layout/
│       ├── AppLayout.tsx
│       └── Sidebar.tsx
├── features/                 # Domain-centric vertical slices
│   ├── auth/
│   │   ├── api.ts
│   │   ├── components/
│   │   └── pages/
│   ├── employees/
│   ├── users/
│   ├── vacations/
│   ├── attendance/
│   ├── reports/              # charts using /employees/stats
│   └── lookups/              # optional: shared hooks for form options
├── api/                      # Transport-level
│   ├── client.ts             # instance wrapping SAFE_API_CLIENT
│   ├── endpoints.ts          # path constants + typed helpers
│   └── errors.ts             # normalizeApiError, guards
├── query/                    # React Query
│   ├── queryClient.ts
│   ├── keys.ts               # qk.* factories
│   └── defaults.ts
├── hooks/                    # Cross-cutting hooks
│   ├── useAuth.ts
│   ├── useDebouncedValue.ts
│   └── useDocumentTitle.ts
├── services/                 # Thin orchestration (optional)
│   └── sessionStorage.ts
├── types/                    # Re-exports + domain aliases
│   ├── api.ts                # or import from FRONTEND_TYPES
│   └── global.d.ts
├── utils/
│   ├── assert.ts
│   ├── date.ts
│   └── sortByMap.ts          # UI column -> Prisma snake_case
├── assets/
├── styles/
├── main.tsx
└── vite-env.d.ts
```

---

## Guardrails

| Folder | Responsibility | Non-goals |
|--------|----------------|-----------|
| `api/` | HTTP, auth header, refresh, parsing | No React |
| `features/*` | Screens, feature hooks, colocated UI | No duplicate fetch logic — call `api/` |
| `query/` | Keys, defaults, shared invalidate helpers | No JSX |
| `app/routes` | Composition, lazy loading | No business rules |
| `types/` | Contracts | No runtime logic (use `zod` beside if validating) |

---

## Import boundaries

- `features/*` may import `api`, `query`, `types`, `hooks`, `utils`.  
- `api` must **not** import `features` or React.  
- Circular dependency check: keep `types` as a DAG leaf.

---

## Naming

- **Pages** live under `features/<domain>/pages`.  
- **Public API** of a feature: `features/employees/index.ts` re-exporting only what routes need.

---

## Migration note for this repo

The existing `src/app/*` layout can be incrementally aligned: introduce `api/client.ts` + `query/keys.ts`, then move domain screens under `features/` when touching them.

---

## Artifact location

Reference implementations for copy/paste into a new repo: same folder as this doc ([`SAFE_API_CLIENT.ts`](./SAFE_API_CLIENT.ts), [`AUTH_PROVIDER_EXAMPLE.tsx`](./AUTH_PROVIDER_EXAMPLE.tsx), [`FRONTEND_TYPES.ts`](./FRONTEND_TYPES.ts)).
