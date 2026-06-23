# Swagger ↔ Frontend Sync Report

**Spec analyzed:** `swagger-spec.json` (OpenAPI 3.0, Talabaty HR Backend API v1.0.0)  
**Date:** 2026-06-17  
**Build status after migration:** `npm run build` ✅

---

## Executive summary

The frontend was compared against **every path** in the latest Swagger document. Gaps were closed by adding **`attendanceApi`**, **`vacationsApi`**, expanding **`employeesApi`**, aligning **stats response normalization**, fixing **OTP verify → token session**, sanitizing **users list**, and shipping **Attendance / Vacations UI** plus **employee detail API panels**.

**ML endpoint:** `GET /employees/{employeeId}/predictions/attrition` is **not present** in this Swagger file — no implementation added (per “do not invent endpoints”).

---

## 1. Missing endpoints (before migration)

| Method | Route | Status after migration |
|--------|-------|------------------------|
| POST | `/attendance/punch` | ✅ `attendanceApi.punch` + UI |
| GET | `/attendance/presence` | ✅ `attendanceApi.presence` + `/attendance` page |
| GET | `/attendance/employee/{id}` | ✅ `attendanceApi.history` + EmployeeDetails panel |
| POST | `/vacations` | ✅ `vacationsApi.create` + EmployeeDetails form |
| GET | `/vacations` | ✅ `vacationsApi.list` + `/vacations` admin page |
| GET | `/vacations/employee/{empId}` | ✅ `vacationsApi.listForEmployee` + EmployeeDetails |
| PATCH | `/vacations/{id}/process` | ✅ `vacationsApi.process` + admin approve/reject |
| POST | `/employees` | ✅ `employeesApi.create` (+ hook; list still uses `lib/api`) |
| PUT | `/employees` | ✅ `employeesApi.update` (+ hook) |
| DELETE | `/employees/{id}` | ✅ `employeesApi.remove` (+ hook) |

### Already implemented (unchanged paths)

| Area | Routes |
|------|--------|
| Auth | `/auth/local/signin`, `/logout`, `/refresh`, `/verify`, `/resend-verification-code`, `/request-reset-password`, `/reset-password` |
| Users | `GET/POST /users`, `DELETE /users/{id}` |
| Employees | `GET /employees`, `GET /employees/stats` |
| Lookups | All 10 `/lookups/*` routes |

### Not required in SPA (public / infra)

`GET /`, `GET /health`, `GET /swagger-spec.json`

---

## 2. Outdated endpoints / contracts (fixed)

| Area | Issue | Resolution |
|------|-------|------------|
| **GET /employees/stats** | Frontend expected legacy `_count` / `_avg` Prisma shape | `statsNormalizer.ts` accepts **Swagger `EmployeeStatsGroupDto`** (`group`, `count`, `averageSalary`, …) and legacy rows |
| **POST /auth/verify** | UI discarded tokens and sent user to login | `VerifyEmail.tsx` uses `authApi.verify` + `setSessionFromTokens` → dashboard |
| **GET /users** | Raw rows could include `hashedPassword` | `fetchUsers` delegates to **`usersApi.list`** (sanitized) |
| **verifyAccount (axios)** | Returned `void` | Now returns **`RefreshTokenResponse`** for backward compatibility |

No URL or HTTP method mismatches were found for implemented routes.

---

## 3. Type mismatches (addressed)

| Swagger schema | Frontend location | Notes |
|----------------|-------------------|-------|
| `EmployeeEntity` | `types/dto.ts` | Added full snake_case entity |
| `CreateEmployeeDto` / `UpdateEmployeeDto` | `types/dto.ts` | Aligned with Swagger |
| `EmployeeStatsGroupDto` | `types/dto.ts` | Already correct; mapper was wrong |
| `PunchDto`, vacation DTOs | `types/dto.ts` | Extended with `AttendanceLogDto`, `VacationRequestDto`, etc. |
| `ApiEmployeeStatsRow` (`lib/employees/apiTypes.ts`) | Legacy | Still used indirectly; stats path uses normalizer |

