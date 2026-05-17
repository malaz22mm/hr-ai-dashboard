# Complete API Reference

Base URL (local): `http://localhost:3000`  
Base URL (Vercel): your deployment root (no `/api` prefix on routes).

**Auth header (protected routes):** `Authorization: Bearer <access_token>`

---

## Route table

| METHOD | ROUTE | AUTH | Request | Response (success) | Status |
|--------|-------|------|---------|-------------------|--------|
| GET | `/` | Public | — | `{ message, swagger, openApiJson, legacySpecFile }` | 200 |
| GET | `/health` | Public | — | `{ status: "ok" }` | 200 |
| GET | `/swagger-spec.json` | Public | — | Redirect → `/docs-json` | 302 |
| POST | `/auth/local/signin` | Public | `SignInDto` | `TokensDto` **or** `VerificationRequiredDto` | 200 |
| POST | `/auth/logout` | Bearer AT | — | (empty) | 204 |
| POST | `/auth/refresh` | Bearer **RT** | — | `TokensDto` | 200 |
| POST | `/auth/verify` | Public | `VerifingDto` | `TokensDto` | 200 |
| POST | `/auth/resend-verification-code` | Public | `{ userId }` | (empty) | 204 |
| POST | `/auth/request-reset-password` | Public | `{ userId }` | (empty) | 204 |
| POST | `/auth/reset-password` | Public | `ResetPasswordDto` | (empty) | 204 |
| GET | `/users` | AT + SUPER_ADMIN | `?search=` optional | `Users[]` | 200 |
| POST | `/users` | AT + SUPER_ADMIN | `CreateUserDto` | `string` message | 201 |
| DELETE | `/users/:id` | AT + SUPER_ADMIN | UUID path | (empty) | 204 |
| GET | `/employees` | AT | `EmployeeQueryDto` (query) | `{ data, meta }` | 200 |
| POST | `/employees` | AT + SUPER_ADMIN | `CreateEmployeeDto` | Employee record | 201 |
| PUT | `/employees` | AT + SUPER_ADMIN | `UpdateEmployeeDto` | Employee record | 200 |
| DELETE | `/employees/:id` | AT + SUPER_ADMIN | **integer** path `id` | (empty) | 204 |
| GET | `/employees/stats` | AT | `?groupBy=<enum>` | `EmployeeStatsGroupDto[]` | 200 |
| POST | `/attendance/punch` | AT | `{ empId }` | Attendance log | 200 |
| GET | `/attendance/presence` | AT | — | Active sessions array | 200 |
| GET | `/attendance/employee/:id` | AT | `?start=&end=` optional ISO dates | Logs array | 200 |
| POST | `/vacations` | AT | `CreateVacationRequestDto` | Vacation request | 201 |
| GET | `/vacations` | AT | `?status=` optional (0\|1\|2) | Requests array | 200 |
| GET | `/vacations/employee/:empId` | AT | — | Employee requests | 200 |
| PATCH | `/vacations/:id/process` | AT | `ProcessVacationRequestDto` | Updated request | 200 |
| GET | `/lookups/departments` | AT | — | Lookup items | 200 |
| GET | `/lookups/job-roles` | AT | — | Lookup items | 200 |
| GET | `/lookups/education-levels` | AT | — | Lookup items | 200 |
| GET | `/lookups/marital-statuses` | AT | — | Lookup items | 200 |
| GET | `/lookups/business-travel` | AT | — | Lookup items | 200 |
| GET | `/lookups/performance-ratings` | AT | — | Lookup items | 200 |
| GET | `/lookups/attrition-risk-classes` | AT | — | Lookup items | 200 |
| GET | `/lookups/shifts` | AT | — | Work shifts | 200 |
| GET | `/lookups/vacation-statuses` | AT | — | Status labels | 200 |
| GET | `/lookups/satisfaction-scales` | AT | — | Satisfaction labels | 200 |

---

## Auth flows

### Sign-in

```http
POST /auth/local/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecureP@ss123"
}
```

**Verified user — 200:**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>"
}
```

**Unverified user — 200:**

```json
{
  "verificationId": "<user-uuid>",
  "message": "Email verification required. Code sent."
}
```

### Verify OTP

```http
POST /auth/verify
Content-Type: application/json

{
  "userId": "<uuid>",
  "code": 12345
}
```

Returns same token shape as sign-in.

### Refresh

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

Returns new `access_token` and `refresh_token`. Old refresh token is invalidated.

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

Returns **204** with empty body.

---

## Employees

### List (paginated + filters)

```http
GET /employees?skip=0&take=10&sortBy=monthly_income&sortOrder=desc&departmentId=2
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "data": [ { "id": 1, "name": "...", "Department": { ... }, ... } ],
  "meta": { "total": 120, "skip": 0, "take": 10, "pages": 12 }
}
```

**Important:** `sortBy` must be a **Prisma column name** (snake_case), e.g. `monthly_income`, not `monthlyIncome`.

Query filter keys use **camelCase** in the API (`departmentId`, `minAge`, …) and are mapped to snake_case in the service.

### Stats

```http
GET /employees/stats?groupBy=department_id
```

`groupBy` enum values: `department_id`, `job_role_id`, `education_id`, `marital_status_id`, `business_travel_id`, `work_shift_id`, `attrition_risk_class_id`, `performance_rating_id`.

**Response item:**

```json
{
  "group": 2,
  "count": 15,
  "averageSalary": 6500,
  "averageAge": 34,
  "averageTenure": 5.2,
  "avgEngagement": 3.5,
  "avgWorkload": 2.8
}
```

### Delete

```http
DELETE /employees/42
```

`:id` is an **integer**, not a UUID.

---

## Attendance

```http
POST /attendance/punch
Content-Type: application/json
Authorization: Bearer <access_token>

{ "empId": 42 }
```

```http
GET /attendance/employee/42?start=2025-05-01&end=2025-05-17
```

Omit dates → last 7 days through now.

---

## Vacations

```http
POST /vacations
Content-Type: application/json

{
  "empId": 42,
  "startDate": "2025-06-01",
  "endDate": "2025-06-10",
  "reason": "Family trip"
}
```

**Status IDs:** `0` pending, `1` approved, `2` rejected.

```http
PATCH /vacations/10/process
Content-Type: application/json

{
  "adminId": "<admin-user-uuid>",
  "statusId": 1
}
```

---

## Error format (NestJS default)

No custom global wrapper. Typical validation error **400:**

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `AT_SECRET` | Access JWT signing |
| `RT_SECRET` | Refresh JWT signing |
| `PORT` | Local port (default 3000) |

Email (verification) uses `EmailService` / nodemailer — configure per `auth/email/`.
