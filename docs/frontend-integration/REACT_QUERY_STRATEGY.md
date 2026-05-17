# React Query Strategy

Assumes **TanStack React Query v5** + the API client patterns in [`SAFE_API_CLIENT.ts`](./SAFE_API_CLIENT.ts).

---

## Query key design

Use **hierarchical arrays** with stable primitives:

```ts
export const qk = {
  auth: ['auth'] as const,
  me: ['auth', 'me'] as const, // if you add a profile endpoint later
  employees: {
    root: ['employees'] as const,
    list: (params: Record<string, unknown>) => ['employees', 'list', params] as const,
    stats: (groupBy: string) => ['employees', 'stats', groupBy] as const,
  },
  users: {
    root: ['users'] as const,
    list: (search?: string) => ['users', 'list', search ?? ''] as const,
  },
  lookups: {
    root: ['lookups'] as const,
    byName: (name: string) => ['lookups', name] as const,
  },
  attendance: {
    presence: ['attendance', 'presence'] as const,
    history: (empId: number, range?: { start?: string; end?: string }) =>
      ['attendance', 'history', empId, range ?? {}] as const,
  },
  vacations: {
    root: ['vacations'] as const,
    list: (status?: number) => ['vacations', 'list', status ?? 'all'] as const,
    byEmployee: (empId: number) => ['vacations', 'employee', empId] as const,
  },
};
```

**Rules:**

- Put **serialized filter/sort/pagination** objects in the key (or a stable hash) so lists refetch when URL state changes.  
- Never include **tokens** in query keys.

---

## Invalidation rules

| Mutation | Invalidate / update |
|----------|---------------------|
| `POST /employees` | `qk.employees.root` (lists), optionally prefetch first page |
| `PUT /employees` | All `employees.list*`, `employees.stats*` if metrics changed |
| `DELETE /employees/:id` | Lists + detail; remove from cache if keyed by id |
| `POST /vacations` | `vacations` for affected employee + admin list |
| `PATCH /vacations/:id/process` | Admin `vacations.list*` + employee `byEmployee` |
| `POST /attendance/punch` | `presence`, relevant `history` |
| `POST /users` | `users.list*` |
| `DELETE /users/:id` | `users.list*` |
| Logout | **`queryClient.clear()`** or remove all authenticated queries |

---

## Optimistic updates

**Use sparingly** — HR data has strict validation and relations.

- **Punch / attendance:** Possible optimistic toggle with rollback on 404/400.  
- **Vacation approve/reject:** Better **pessimistic** (wait for 200) to avoid mismatch with `processed_by` fields unless UX demands instant feedback.

---

## Auth-aware queries

- **Unauthorized mount:** Either wrap app in provider that gates queries, or use `enabled: isAuthenticated` on protected `useQuery` calls.  
- **After refresh:** No special invalidation needed if React Query retries failed queries **after** token repair — simpler pattern: global `QueryCache` listener is optional; usually **retry: false** for 401 and handle in client.

**Recommended:** API client resolves 401 via refresh + single retry; React Query sees final result (success or error).

---

## Caching lookups

- Lookups change infrequently → `staleTime: 30 * 60 * 1000` (30m) or longer.  
- `gcTime` (cacheTime) can be hours for small JSON arrays.  
- **Prefetch** lookups on app shell load for forms.

---

## Pagination handling

- Employees: **server pagination** via `skip` / `take` + `meta.pages`.  
- Use `keepPreviousData` / `placeholderData: keepPreviousData` (v5) for smooth page changes.  
- **Do not** use client-side only slice unless endpoint is small — dataset is “HR comprehensive” per Swagger.

---

## Stats caching

- `GET /employees/stats?groupBy=...` — cache per `groupBy`; `staleTime` moderate (5–15m) if dashboards are not real-time.  
- Invalidate stats on employee mutations that alter salary/age/department (or invalidate broadly on any employee PUT/POST/DELETE for simplicity).

---

## Error handling

- Map `ApiError` to query `error` state; use `isApiError` type guard in UI.  
- For **403** on role mismatch, show dedicated empty state, not infinite refetch.

---

## Defaults suggestion

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});
```

Tune per endpoint (stats vs live presence).

---

## Testing implications

- Mock **204** with empty `Response` body in MSW.  
- Mock **401 → refresh → 200** chain to ensure exactly **one** refresh call in parallel scenarios.