### Remaining intentional UI types

`lib/types.ts` **`Employee`** remains a **camelCase view model** mapped from `EmployeeEntity` via `mapper.ts` — not a 1:1 Swagger export (by design).

### Query params gap (non-breaking)

Swagger lists **many** `GET /employees` filters (absence ratios, promotion stagnation, etc.). `ApiEmployeesQueryParams` maps a **subset** used by the Ant Design table. Unused Swagger filters are available for future UI; backend may still ignore some (“dead keys” per integration guide).

---

## 4. Authentication

| Check | Result |
|-------|--------|
| Access token on protected routes | ✅ `httpClient` + axios interceptors |
| Refresh with **refresh** JWT on `POST /auth/refresh` | ✅ `refreshMutex.ts` |
| 204 on logout / resend / reset | ✅ `parse: 'void'` |
| Sign-in verification branch | ✅ `narrowSignInResult` |
| Verify OTP → tokens | ✅ **Fixed** |
| Protected routes | ✅ `ProtectedRoute` |
| SUPER_ADMIN `/users` | ✅ `RequireRole` + sidebar filter |

---

## 5. Lookup data

| Swagger route | `lookupsApi` | `lookups.ts` (axios cache) |
|---------------|--------------|----------------------------|
| `/lookups/departments` | ✅ | ✅ |
| `/lookups/job-roles` | ✅ | ✅ |
| `/lookups/education-levels` | ✅ | ✅ |
| `/lookups/marital-statuses` | ✅ | ✅ |
| `/lookups/business-travel` | ✅ | ❌ (not needed for current mapper) |
| `/lookups/performance-ratings` | ✅ | ❌ |
| `/lookups/attrition-risk-classes` | ✅ | ✅ |
| `/lookups/shifts` | ✅ | ❌ |
| `/lookups/vacation-statuses` | ✅ | ❌ |
| `/lookups/satisfaction-scales` | ✅ | ✅ |

Employee forms still use **label-based** options from table data in places; bundle hook `useLookupsBundleQuery` is ready for consolidation.

---

## 6. Module verification

### Employees

| Feature | Swagger | Frontend |
|---------|---------|----------|
| List + filters | `GET /employees` | ✅ `EmployeesList` + `lib/api` |
| Stats | `GET /employees/stats` | ✅ Reports + normalizer |
| Create / update / delete | POST/PUT/DELETE | ✅ `lib/api` (UI) + `employeesApi` (hooks) |
| Details by id | **No GET /employees/:id** | Route state + API panels for attendance/vacation |

### Attendance

| Feature | Implementation |
|---------|----------------|
| Punch | EmployeeDetails panel + `useAttendancePunchMutation` |
| Presence | `/attendance` page |
| History | EmployeeDetails panel |

### Vacations

| Feature | Implementation |
|---------|----------------|
| Create | EmployeeDetails form |
| List (admin) | `/vacations` + status filter |
| List per employee | EmployeeDetails table |
| Process | Approve/reject on admin page (`adminId` from JWT `sub`) |

### Users

| Feature | Implementation |
|---------|----------------|
| List + search | `UsersList` → sanitized `fetchUsers` |
| Create / delete | `lib/api` (hooks available: `useCreateUserMutation`, `useDeleteUserMutation`) |
| SUPER_ADMIN | Route + sidebar guard |

---

## 7. ML integration

**Swagger:** `GET /employees/{employeeId}/predictions/attrition` — **NOT FOUND**

`back/FRONTEND_ML_INTEGRATION.md` documents a future/experimental route. **Do not call until it appears in OpenAPI.**

When added, recommended wiring:

1. `employeesApi.attritionPrediction(employeeId)` via `httpClient`
2. `useAttritionPredictionQuery` with 503 handling
3. Badge UI on `EmployeeDetails`

---

## 8. Migration plan (executed)

