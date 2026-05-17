# Frontend API Integration Plan

> **Sources of truth reviewed:** `back/swagger-spec.json`, `back/COMPLETE_API_REFERENCE.md`, `back/FRONTEND_INTEGRATION_GUIDE.md`, `back/BACKEND_ARCHITECTURE.md`.  
> **Constraint:** Backend source is not available; treat documentation disagreements as **runtime hazards**.

---

## 1. Backend Understanding Summary

### Architecture

- **Stack:** NestJS 11, Prisma 7, PostgreSQL.  
- **Deployment:** Local Express (`main.ts`) or **Vercel serverless** (`serverless.ts`); all traffic rewritten to the function — API routes live at the **deployment origin root**, **not** under `/api` for app endpoints (Vercel reserves `/api` for the function path in infra terms; consumer URLs are still `/employees`, `/auth/...`, etc.).  
- **Cross-cutting:** Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`), global JWT `AtGuard` except `@MyPublic()`, optional `RolesGuard` on specific controllers/operations.  
- **CORS:** Documented allowlist includes `http://localhost:5173` and `https://hrdashboardai.netlify.app`. **OPTIONS** returns **204**; preflight must succeed without JWT.

### Auth flow

1. **Sign-in:** `POST /auth/local/signin` with `email` **or** `phone` plus `password` (Swagger: password `minLength: 6`).  
2. **Outcomes:**  
   - Verified: `200` + `{ access_token, refresh_token }` (`TokensDto`).  
   - Unverified: `200` + `{ verificationId, message }` — **not** tokens; frontend must branch before persisting JWTs.  
3. **OTP verify:** `POST /auth/verify` with `{ userId, code }` — `code` is a **number** in OpenAPI (e.g. `12345`); integration guide stresses **5 digits**.  
4. **Refresh:** `POST /auth/refresh` with `Authorization: Bearer <refresh_token>` **only** (rotates both tokens; old refresh invalidated). Documented failure: **403** for invalid/expired/revoked refresh (Swagger).  
5. **Logout:** `POST /auth/logout` with **access** token → **204** empty body (invalidate server-side refresh hash).

### Protected routes

- Default: **Bearer access JWT** on all non-public routes.  
- **Role gates:**  
  - `GET/POST /users`, `DELETE /users/:id` → **SUPER_ADMIN** (ADMIN → **403** per integration guide).  
  - `POST` / `PUT` / `DELETE` on **employees** → **SUPER_ADMIN**; `GET /employees` and analytics/attendance/vacations/lookups → authenticated user (role specifics not uniformly spelled out in all docs — assume **401** if token bad, **403** if role insufficient where documented).

### Response patterns

- **No global envelope** — success payloads are “raw” JSON.  
- **Employees list:** `{ data, meta }` with pagination meta (`total`, `skip`, `take`, `pages`).  
- **Many endpoints:** plain arrays or objects.  
- **204:** `logout`, `resend-verification-code`, `request-reset-password`, `reset-password`, `DELETE /users/:id`, `DELETE /employees/:id` — **no JSON body**; clients must not call `res.json()`.

### Lookup system

- All under `GET /lookups/*`, **require auth**.  
- Typical item shape (Swagger): `{ id, name, name_code }`; work shifts use `WorkShiftDto` with `shift_name`, `start_time`, `end_time`, `grace_period_minutes`.  
- Vacation status labels: `GET /lookups/vacation-statuses` (0/1/2 semantics documented in prose).

### Employee system

- **ID type:** **integer** autoincrement for employees (paths, `empId` in punch/vacation).  
- **List/filter:** Query keys are **camelCase** in HTTP (e.g. `departmentId`); docs state service maps to snake_case internally.  
- **Sort:** `sortBy` must be **Prisma column / snake_case** (e.g. `monthly_income`), **not** camelCase.  
- **Stats:** `GET /employees/stats?groupBy=<enum>` — enum is **DB field names** (`department_id`, `job_role_id`, …).

### Stats endpoints

- Response items (docs): `group`, `count`, `averageSalary`, `averageAge`, `averageTenure`, `avgEngagement`, `avgWorkload` — **camelCase** in JSON for aggregates; contrast with snake_case **query** conventions for `groupBy` / `sortBy`.

### Vacation workflow

- Create: `POST /vacations` — camelCase body (`empId`, `startDate`, `endDate`, `reason`); approval_status **pending (0)** on create.  
- List: `GET /vacations?status=0|1|2` (optional).  
- Per employee: `GET /vacations/employee/:empId`.  
- Process: `PATCH /vacations/:id/process` with body `{ adminId, statusId }` where **statusId 1 = approved, 2 = rejected**. **Danger:** `adminId` is **client-supplied UUID**, not JWT `sub` in current design (audit/spoofing risk — frontend must still send it until backend changes).

### Attendance workflow

- **Punch:** `POST /attendance/punch` `{ empId }` — toggles check-in vs check-out based on open session.  
- **Presence:** `GET /attendance/presence` — who is currently in.  
- **History:** `GET /attendance/employee/:id?start=&end=` — ISO dates optional; default last 7 days through now.

---

