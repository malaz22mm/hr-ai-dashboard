# Frontend Runtime Risks

This document lists **frontend-observable risks** derived from the backend documentation set. Treat each as something the UI and API client must **tolerate or explicitly handle**.

---

## 1. Contract vs runtime shape

| Risk | Detail | Mitigation |
|------|--------|------------|
| Employee list rows | OpenAPI `EmployeeEntity` omits relation includes (`Department`, etc.) but examples show nested objects | Type responses as base + optional `Record<string, unknown>` or explicit relation fields; guard access. |
| User list payload | Architecture: `GET /users` may return Prisma rows including **`hashedPassword`**; Swagger `UserResponseDto` does not show it | Strip sensitive keys before state/render; never log raw response. |
| `phone` typing | Swagger marks `phone` as `object` | Parse as `unknown`; display with string coercion if needed. |

---

## 2. Authentication and session

| Risk | Detail | Mitigation |
|------|--------|------------|
| Short access TTL | Access JWT ~**5 minutes** (architecture) | Expect frequent **401** if no proactive refresh; implement refresh-on-401 + optional timer. |
| Refresh rotation | Old refresh invalidated on each refresh | Never run parallel refresh calls; **mutex** required. |
| Refresh failure semantics | Swagger uses **403** for bad refresh (not necessarily 401) | Clear session on **403** for refresh endpoint and on repeated auth failures. |
| Sign-in 403 | Cooldown / rate behaviors documented on auth | Show user-friendly message; do not assume only 401/400. |
| Unverified sign-in | **200** with `{ verificationId }` instead of error | Branch **before** storing tokens. |
| Logout body | **204** no content | Skip `res.json()`. |

---

## 3. HTTP semantics and parsing

| Risk | Detail | Mitigation |
|------|--------|------------|
| Multiple 204 endpoints | Logout, resend code, request reset, reset password, some DELETEs | Central helper: `if (res.status === 204) return`. |
| Error body variance | `message` may be `string` or `string[]` | Normalize to string array for UI. |
| Non-JSON errors | Proxies/serverless may return HTML on 502 | `try/catch` around `res.json()`; fallback message. |

---

## 4. CORS, methods, and deployment

| Risk | Detail | Mitigation |
|------|--------|------------|
| Allowlist mismatch | CORS lists localhost:5173 and one Netlify host | New frontend origins (Vercel URL, previews) need backend allowlist updates or **502/CORS** failures. |
| PATCH preflight | Vacation processing uses **PATCH** | Ensure no proxy strips OPTIONS/PATCH; surface preflight failures clearly. |
| Cold starts | Vercel/serverless: first request slow | Timeouts + retry policy for idempotent GETs only; UX loading state. |
| `/swagger-spec.json` status | Docs disagree on **302 vs 200** | If fetching static spec from live server, accept redirect or follow `Location`. |

---

## 5. Authorization and product logic

| Risk | Detail | Mitigation |
|------|--------|------------|
| ADMIN vs SUPER_ADMIN | Users CRUD and employee writes need **SUPER_ADMIN** | Hide routes/buttons for ADMIN; still handle **403** if JWT stale. |
| Vacation `adminId` | Body must match a user UUID; not tied to JWT in docs | Use logged-in user’s id from JWT `sub` on client — **trust risk** if backend does not verify equality; document for stakeholders. |
| Employee delete path | Historically buggy with UUID (per integration guide) | Keep integration tests on **integer** id paths. |

---

## 6. Query parameters and filters

| Risk | Detail | Mitigation |
|------|--------|------------|
| Dead query keys | Some validated filters **not applied** in service (e.g. absence-related) | Do not build product promises on those filters until backend confirms. |
| sortBy confusion | Must be **snake_case** DB field | Central allowlist or mapping from UI column keys to API `sortBy`. |
| groupBy confusion | Must be enum of `_id` suffix fields | Same as above — no friendly names. |
| Boolean query serialization | `attrition`, `gender`, `overTime` as booleans in Swagger | Ensure `fetch` query strings serialize as `true`/`false` as Nest expects. |

---

## 7. Data integrity and UX edge cases

| Risk | Detail | Mitigation |
|------|--------|------------|
| Vacation overlap | Server returns **400** on overlap | Surface validation message. |
| OTP / reset cooldown | **403** responses | Backoff UI; disable resend button temporarily. |
| Stats math | Aggregates are averages client displays | Handle `null`/missing fields as “N/A”. |

---

## 8. Security / privacy

| Risk | Detail | Mitigation |
|------|--------|------------|
| Sensitive fields in responses | Password hashes, internal ids | Strip before rendering; avoid exporting debug JSON. |
| JWT in localStorage | If used, XSS steals tokens | Prefer memory + sessionStorage tradeoffs; CSP and sanitization if persisting. |
| `adminId` spoofing | API accepts arbitrary admin UUID | Product decision; frontend should at least send **current user** id consistently. |

---

## 9. Documentation-only assumptions (unverified without source)

- Exact JWT claim names beyond examples (`sub`, `email`, `role` in sample payload).  
- Whether rate limits exist on auth endpoints.  
- Idempotency of punch or duplicate vacation creation beyond “overlap” checks.  
- Time zone interpretation for attendance `check_in` / date-only vacation strings.

**Rule:** When behavior is unclear, prefer **defensive parsing**, **user-visible error fallback**, and **server message passthrough**.
