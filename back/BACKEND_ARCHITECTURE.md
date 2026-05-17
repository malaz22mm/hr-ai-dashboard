# Backend Architecture — Talabaty HR API

NestJS 11 + Prisma 7 + PostgreSQL, deployable locally or on **Vercel serverless** (`api/index.ts` → `dist/src/serverless.ts`).

## High-level layout

```
src/
├── main.ts              # Local dev entry → configureApp()
├── serverless.ts        # Vercel Express adapter (cached cold start)
├── app.config.ts        # ValidationPipe, CORS, Swagger (shared)
├── app.module.ts        # Global AtGuard (JWT access)
├── app.controller.ts    # /, /health, swagger redirect
├── auth/                # Sign-in, refresh, verify, reset
├── users/               # SUPER_ADMIN user CRUD
├── employees/           # Core HR dataset + analytics
├── attendance/          # Punch in/out, presence, history
├── vacations/           # Requests + admin processing
├── lookup/              # Reference tables for forms/filters
└── common/
    ├── guards/          # AtGuard, RolesGuard
    ├── decorators/      # @MyPublic, @Roles, @AtAuthorizationHeader
    └── prisma/          # PrismaService (global)
```

## Request lifecycle

1. **CORS** — Allowed origins: `http://localhost:5173`, `https://hrdashboardai.netlify.app`. OPTIONS returns 204; preflight is not blocked by JWT (public routes + guard skip).
2. **ValidationPipe** (global) — `whitelist`, `transform`, `forbidNonWhitelisted`.
3. **AtGuard** (global `APP_GUARD`) — Passport `jwt` strategy unless `@MyPublic()`.
4. **RolesGuard** (per-controller) — On `UsersController` and write ops on `EmployeesController`; checks `req.user.role` vs `@Roles()`.

## Authentication model

| Token | Header | Secret env | TTL (code) |
|-------|--------|------------|------------|
| Access | `Authorization: Bearer <access_token>` | `AT_SECRET` | 5 minutes |
| Refresh | `Authorization: Bearer <refresh_token>` on `POST /auth/refresh` only | `RT_SECRET` | 30 days |

Refresh tokens are **hashed in DB** (`hashedRefreshToken`). Logout clears that hash.

**Public routes:** `AppController`, all `AuthController` endpoints except `logout`.

## Database (Prisma)

- **Users** — UUID, `UserRole` (ADMIN | SUPER_ADMIN), `ApprState` (VERIFIED | NOT_VERIFIED).
- **Employees** — Integer `id`, rich HR metrics, FKs to lookup tables.
- **Vacation_Request** — `approval_status` 0/1/2 (pending/approved/rejected).
- **Attendance_Logs** — check-in/out per employee + shift.
- Generated client: `generated/prisma/`.

## Swagger / OpenAPI

| Environment | UI | JSON |
|-------------|-----|------|
| Local (`npm run start:dev`) | `/docs` | `/docs-json` |
| Vercel | `/docs` | `/docs-json` |

**Do not** mount Swagger under `/api/*` on Vercel — that path is reserved for the serverless function.

Static export: `swagger-spec.json` (regenerated on bootstrap).

## Serverless (Vercel)

- `vercel.json` rewrites all traffic to `api/index.ts`.
- Nest app is created once per warm instance (`cachedServer`).
- `configureApp()` matches local behavior (Swagger at `/docs`, same CORS rules).

## Security notes

- `GET /users` returns full Prisma `Users` rows (may include `hashedPassword`) — frontend should not display; consider stripping in a future mapper.
- `PATCH /vacations/:id/process` accepts `adminId` in body instead of JWT `sub` — audit risk.
- No global `{ success, data }` wrapper — responses are raw JSON (see `COMPLETE_API_REFERENCE.md`).

## Module dependencies

- `UsersModule` imports `AuthModule` (password hashing).
- All feature modules import `PrismaModule` (global).
