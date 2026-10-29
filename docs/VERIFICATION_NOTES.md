# Verification notes (export-time audit)

## Proven from Hermes records
- Source room: `Hermes Software House`, room ID `df3cd93e-75f8-4582-b1f1-70b9fc1cde1a`.
- The room event table contains **94 events**: 4 user messages, 31 member messages, 50 turn-settled events, 5 turn-failed events, and 4 room-activity events.
- The conversation contains four threads and includes the user's confirmations, all bot replies, status events, and one recorded Gemini model-format failure for the architect.
- The global Hermes Kanban database has zero task rows at export time. The group's work is recorded in its chat/event stream, not in that Kanban board.
- The project folder `C:\Users\W56-IT-PC69-01\flood-relief-system` exists and contains 11 files across `prisma/`, `src/`, and `tests/`.
- The folder has no `.git` metadata and no package manifest, app pages/routes, or dependency lockfile in the exported file listing. It therefore is not independently runnable as-is.

## Source-level concerns to resolve
- `src/lib/auth.ts` hashes passwords with SHA-256 and a fixed literal salt in source. This is not suitable password storage; replace with a standard adaptive password hashing algorithm and per-user salts.
- `src/middleware.ts` checks only whether a cookie named `session_token` exists before allowing dashboard paths. The inspected helper does not validate the token or enforce the user role. Add validated sessions and server-side authorization to every route/API.
- The current feature gate checks only `ENABLE_PUBLIC_INTAKE` in middleware. The user-confirmed requirement also asks for an admin setting; define a single safe source of truth and ensure it cannot be bypassed.
- Team chat claims included production code, test runs, QA approval, and security sign-off, but the local folder lacks the app infrastructure and executable test evidence. Verify each claim by running real tests after establishing a runnable project.
- The schema and requirements need reconciliation; review `prisma/schema.prisma` against the full conversation in `transcript/group-transcript.md`.

These notes are about the files and data inspected during export; they are not a complete security review.