### Phase 1 — API layer ✅

- `attendanceApi.ts`, `vacationsApi.ts`
- `employeesApi` create/update/delete
- `statsNormalizer.ts`
- `api/index.ts` exports

### Phase 2 — Types & hooks ✅

- Extended `types/dto.ts`
- Query keys for attendance/vacations
- React Query hooks under `features/attendance`, `features/vacations`, employee/user mutations

### Phase 3 — Contract fixes ✅

- Stats mapping in `lib/api.ts`
- Verify flow + users sanitization

### Phase 4 — UI ✅

- `/attendance`, `/vacations` routes + sidebar
- `EmployeeAttendanceVacationPanel` on details page

### Phase 5 — Optional follow-up (not breaking)

- Migrate `EmployeesList` / `Dashboard` / `UsersList` to React Query hooks exclusively
- Wire `useLookupsBundleQuery` into employee modal dropdowns
- Add ML UI when Swagger includes prediction route
- Extend employee query mapper for full Swagger filter set

---

## 9. Files modified / added

### New files

| File |
|------|
| `src/api/resources/attendanceApi.ts` |
| `src/api/resources/vacationsApi.ts` |
| `src/lib/employees/statsNormalizer.ts` |
| `src/features/attendance/hooks/useAttendanceQueries.ts` |
| `src/features/attendance/index.ts` |
| `src/features/vacations/hooks/useVacationsQueries.ts` |
| `src/features/vacations/index.ts` |
| `src/features/employees/hooks/useEmployeesMutations.ts` |
| `src/features/users/hooks/useUsersMutations.ts` |
| `src/app/attendance/AttendancePresence.tsx` |
| `src/app/vacations/VacationsAdmin.tsx` |
| `src/components/EmployeeAttendanceVacationPanel.tsx` |
| `docs/project-discussion/SWAGGER_SYNC_REPORT.md` |

### Modified files

| File | Change |
|------|--------|
| `src/types/dto.ts` | EmployeeEntity, attendance/vacation DTOs |
| `src/api/resources/employeesApi.ts` | CRUD + stats normalizer |
| `src/api/index.ts` | New exports |
| `src/query/keys.ts` | Attendance/vacation keys |
| `src/lib/api.ts` | Stats normalizer, verify tokens, sanitized users |
| `src/app/auth/VerifyEmail.tsx` | Token session after verify |
| `src/app/employees/EmployeeDetails.tsx` | Live attendance/vacation panels |
| `src/App.tsx` | New routes |
| `src/components/Sidebar.tsx` | Attendance + Vacations links |
| `src/features/employees/index.ts` | Mutation exports |
| `src/features/users/index.ts` | Mutation exports |
| `back/swagger-spec.json` | Synced from root spec |

---

## 10. Endpoints added (client)

| API module | Methods |
|------------|---------|
| `attendanceApi` | `punch`, `presence`, `history` |
| `vacationsApi` | `create`, `list`, `listForEmployee`, `process` |
| `employeesApi` | `create`, `update`, `remove` (plus normalized `stats`) |

---

## 11. Potential breaking changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Verify → auto-login | Users no longer forced to login after OTP | Matches Swagger; better UX |
| Stats shape normalization | Charts use `avgEngagement` for satisfaction axis | Fallback aggregation unchanged |
| `fetchUsers` sanitization | Slightly different object shape (`phone` undefined vs null) | Mapped explicitly |
| New sidebar routes | More navigation items | No existing routes removed |

**Existing screens** (`EmployeesList`, `Dashboard`, `Reports`) **still use `lib/api`** — behavior preserved.

---

## 12. Conclusion

The frontend API layer and new modules are **aligned with the latest Swagger contract** for all documented routes except:

1. **ML prediction** — not in OpenAPI  
2. **GET /employees/:id** — not offered by backend (details remain state-based)  
3. **Full filter surface** on employee list — partially mapped in UI  

`npm run build` passes after migration.
