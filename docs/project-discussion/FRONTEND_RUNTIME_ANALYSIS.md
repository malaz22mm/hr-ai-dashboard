# Runtime Risks & Edge Cases — HR Dashboard Frontend

How the SPA behaves under real-world friction (serverless, auth races, CORS, bad data), and **what mitigations exist in code today**.

---

## 1. Serverless cold starts (Vercel / Nest serverless)

**Symptom:** First `GET /employees` or auth call after idle **stalls** several seconds or times out.

**Mitigations in frontend:**

- Axios `timeout: 30_000` on `apiClient`.
- `refreshTokenPair` uses **`AbortSignal.timeout(45_000)`** — longer than axios default for refresh-only fetch.
- React Query retries **some 5xx** failures (when error is `ApiError` — mostly fetch path).

**Gaps:** Pages using **axios** may hit **30s timeout** on very cold functions; no automatic “retry once with backoff” on initial dashboard load.

**Talking point:** Pair frontend timeouts with **`GET /health`** readiness checks in CI/CD or status page — not implemented in UI.

---

## 2. 401 refresh races

**Symptom:** Many components mount and fire parallel requests with **expired access**; multiple refresh attempts could invalidate refresh token rotation.

**Mitigation:** **`refreshTokenPair` mutex** shared by fetch and axios.

**Residual risk:** Extremely rare deadlock if refresh hangs — user waits until abort timeout.

---

## 3. 403 on refresh or privileged routes

**Symptom:** `POST /auth/refresh` returns **403** (misconfigured token, revoked user, etc.).

**Behavior:**

- **Fetch:** throws `ApiError` → refresh path **catches** → **`emitSessionExpired`** → **`clearSession`**.
- **Axios:** refresh failure → **`emitSessionExpired`**, **clear storage**, **hard redirect `/login`**.

**403 on `/users` as ADMIN:** surfaced as user-facing string in **`getApiErrorMessage`**.

---

## 4. CORS

**Symptom:** Browser blocks responses if origin not allowed.

**Mitigation:** Backend docs list allowed origins (`localhost:5173`, Netlify dashboard URL). **Frontend must use matching deployment** or set **`VITE_API_URL`** to correct API host.

**PATCH preflight:** Vacation approve uses `PATCH` — integration guide mentions preflight must allow PATCH (server concern).

---

## 5. 204 responses

**Symptom:** Calling `res.json()` on **204** throws.

**Mitigation:**

- **`httpClient`** uses **`void`** mode for 204 or explicit `parse: 'void'`.
- **Axios** logout helper uses **`validateStatus`** for 204.

**Risk:** New endpoints returning 204 must be wired with same patterns.

---

## 6. “Dead” or ineffective filters

**Symptom:** UI sends query keys backend **accepts** but **does not apply** in Prisma service (integration guide: absence metrics filters).

**Mitigation:** None in UI — **documentation awareness**. Future: hide filters until backend implements.

---

## 7. User hash / sensitive field leaks

**Symptom:** `GET /users` includes **`hashedPassword`** per backend security notes.

**Mitigation:** **`sanitizeUsersResponse`** strips known sensitive keys — **only in `usersApi`**.

**Gap:** **`UsersList` uses `fetchUsers`** — may retain sensitive fields in memory. **Do not** add columns for password/hash; consider logging only safe fields.

---

## 8. Invalid / unexpected backend responses

**Examples:**

- HTML error page from proxy (502) — `readResponseBodyUnknown` returns string; errors degrade gracefully.
- **Non-array** JSON where array expected — `getJsonArray` / `normalizePaginatedEmployees` return **empty structures**.

**Trade-off:** UI may show **empty** rather than loud failure — good for demos, can **mask** production incidents.

---

## 9. Network failures and Prisma / DB outages

**Symptom:** 5xx or connection errors on lists.

**Mitigations:**

- React Query **retries** (for `ApiError` path).
- **Stats** try API then **fallback** to local aggregation over cached employee pages.
- **Lookup fetches** in `lookups.ts` catch and return `[]` — downstream mapping may degrade labels.

**Gap:** Dashboard bundle **fails entirely** if employee pages cannot load — user sees error alert.

---

## 10. Dual HTTP client divergence

**Symptom:** Fetch layer throws **`ApiError`**; Axios throws **`AxiosError`** — inconsistent retry and messaging.

**Mitigation:** **`getApiErrorMessage`** handles both for user-visible text in many screens.

**Long-term:** unify on one client or wrap axios with `ApiError`.

---

## 11. Client-side aggregation cost

**Symptom:** Loading **all employees** for dashboard scales **O(n)** requests and memory.

**Risk:** Performance degrades with headcount; mitigated only by **accepting slowness** or switching dashboard to **`GET /employees/stats`** + smaller samples.

---

## 12. Session storage vs localStorage

**Symptom:** **`sessionStorage`** mode loses session when tab closes — expected.

**Risk:** Users may think “keep me signed in” works — product copy could clarify.

---

## 13. Verification / token drift

**Symptom:** User verifies but must log in again (current `VerifyEmail` behavior).

**Risk:** **Perceived bug**; support burden. Not a security flaw.

---

## 14. Checklist for presenters

| Risk | Can you show mitigation in code? |
|------|----------------------------------|
| Refresh race | `refreshMutex.ts` |
| 204 parse | `httpClient` `void` mode |
| Nest errors | `normalizeErrorMessages` |
| SUPER_ADMIN users | `RequireRole` + sidebar |
| Sensitive user fields | `sanitize.ts` (`usersApi` path) |

| Risk | Honest gap |
|------|------------|
| Users list sanitization | `UsersList` / `fetchUsers` |
| Employee write buttons for ADMIN | UI should match backend role |
| Attendance / vacation features | Not implemented |
| Full-dataset dashboard | Performance at scale |

---

## 15. Related reading

- Backend operational notes: `back/FRONTEND_INTEGRATION_GUIDE.md` (cold starts, CORS, dead keys)
- API contract: `back/COMPLETE_API_REFERENCE.md`
