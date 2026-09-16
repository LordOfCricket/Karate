# Security Strategy

## Implemented in Phase 1

- **Password storage**: bcrypt, cost factor 12 (`apps/api/src/modules/auth/auth.service.ts`). Never
  plaintext, never reversible encryption.
- **Authentication**: short-lived JWT access tokens (15 min default) + longer-lived refresh tokens,
  both HMAC-signed with separate secrets (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, each validated
  ≥32 chars at startup by `@karate/config`). Login failure paths return the same generic message
  whether the email doesn't exist or the password is wrong, to avoid user enumeration.
- **Authorization is always server-side**: role claims come only from the verified JWT
  (`middleware/auth.ts`), never from a client-supplied header/body field. Organization-scoped actions
  additionally verify DB-backed membership (`requireAcademyAdministrator`) — see
  `03-role-permission-model.md` for why the role check alone is insufficient (IDOR/BOLA).
- **Input validation**: every mutating route validates its body/query/params against a zod schema
  from `@karate/validation` before the controller runs (`middleware/validate.ts`); invalid input never
  reaches a service function.
- **Rate limiting**: applied to `/auth/login` (10 requests/minute per IP) as a brute-force mitigation.
  Documented as in-memory/single-instance only in Phase 1 — see the limitation note in
  `middleware/rateLimit.ts`.
- **Secure HTTP headers**: `helmet()` on every response; `x-powered-by` disabled.
- **CORS**: explicit allow-list from `CORS_ALLOWED_ORIGINS`, not a wildcard.
- **Secrets handling**: all secrets come from environment variables, validated and typed at startup
  (`@karate/config`); `.env` is git-ignored, `.env.example` documents required keys without real
  values.
- **Safe logging**: `@karate/logger` redacts `password`, `passwordHash`, tokens, `authorization`
  headers, cookies, and medical-related fields at any nesting depth, in every log line, by
  configuration rather than by trusting each call site to remember.
- **PII / medical data minimization**: `MedicalClearance` stores a status and a document reference
  only — never raw medical detail — by schema design (see `05-belt-grading-architecture.md`'s sibling
  principle applied to `registrations.prisma`).
- **Audit trail**: `AuditLog` is append-only and schema-ready; `TournamentStatusHistory` and
  `ScoreEvent` are append-only ledgers for their respective domains.
- **Safe error responses**: see `09-error-handling-strategy.md` — no stack traces, SQL, or internal
  paths ever reach a client, verified by smoke test.

## Explicitly NOT implemented in Phase 1 (do not assume otherwise)

- Refresh-token rotation/revocation (a refresh token is issued but there is no revoke-on-logout or
  reuse-detection endpoint yet).
- Email verification enforcement (the column exists; nothing currently requires it before login).
- Distributed rate limiting (Redis-backed) — required before running more than one API instance.
- CSRF protection (not yet relevant — Phase 1 has no cookie-based session; revisit if session cookies
  are introduced instead of bearer tokens).
- Dependency/SAST scanning in CI (no CI pipeline exists yet in Phase 1).
- Field-level encryption at rest for sensitive columns.

## Threat model notes worth carrying into later phases

- Once `OfficialAssignment`-gated scoring endpoints exist, every `ScoreEvent` write must verify the
  acting user holds an active assignment for that specific bout's tournament/tatami — the same
  event-level authorization pattern as `requireAcademyAdministrator`, applied one level deeper.
- `sportsHubIdentityId` being unique-but-nullable means two `User` rows can never claim the same
  external identity, which matters once SportsHub becomes the identity source of truth.