## 2. Frontend Critical Rules

1. **Base URL:** Use `VITE_API_URL` (or equivalent) pointing at API **origin**; paths are `/auth/...`, `/employees`, **not** `/api/employees`.  
2. **Access vs refresh:** Access token on all protected routes **except** `POST /auth/refresh` → use **refresh** token only there.  
3. **Sign-in branching:** If response contains `verificationId`, **do not** store tokens; route to OTP.  
4. **204 responses:** For status `204`, **do not** parse JSON; treat as success with **void** body.  
5. **Employee IDs:** Path and body IDs for employees are **numbers**; user/admin UUIDs are **strings** (`users`, `adminId`).  
6. **sortBy:** Use **snake_case Prisma field names** (e.g. `monthly_income`).  
7. **Query filters:** HTTP query keys are **camelCase** (`departmentId`, `minAge`, …).  
8. **groupBy:** Must be one of documented enum strings (`department_id`, …) — **not** friendly labels like `department`.  
9. **OTP:** Validate **5 digits** in UI; send as **number** if API expects numeric JSON (align with OpenAPI).  
10. **Password:** Minimum **6** characters per DTOs (not “8 chars” enterprise default unless you add stricter UX-only rules).  
11. **Errors:** Expect Nest shape `statusCode`, `message` (string or string[]), `error`; normalize before showing toast.  
12. **Users list:** Assume **sensitive fields** may appear (e.g. `hashedPassword` per architecture); **never** render or log them.  
13. **Dead filters:** Do not rely on filters that pass validation but are **not applied** in service (integration guide: e.g. some absence-related keys).  
14. **Swagger URL:** Live docs at `/docs` and `/docs-json` — not `/api/docs`.  
15. **PATCH vacations:** Ensure deployment/proxy allows PATCH + preflight (CORS).  
16. **Refresh failure:** On refresh **403** or repeated **401**, clear session and send user to login (no infinite retry).  
17. **Concurrency:** Serialize refresh attempts (single-flight mutex) to avoid token races.  
18. **Credentials:** `credentials: 'include'` is shown in the integration guide; only matters if cookies are added later — harmless for pure Bearer apps.

---

## 3. Swagger vs Documentation Mismatch Analysis

| Area | Observation | Risk |
|------|-------------|------|
| `/swagger-spec.json` | OpenAPI path lists `200` with empty description; API reference says **302** redirect to `/docs-json` | Client code that assumes 200 JSON will break; browser follow redirect may still yield JSON. |
| `GET /users` schema | Swagger `UserResponseDto` omits `hashedPassword`; architecture warns **full Prisma rows** may include it | **Schema under-specifies** sensitive fields; defensive client mapping required. |
| `UserResponseDto.phone` | Swagger types `phone` as `object` with string example | Likely **spec error**; runtime may be string — handle string or null safely. |
| Employee list item | `PaginatedEmployeesResponseDto` uses `EmployeeEntity` **without** relations; API reference shows nested `Department` | Real payloads may include **Prisma relation objects** not in Swagger; use **defensive/extended** types. |
| Auth errors | Sign-in documents **403** “resend cooldown” in Swagger; API reference error section is minimal | UI must handle **403** on login, not only 401. |
| Refresh errors | Swagger: **403** for bad refresh; some stacks use 401 for expired JWT | Implement by **status + body**, not assumptions. |
| `VerifingDto` | Typo in schema name vs “Verifying” English | Harmless to HTTP contract; code generators may produce odd names. |
| Employees `security` | Duplicate `bearer` entries on POST/PUT | Cosmetic only. |
| Password reset | `ResetPasswordDto` requires `userId`, `code`, `email`, `newPassword` | Reset flow is **not** “token in URL only” — must match backend DTO exactly. |
| Architecture vs API ref | Architecture mentions `PATCH` vacation `adminId` audit risk; aligns with Swagger `ProcessVacationRequestDto` | Product/security concern; frontend still sends `adminId` today. |

---

## 4. Recommended Frontend Folder Architecture

See dedicated file: [`FRONTEND_FOLDER_STRUCTURE.md`](./FRONTEND_FOLDER_STRUCTURE.md).

---

## 5. Production-Grade API Layer

See [`SAFE_API_CLIENT.ts`](./SAFE_API_CLIENT.ts) for a reference implementation sketch covering:

- Request wrapper with optional JSON body and **204-aware** parsing  
- Access-token injection  
- **Single-flight** refresh with queue  
- Normalized `ApiError` from Nest responses  
- Logout and “retry once after refresh” policy  
- Optional: treat `/auth/refresh` failure as **hard auth reset**

---

## 6. TypeScript Types Strategy

See [`FRONTEND_TYPES.ts`](./FRONTEND_TYPES.ts).

**Principles:**

- **Swagger-first** for request DTOs and known response cores.  
- **Augment** employee/user responses with `| Record<string, unknown>` or explicit optional relation types for `Department`, `JobRole`, etc., when UI needs them.  
- **Discriminated union** for sign-in: `TokensDto | VerificationRequiredDto`.  
- **Auth:** JWT payload type **decoded on client only for UX** (role display); **never** trust it for authorization without matching server 403 handling.  
- **Errors:** `message: string | string[]` with normalizer to `string[]`.  
- **Pagination:** Generic `PaginatedResponse<T>` + `PaginationMeta`.  
- **Lookups:** `LookupItem` + separate `WorkShift` interface.

