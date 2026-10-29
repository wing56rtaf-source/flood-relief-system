# Project brief: Flood Relief System

## Goal
Build a web application that helps staff manage requests for flood assistance. Staff can create and manage cases, record geospatial location and assistance needs, and coordinate follow-up. A public intake path for affected people is desired but must be hidden and disabled by default until enabled by an authorized setting.

## User-confirmed requirements
- Staff authentication with role-based access control; the group later settled on `STAFF` and `ADMIN` roles.
- Use OpenStreetMap for the map/location workflow.
- Public intake must be switchable through environment/admin settings and remain off by default. When off, direct public page/API access should return 404 (confirmed in the team's AC).
- Continue work across the full team; the group included Product PM, Architect, UI/UX Designer, Full-Stack Engineer, QA, and Security/DevSecOps.

## Functional scope captured in the group
### Staff portal
- Create, read, update, and manage relief cases.
- Capture latitude/longitude using an interactive map picker; staff can search/filter cases and see them on a dashboard/map.
- Track status: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`.
- Track urgency: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`; record reporter name/contact, number of people, needed supplies, description, and address/location detail.
- Login and role checks; staff must not access admin-only settings.
- Mask phone numbers in list/API responses; reveal full PII only on a case detail action with audit logging.

### Public intake (feature-gated)
- Mobile-first form for affected people, with browser geolocation and a confirmation/reference ID.
- Use server-side feature gating for both page and API; default off, no discoverable links when disabled.
- Apply input validation, safe output handling, and abuse protection. The team discussed a limit of 5 requests/minute/IP.

## Data model in the current source
`prisma/schema.prisma` currently defines `User`, `ReliefCase`, `SystemSetting`, and `AuditLog`, plus enums for roles, urgency, status, and source. Review this schema before extending it: the actual file stores `itemsNeeded` as a JSON string and currently lacks fields/relations for some workflows claimed in chat.

## Team-reported delivery status (from the transcript)
- Sprint 1: Staff portal/security baseline reported delivered; team said QA and security approved.
- Sprint 2: Public intake and rate limiting reported delivered; team said test scenarios TS-15–TS-18 and security review passed.
- Product PM announced a full-system release.

Treat the above as reported statements only. See `docs/VERIFICATION_NOTES.md` for the local artifact audit and items requiring real verification.
