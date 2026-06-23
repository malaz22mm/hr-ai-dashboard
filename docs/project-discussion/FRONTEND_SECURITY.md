# Routing and Security — HR Dashboard Frontend

Client-side **route guards**, **role checks**, and **defense limits** (what the UI does *not* guarantee).

---

## 1. Route map (`App.tsx`)

| Path | Guard | Purpose |
|------|-------|---------|
| `/login` | None | Sign-in |
| `/verify` | None | OTP / email verification |
| `/forgot-password` | None | Password reset flow (public endpoints) |
| `/`, `/employees`, `/employees/:id`, `/reports`, `/settings` | `ProtectedRoute` | Authenticated app |
| `/users` | `ProtectedRoute` + `RequireRole ['SUPER_ADMIN']` | User admin |
| `*` | — | Redirect to `/` |

All authenticated routes render inside **`MainLayout`** (sidebar + navbar + `<Outlet />`).

---

## 2. `ProtectedRoute`

**Source:** `src/routes/ProtectedRoute.tsx`

1. **`useEffect`** calls **`initializeAuth()`** once (dependency: stable store action).
2. While **`isLoading`**, shows full-page spinner.
3. When loaded and **`!isAuthenticated`**, **`navigate('/login', { replace: true })`**.
4. If authenticated, render **`children`**.

**What it protects:** **Accidental access** to shell UI without tokens. It does **not** encrypt data or stop users from manually calling the API with stolen tokens.

---

## 3. `RequireRole`

**Source:** `src/routes/RequireRole.tsx`

```tsx
if (!role || !allow.includes(role)) {
  return <Navigate to={fallbackPath} replace />
}
```

- **`allow`:** readonly tuple of `'ADMIN' | 'SUPER_ADMIN'`.
- **`/users`** uses **only** `SUPER_ADMIN`, matching backend `GET /users` requirement.

**Gap:** An `ADMIN` user could still **guess `/users`** before React hydrates; they immediately get redirected home. Server still returns **403** if they craft HTTP requests.

---

## 4. Sidebar role filtering

**Source:** `src/components/Sidebar.tsx`

- Navigation array includes `{ label: 'Users', to: '/users', superAdminOnly: true }`.
- **Filter:** show link if **`!superAdminOnly`** OR **`role === 'SUPER_ADMIN'`**.

**Consistency:** Matches `RequireRole` on the route.

---

## 5. Navbar auth logic

**Source:** `src/components/Navbar.tsx`

- Reads **`email`** and **`role`** from store for display.
- **Logout:** `await logout()` then **`navigate('/login')`**.

**Search input:** Presentational only — does not query API globally (no cross-page search service).

---

## 6. SUPER_ADMIN restrictions (UI vs API)

| Action | Backend (reference) | UI behavior |
|--------|---------------------|-------------|
| `GET/POST/DELETE /users` | SUPER_ADMIN | Route + sidebar gated |
| `POST/PUT/DELETE /employees` | SUPER_ADMIN | Buttons visible to all authenticated users on Employees page; **403** possible for ADMIN |

**Risk:** **Confusing UX** for ADMIN — they see “Add / Delete” but may fail on submit. Improvement: hide destructive controls when `role !== 'SUPER_ADMIN'`.

---

## 7. Route guards summary

| Layer | Mechanism |
|-------|-----------|
| Router | Nested routes under `ProtectedRoute` |
| Role | `RequireRole` + sidebar filter |
| API | Nest `AtGuard` + `RolesGuard` |

**Unauthorized handling:**

- **401:** refresh flow; failure → session clear / login redirect (axios) or thrown error (fetch).
- **403:** `getApiErrorMessage` maps to human text for some cases.

---

## 8. JWT role trust boundary **Clients decode `role` for:**

- Showing Users link
- Display in navbar
- `RequireRole` redirect

**Attack model:** A modified JWT in **localStorage** could fool the UI until the server rejects requests (signature would fail on server). Client-side decode is **not** a security boundary.

---

## 9. CORS and credentials

`httpClient` sets **`credentials: 'include'`**. Effective CORS behavior is **server-controlled** (`back/BACKEND_ARCHITECTURE.md` lists allowed origins). Frontend must deploy to an **allowed origin** or browser will block responses.

---

## 10. Sensitive data exposure (frontend mitigation)

| Area | Mitigation | Status |
|------|------------|--------|
| Users list | `sanitizeUsersResponse` in `usersApi` | **Not** used by `UsersList` (uses `fetchUsers`) |
| Tokens | Stored in web storage | XSS can exfiltrate — standard SPA risk; mitigate with CSP, dependency hygiene |

---

## 11. Session fixation / CSRF

- **Bearer tokens in storage** — CSRF on `Authorization` header is typically **lower** than cookie-only sessions; `credentials: include` may still send cookies if backend sets any — confirm server behavior separately.
- **Logout** should ideally run on **shared computers** — sessionStorage mode helps.

---

## 12. Strengths for defense talking points

- **Mutex-backed refresh** reduces token race logout storms.
- **Explicit public-route flags** prevent refresh loops on auth endpoints.
- **`RequireRole`** mirrors backend SUPER_ADMIN requirement for `/users`.

---

## 13. Weaknesses to acknowledge

- **UI does not hide** super-admin-only employee mutations for ADMIN.
- **Users API** consumer should **always sanitize** (`usersApi` pattern).
- **No Content-Security-Policy** configuration in repo (deployment concern).
