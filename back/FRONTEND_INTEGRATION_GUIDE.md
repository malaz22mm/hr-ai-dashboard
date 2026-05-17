# Frontend Integration Guide

Target frontend: Vite app on `http://localhost:5173` / Netlify `https://hrdashboardai.netlify.app` (CORS already allowed).

---

## Base URL

```ts
const API_BASE =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
```

On Vercel, set `VITE_API_URL` to the deployment origin (e.g. `https://your-api.vercel.app`). Routes are at the **root**, not under `/api`.

---

## Swagger

| | URL |
|---|-----|
| Interactive UI | `{API_BASE}/docs` |
| OpenAPI JSON | `{API_BASE}/docs-json` |
| Static file | `swagger-spec.json` in repo (regenerate via server bootstrap) |

**Fixed:** Local dev previously documented `/api/docs`; both local and Vercel now use **`/docs`**.

---

## Auth client pattern

```ts
type Tokens = { access_token: string; refresh_token: string };

async function signIn(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/local/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  if ('verificationId' in data) {
    // redirect to OTP screen with data.verificationId
    return data;
  }
  saveTokens(data as Tokens);
  return data;
}

async function refreshTokens(): Promise<Tokens> {
  const rt = getRefreshToken();
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${rt}` },
  });
  if (!res.ok) throw await res.json();
  const tokens = await res.json();
  saveTokens(tokens);
  return tokens;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${getAccessToken()}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  if (res.status === 401) {
    await refreshTokens();
    headers.set('Authorization', `Bearer ${getAccessToken()}`);
    res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  }
  return res;
}
```

Store tokens in memory + `sessionStorage` or secure cookie strategy of your choice.

---

## Endpoints checklist for dashboard

| Feature | Call |
|---------|------|
| Login | `POST /auth/local/signin` |
| OTP | `POST /auth/verify` with `{ userId, code }` — code is **5 digits** |
| Resend OTP | `POST /auth/resend-verification-code` |
| Employee table | `GET /employees?skip=&take=&...filters` |
| Charts | `GET /employees/stats?groupBy=department_id` |
| Form dropdowns | `GET /lookups/*` (all require auth) |
| Attendance punch | `POST /attendance/punch` body `{ empId }` |
| Vacation submit | `POST /vacations` with DTO fields (camelCase) |
| Admin vacations | `GET /vacations?status=0` |
| Approve/reject | `PATCH /vacations/:id/process` |

---

## Common frontend mistakes

1. **Wrong Swagger URL** — Use `/docs`, not `/api/docs`.
2. **Employee delete ID** — Use numeric id (`42`), not UUID. **Was broken server-side** (UUID pipe); now fixed.
3. **`groupBy` value** — Send `department_id`, not `department`.
4. **`sortBy` value** — Use snake_case Prisma fields (`monthly_income`).
5. **Refresh header** — Send **refresh** token to `/auth/refresh`, not access token.
6. **Sign-in body** — Provide `email` **or** `phone`, not both required.
7. **Verification response** — Sign-in may return `{ verificationId, message }` instead of tokens; handle before storing JWT.
8. **204 responses** — `logout`, `resend-verification-code`, `reset-password` have **no JSON body**.
9. **Users API** — Requires `SUPER_ADMIN` role in JWT; `ADMIN` gets 403.
10. **Employee writes** — `POST`/`PUT`/`DELETE /employees` require `SUPER_ADMIN`.
11. **Query filter dead keys** — `minAbsenceRatio`, `minAbsenceDaysLastMonth`, etc. are accepted by validation but **not applied** in service (no DB columns). Do not rely on them until implemented.
12. **Vacation `adminId`** — Must send admin UUID in body today; prefer wiring from JWT `sub` on backend later.
13. **Users list leaks hashes** — Do not bind `hashedPassword` to UI; map to safe fields client-side.
14. **CORS PATCH** — Vacation approve uses `PATCH`; ensure preflight allows PATCH (serverless config includes it).

---

## Response shape (no global envelope)

Success bodies are **direct** JSON:

- Lists: raw arrays or `{ data, meta }` for employees
- Auth: `{ access_token, refresh_token }`
- Errors: Nest `{ statusCode, message, error }`

Do **not** expect `{ success: true, data: ... }` unless you add a frontend adapter layer.

---

## Deployment notes

- Run `npm run vercel-build` before deploy.
- Cold starts: first request may take several seconds.
- Health check: `GET /health` (public).
- OPTIONS: handled by Nest CORS; no Authorization header needed.

---

## Suggested env (frontend)

```env
VITE_API_URL=http://localhost:3000
```

Production:

```env
VITE_API_URL=https://your-vercel-deployment.vercel.app
```
