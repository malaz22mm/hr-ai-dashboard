# Dashboard Features — Screen-by-Screen

Each section lists **UI flow**, **backend endpoints** (from `back/COMPLETE_API_REFERENCE.md` only), **state/tech used**, and **edge cases**. If a backend capability has **no UI**, it is noted as **not implemented**.

---

## Legend

- **RQ** = TanStack React Query hook under `src/features/`
- **Axios** = `src/lib/api.ts` (`apiClient`)
- **Fetch** = `src/api/resources/*` via `httpClient`

---

## 1. Dashboard (`/`, `app/dashboard/Dashboard.tsx`)

**UI flow:** Full-page load → spinner → stats cards, engagement chart (`ChartCard`), alerts list, top performers list. Error `Alert` if bundle load throws.

**Endpoints used (indirectly):**

- **`GET /employees`** — paginated in a loop (`fetchAllEmployeesPaginated` in `lib/api.ts`) until all rows loaded.
- **Not used for main bundle:** `GET /employees/stats` (dashboard computes department aggregation **client-side** from full employee list).

**State:** Local `useState`; **no RQ**.

**Edge cases:**

- Large orgs: many sequential `GET /employees` requests (page size 10) — **slow on cold starts**.
- Mapper fills absence fields with **0** defaults (`mapper.ts`) — UI numbers may not reflect real attendance tables.
- Hard-coded error text references a specific Vercel hostname — should use `getApiBaseUrl()` for accuracy.

---

## 2. Employees list (`/employees`, `EmployeesList.tsx`)

**UI flow:** Ant Design table with pagination, multi-filters, sorting, row selection, add/edit modal, delete + bulk delete. Links to details with **`location.state`**.

**Endpoints:**

- **`GET /employees`** — query params: `skip`, `take`, filters mapped via `mapEmployeesQueryToApi` (camelCase API keys with FK ids).
- **`POST /employees`**, **`PUT /employees`**, **`DELETE /employees/:id`** — `:id` is **integer** per API reference (`deleteEmployee` uses `Number(id)`).

**Lookups:** `ensureLookups()` → parallel **`GET /lookups/departments`**, **`job-roles`**, **`education-levels`**, **`marital-statuses`**, **`satisfaction-scales`**, **`attrition-risk-classes`**.

**State:** Local `useState` + `useEffect`; **Axios**. **RQ** analogue: `useEmployeesQuery` (**not wired**).

**Edge cases:**

- **Multiple filter values:** UI sends **first only** (comment in code: backend single value).
- **Sort:** `UI_SORT_TO_API` maps known columns to **snake_case** Prisma fields; unknown fields pass through — may 400 if invalid.
- **Dead filter keys (backend):** integration guide warns some query keys are validated but **not applied** in service — UI might show filters that **silently don’t narrow** server results.
- **ADMIN role:** may get **403** on mutating operations — error surfaced via `getApiErrorMessage`.

---

## 3. Employee details (`/employees/:employeeId`, `EmployeeDetails.tsx`)

**UI flow:** Reads **`employee` from `location.state`**. If missing (direct URL / refresh), shows **Result** explaining data is unavailable until opened from directory.

**Endpoints:** **None** — no `GET /employees/:id` in API reference; implementation is **intentionally client-only**.

**Edge cases:** Refresh loses state; deep-linking not supported until backend adds a detail endpoint.

### ML attrition prediction (documented, not implemented in SPA)

Backend guide: **`back/FRONTEND_ML_INTEGRATION.md`** (from `hr_back` repo).

| Item | Value |
|------|--------|
| Endpoint | `GET /employees/{employeeId}/predictions/attrition` |
| Auth | Bearer access JWT (same as other protected routes) |
| Response | `AttritionPrediction` — `riskLevel`, `attritionProbability`, `predictedAttrition`, `modelVersion`, etc. |
| UI target | **`EmployeeDetails.tsx`** — risk badge, probability %, 503 message |

**Repo status:** No call in `src/` yet. **`back/COMPLETE_API_REFERENCE.md`** and **`swagger-spec.json`** in this repo do **not** list this route yet — treat **`FRONTEND_ML_INTEGRATION.md`** as the contract until Swagger is regenerated from a backend that ships the endpoint.

**Recommended wiring (fits existing architecture):**

- Add `employeesApi.attritionPrediction(employeeId)` via **`httpClient`** (inherits 401 → refresh mutex).
- Optional React Query hook: `useAttritionPredictionQuery(employeeId)` with `enabled: !!employeeId && isAuthenticated`.
- Handle **503** explicitly: “Prediction service temporarily unavailable.”

---

## 4. Users (`/users`, `UsersList.tsx`)

**UI flow:** Debounced search (300ms), table, create modal, delete confirm.

**Endpoints:**

- **`GET /users?search=`**
- **`POST /users`**
- **`DELETE /users/:id`**

**State:** Local `useState`; **Axios** (`fetchUsers`, `createUser`, `deleteUser`).

