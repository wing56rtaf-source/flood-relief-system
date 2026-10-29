# Hermes Software House — Antigravity handoff

This bundle contains the complete event history for the Hermes group **Hermes Software House**, the source files currently present for its project, and a structured continuation brief for Antigravity.

## Project
**Flood Relief System** — a web app for staff to register flood-relief cases with location and assistance details, plus a public intake flow for affected people that must remain hidden/disabled until explicitly enabled.

## What is included
- `flood-relief-system/`: all files currently present in the local project folder at export time.
- `transcript/group-transcript.md`: readable, full group conversation; Thai messages and code snippets are preserved.
- `export/events.json`: every room event in sequence (94 events, including message, settled, failure, and room activity events).
- `export/room.json`: room metadata and roster.
- `docs/PROJECT_BRIEF.md`: requirements, scope, and decisions confirmed in the group.
- `docs/NEXT_TASKS.md`: prioritized continuation backlog.
- `docs/VERIFICATION_NOTES.md`: what is claimed in chat versus what was verified from the local files.
- `ANTIGRAVITY_PROMPT.md`: suggested first prompt for continuing the work.

## Important verification note
The group transcript records Sprint 1 and Sprint 2 as delivered and QA/security-approved. That is the team's **chat-reported status**, not independent proof that a runnable application or those test results exist. The exported project folder currently contains only a Prisma schema, middleware/auth helper files, and test-plan / verification files; it has no `package.json`, app routes/pages, dependency lockfile, or Git metadata. Start by auditing the files and implementing/validating the missing application before treating it as production-ready.

No Hermes database, credentials, `.env`, or unrelated user data is included. The Hermes room database was read-only during export.