---

## 7. React Query Strategy

See [`REACT_QUERY_STRATEGY.md`](./REACT_QUERY_STRATEGY.md).

---

## 8. Form & Validation Mapping

| Domain | Rule (from docs / Swagger) | Frontend note |
|--------|----------------------------|---------------|
| Sign-in | `password` required; `email` XOR `phone` | Validate exactly one identifier + password present. |
| Password | `minLength: 6` on `password`, `newPassword` | Show requirement; optional stricter UX. |
| OTP | 5-digit code, numeric in JSON | `^\d{5}$` before submit; `Number()` or integer JSON. |
| UUID fields | `userId`, `adminId`, path `users/:id` | UUID format validation optional; rely on server 400. |
| Employee CRUD | Large `CreateEmployeeDto` / `UpdateEmployeeDto` | Match Swagger required fields; `UpdateEmployeeDto` requires `id`. |
| Vacation | ISO dates `YYYY-MM-DD` in examples | Use date input normalization; validate `endDate >= startDate` in UI as well as server. |
| `statusId` process | Only `1` or `2` | Enum/radio in UI; block 0. |
| Filters | Many numeric ranges | Coerce query params to numbers; omit NaN. |

---

## 9. Runtime Risk Report

Consolidated in [`FRONTEND_RUNTIME_RISKS.md`](./FRONTEND_RUNTIME_RISKS.md).

---

## 10. Final Frontend Integration Blueprint

### Recommended architecture

- **Vite + React + TypeScript** SPA.  
- **React Query** for server state; **context** or lightweight store for auth session only.  
- **Single API module** (fetch or axios) with interceptors equivalent: auth header, error normalization, refresh mutex.  
- **Feature folders** (employees, vacations, attendance) consuming shared `api/` and `types/`.

### Recommended libraries

- `@tanstack/react-query` — caching, retries, SSR-ready patterns if needed later.  
- `zod` (optional) — runtime validation of **critical** responses (auth tokens shape, paginated employees) to catch contract drift.  
- Router: `react-router` (or framework router) with **loader/guard** pattern for protected routes.

### API layer flow

1. Build URL from `VITE_API_URL` + path.  
2. Attach `Authorization: Bearer <access>` unless route is refresh (use refresh) or public.  
3. On `401` once: run refresh; on success replay request; on failure logout.  
4. On `204`: return `undefined` / void success.  
5. On `4xx/5xx` with JSON: normalize messages.

### Auth flow

1. Login → tokens or verification payload.  
2. Store tokens (memory + `sessionStorage` **or** httpOnly cookies if backend ever aligns — today docs show Bearer).  
3. Decode role for **UI gating** only; block SUPER_ADMIN pages when role is ADMIN to avoid flash of 403.  
4. Proactive refresh optional (access TTL **5 minutes** per architecture): schedule refresh ~4.5m or refresh on 401.

### Route protection flow

- **Public:** login, verify OTP, forgot password routes.  
- **Authenticated:** dashboard shell.  
- **Role-based:** users management visible only if JWT `role === SUPER_ADMIN` (or server-driven feature flags later).  
- On **403**: show “not allowed” and avoid hammering retries.

### Deployment recommendations (e.g. Vercel for frontend)

- Set `VITE_API_URL` at build time to production API origin.  
- **CORS:** ensure production frontend origin is allowlisted on API (Netlify URL in docs; add Vercel preview/prod domains as needed or proxy).  
- **Cold starts:** show loading/skeleton on first fetch; consider short retry on **502/503** only with backoff.  
- **Security:** never commit secrets; tokens only in memory/sessionStorage unless hardened.

### Environment variable strategy

```env
# Required for prod builds pointing at deployed API
VITE_API_URL=https://your-api-host

# Optional
VITE_APP_NAME=Talabaty HR
```

**Note:** `VITE_*` is exposed to the browser — only non-secret configuration.

---

## Related artifacts

| File | Purpose |
|------|---------|
| [`FRONTEND_RUNTIME_RISKS.md`](./FRONTEND_RUNTIME_RISKS.md) | Risk register |
| [`FRONTEND_AUTH_FLOW.md`](./FRONTEND_AUTH_FLOW.md) | Auth sequences |
| [`REACT_QUERY_STRATEGY.md`](./REACT_QUERY_STRATEGY.md) | Query keys & invalidation |
| [`FRONTEND_FOLDER_STRUCTURE.md`](./FRONTEND_FOLDER_STRUCTURE.md) | Directory layout |
| [`SAFE_API_CLIENT.ts`](./SAFE_API_CLIENT.ts) | API client reference |
| [`AUTH_PROVIDER_EXAMPLE.tsx`](./AUTH_PROVIDER_EXAMPLE.tsx) | Auth context example |
| [`FRONTEND_TYPES.ts`](./FRONTEND_TYPES.ts) | Shared types |