**RQ:** `useUsersListQuery` uses **sanitized** `usersApi` — **not used** here.

**Edge cases:**

- **403** for non–super-admin — message from `getApiErrorMessage`.
- **Sensitive fields:** backend may return **`hashedPassword`**; this screen **does not** strip it if present in JSON (risk if bound to table or logged). Prefer **`usersApi.list`**.

---

## 5. Reports (`/reports`, `Reports.tsx`)

**UI flow:** Loads three chart datasets in parallel; each uses `fetchEmployeeStats` + `mapStatsToPerformancePoints`.

**Endpoints:**

- **`GET /employees/stats?groupBy=department_id`** (via map from UI `department` → `department_id`)
- **`groupBy` values:** `job_role_id`, `attrition_risk_class_id` for other charts

**Fallback:** `fetchEmployeeStats` **catches** and aggregates **full employee dataset** locally if API errors.

**State:** Local `useState`; **no RQ**.

**Edge cases:**

- Education group exists in hook types but **not** in `REPORT_CHARTS` array — three charts only.

---

## 6. Settings (`/settings`, `Settings.tsx`)

**UI flow:** Static forms (domains, MFA checkbox, HRIS select) — **no API calls**. Link to `/users`.

**Endpoints:** None.

**Note:** Placeholder UX for a real deployment (would need backend settings endpoints — **not in current API reference**).

---

## 7. Login (`/login`, `Login.tsx`)

**Endpoints:** **`POST /auth/local/signin`** via **`authStore` → `authApi`** (Fetch).

**Flow:** Email or phone toggle; on success navigates home; on error uses **`getApiErrorMessage`**.

---

## 8. Verify email (`/verify`, `VerifyEmail.tsx`)

**Endpoints:**

- **`POST /auth/verify`**
- **`POST /auth/resend-verification-code`**

**Implementation:** **Axios** helpers in `lib/api.ts` for verify/resend.

**Mismatch:** Backend returns tokens; UI **does not** store them — user returns to login. See **FRONTEND_AUTH_FLOW.md**.

---

## 9. Forgot password (`/forgot-password`, `ForgotPassword.tsx`)

**Endpoints (public):**

- **`POST /auth/request-reset-password`**
- **`POST /auth/reset-password`**

Uses **`lib/api`** helpers; errors via **`getApiErrorMessage`**.

---

## 10. Lookup dropdowns

**In employees UI:** Modal and table filters use **labels** from current page data and free-text options — **not** exclusively from **`lookupsApi.all()`**.

**Implemented API module:** `lookupsApi.all()` fetches all **`GET /lookups/*`** routes listed in the API reference.

**Employee mapper path:** `ensureLookups()` uses a **subset** of lookup endpoints ( departments, job-roles, education-levels, marital-statuses, satisfaction-scales, attrition-risk-classes ) — sufficient for current mapping.

---

## 11. Analytics, charts, filters, search, pagination

| Concern | Where |
|---------|-------|
| Analytics | Dashboard + Reports (Recharts via `ChartCard`) |
| Charts | Department / role / attrition risk groupings |
| Filters | Ant Design `Table` column filters on Employees |
| Search | Users: `search` query param; Employees: some column search UI in `EmployeeTable` |
| Pagination | Employees: **server** `skip`/`take` + Ant Design pagination |

---

## 12. Attendance & vacations (backend only today)

**Documented endpoints not called by this SPA:**

- `POST /attendance/punch`
- `GET /attendance/presence`
- `GET /attendance/employee/:id`
- `POST /vacations`
- `GET /vacations`, `GET /vacations/employee/:empId`
- `PATCH /vacations/:id/process`

**UI:** `EmployeeDetails` shows **static** absence fields from **`Employee`** model (often **zeros** from mapper), not live attendance API data.

**DTO types** exist in `src/types/dto.ts` (`PunchDto`, vacation DTOs) for future work.

---

## 13. React Query hooks — inventory vs usage

| Hook | Wired to screen? |
|------|------------------|
| `useEmployeesQuery` | No |
| `useEmployeeStatsQuery` | No |
| `useLookupsBundleQuery` | No |
| `useUsersListQuery` | No |
| `useSignInMutation` / `useVerifyAccountMutation` / … | No (Login/Verify use store or axios directly) |

Hooks represent **forward-looking structure** for consolidation.

---

## 14. Feature summary table

| Feature | Primary endpoints | Client stack |
|---------|-------------------|--------------|
| Dashboard | `GET /employees` (paged) | Axios |
| Employees CRUD | `GET/POST/PUT/DELETE /employees`, lookups | Axios |
| Employee detail view | — | Route state only |
| Reports | `GET /employees/stats` (+ fallback) | Axios |
| Users | `GET/POST/DELETE /users` | Axios |
| Auth login | `POST /auth/local/signin` | Fetch (`authApi`) |
| Auth verify | `POST /auth/verify`, resend | Axios (`verifyAccount`) |
| Logout | `POST /auth/logout` | Fetch (`authApi`) |
