# Flood Relief System - QA Test Plan (Sprint 1)

## 1. Objectives
Verify the core functionality of the Staff Portal, Authentication, and Feature Flagging mechanisms. Ensure PII data is protected and system integrity is maintained.

## 2. Test Scenarios (Master List)

### Core Functionality (AC-01)
- **TS-01:** [Staff] Create case with Map Picker. Verify Lat/Long accuracy and default status `PENDING`.
- **TS-04:** [Edge] Reject cases with non-positive people count.
- **TS-05:** [UX] Geolocation accuracy on mobile viewports.

### Safety & Feature Guard (AC-02)
- **TS-02:** Access `/report` when `ENABLE_PUBLIC_INTAKE` is `OFF`. Expected: `404 Not Found`.
- **TS-14:** Real-time toggle impact. Active form submission must fail if flag is turned OFF.

### Authentication & RBAC
- **TS-07:** Redirect unauthenticated users from `/dashboard` to `/login`.
- **TS-08:** Role `STAFF` restricted from Admin Settings (`403 Forbidden`).
- **TS-11:** Session timeout and replay attack prevention.
- **TS-12:** Brute-force protection (Account lockout after 5 failed attempts).

### Data Privacy (PII) & Security
- **TS-03:** PII Masking on List API. Verify `phoneNumber` is masked at the Backend.
- **TS-09:** Audit Log generation upon 'Unmasking' PII.
- **TS-13:** Token storage verification (No JWT in localStorage, use HttpOnly cookies).
- **TS-06:** Rate Limiting on Public Intake API (5 reqs/min).

## 3. Tools & Environment
- **Framework:** Playwright (E2E), Jest/Supertest (API)
- **CI/CD:** Automated regression on PR to `main`

## Sprint 2 - Public Intake Form (Mobile-First)

### Mobile & UX
- **TS-15:** [Mobile UX] Verify sticky 'Submit' button and responsive layout on iPhone/Android viewports.
- **TS-16:** [Geolocation] Test Geolocation API integration. Mock "Allowed" and "Denied" states.
- **TS-18:** [UX] Verify Success State display with Case ID (Ref ID) after valid submission.

### API & Security (Public)
- **TS-06:** [Security] Verify Rate Limiting: 5 requests/min per IP. 6th request must return `429 Too Many Requests`.
- **TS-17:** [Security] Input Sanitization: Submit fields with HTML/Script tags (e.g. `<script>`) and verify they are escaped (e.g. `&lt;script&gt;`) in the database.
