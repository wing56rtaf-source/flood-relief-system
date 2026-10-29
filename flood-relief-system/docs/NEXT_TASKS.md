# Continuation backlog for Antigravity

Prioritize implementation and verification over accepting the transcript's completion claims.

## P0 — Establish a runnable, auditable application
- [ ] Identify the intended framework/version and create the missing dependency manifest, lockfile, app entry points, and development scripts. Do not invent a production-ready status until `install`, `build`, and tests run.
- [ ] Add safe configuration documentation and `.env.example` (placeholders only); keep secrets out of the export and repository.
- [ ] Reconcile the Prisma schema with the flows: case fields, `itemsNeeded`, feature settings, staff/user relations, PII access logs, and indexes. Add migrations and seed only non-sensitive demo data.

## P0 — Authentication, authorization, privacy
- [ ] Replace `src/lib/auth.ts` password hashing (SHA-256 with a fixed source-code salt) with a modern password-hashing function such as Argon2id or bcrypt using per-password salts; add verification and migration/reset policy.
- [ ] Replace the current cookie-presence-only dashboard gate with cryptographically validated, expiring, revocable server-side sessions and role checks on every protected route/API.
- [ ] Implement account lockout/brute-force controls and secure cookie flags; test CSRF/session fixation/replay behavior.
- [ ] Ensure list APIs mask phone numbers server-side. Full PII reveal must be authorized and produce audit records; avoid logging PII or secrets.

## P0 — Core staff workflows
- [ ] Implement case CRUD APIs and UI, validation, status transitions, dashboard filters, and OpenStreetMap/Leaflet map picker.
- [ ] Test case coordinates, data validation, empty/loading/error states, and non-positive people-count rejection.

## P1 — Public intake, deliberately off by default
- [ ] Implement the mobile-first `/report` flow, geolocation allow/deny handling, submission confirmation/reference ID, and public case API.
- [ ] Enforce one authoritative feature flag on both page and API; support environment/admin configuration as required, default `OFF`, and return 404 when disabled.
- [ ] Implement rate limiting on the server. The transcript's 5/minute/IP target uses an in-memory implementation claim; use a shared store (e.g. Redis) if multi-instance deployment is possible.
- [ ] Validate and safely encode all input/output; test HTML/XSS payload handling in database and rendered UI.

## P1 — QA and security verification
- [ ] Turn the scenarios in `flood-relief-system/tests/TEST_PLAN.md` into executable tests and run them. Preserve command output/results; do not rely on chat claims.
- [ ] Cover TS-01–TS-18 where applicable: cases/map, auth/RBAC, lockout/session safety, PII mask/audit, feature flag, rate limit, mobile/GPS, sanitization, and reference ID.
- [ ] Conduct a threat-model/security review before deployment. Confirm OWASP controls and data-retention/access policies for disaster-victim PII.

## P2 — Delivery
- [ ] Add deployment/runbook documentation, backups, database migration procedure, monitoring/audit retention, and a production readiness checklist.
- [ ] Document OpenStreetMap tile/service attribution and any operational limits.
