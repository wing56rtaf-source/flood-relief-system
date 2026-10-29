import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  hashPassword,
  verifyPassword,
  maskPhoneNumber,
  sanitizeText,
  generateSessionToken,
  verifySessionToken,
} from '../src/lib/auth.js';

import * as LoginRoute from '../src/app/api/auth/login/route.js';
import * as StaffCasesRoute from '../src/app/api/staff/cases/route.js';
import * as StaffCaseDetailRoute from '../src/app/api/staff/cases/[id]/route.js';
import * as AdminSettingsRoute from '../src/app/api/admin/settings/route.js';
import * as PublicCasesRoute from '../src/app/api/public/cases/route.js';

const prisma = new PrismaClient();

describe('Flood Relief System - Automated Verification Suite (TS-01 to TS-18)', () => {
  let adminUser;
  let staffUser;
  let testCaseId;

  before(async () => {
    // Ensure test admin and staff exist
    const adminPass = await bcrypt.hash('admin1234', 10);
    const staffPass = await bcrypt.hash('staff1234', 10);

    adminUser = await prisma.user.upsert({
      where: { username: 'test_admin' },
      update: { passwordHash: adminPass, role: 'ADMIN' },
      create: {
        username: 'test_admin',
        name: 'Test Administrator',
        passwordHash: adminPass,
        role: 'ADMIN',
      },
    });

    staffUser = await prisma.user.upsert({
      where: { username: 'test_staff' },
      update: { passwordHash: staffPass, role: 'STAFF' },
      create: {
        username: 'test_staff',
        name: 'Test Staff',
        passwordHash: staffPass,
        role: 'STAFF',
      },
    });

    // Reset feature flag to false initially
    await prisma.systemSetting.upsert({
      where: { key: 'ENABLE_PUBLIC_INTAKE' },
      update: { value: 'false' },
      create: { key: 'ENABLE_PUBLIC_INTAKE', value: 'false' },
    });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  // ----------------------------------------------------
  // Unit & Core Security Helpers
  // ----------------------------------------------------
  describe('Security Baseline: Password Hashing, JWT & PII Masking', () => {
    test('Password Hashing: Uses bcrypt with per-user salt and verify', async () => {
      const plain = 'secret_pass_123';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      // Verify per-password salts produce different hashes
      assert.notEqual(hash1, hash2, 'Bcrypt salts should make identical passwords have distinct hashes');
      assert.equal(await verifyPassword(plain, hash1), true);
      assert.equal(await verifyPassword('wrong_pass', hash1), false);
    });

    test('TS-03: Phone Number Backend Masking helper', () => {
      assert.equal(maskPhoneNumber('0811234567'), '081-XXX-4567');
      assert.equal(maskPhoneNumber('0812223333'), '081-XXX-3333');
      assert.equal(maskPhoneNumber('021234567'), '02-XXX-4567');
      assert.equal(maskPhoneNumber('123'), 'XXX-XXX-XXXX');
      assert.equal(maskPhoneNumber(''), '');
    });

    test('TS-17: Text sanitization escapes HTML and script tags to prevent Stored XSS', () => {
      assert.equal(sanitizeText('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
      assert.equal(sanitizeText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
      assert.equal(sanitizeText('ต้องการน้ำดื่ม 5 แพ็ค'), 'ต้องการน้ำดื่ม 5 แพ็ค');
    });

    test('TS-11: Session JWT generation and tamper rejection', () => {
      const payload = { userId: staffUser.id, username: staffUser.username, name: staffUser.name, role: 'STAFF' };
      const token = generateSessionToken(payload);
      assert.ok(token, 'Token must be generated');

      const verified = verifySessionToken(token);
      assert.equal(verified?.username, staffUser.username);
      assert.equal(verified?.role, 'STAFF');

      // Tampered token must fail
      const tampered = token.slice(0, -5) + 'xxxxx';
      assert.equal(verifySessionToken(tampered), null);
    });
  });

  // ----------------------------------------------------
  // Authentication & Brute-force (TS-12, TS-13)
  // ----------------------------------------------------
  describe('Authentication & Account Lockout', () => {
    test('TS-12: Brute-force protection locks out after 5 consecutive failed attempts', async () => {
      const uniqueUsername = `brute_test_${Date.now()}`;

      // 5 failed attempts
      for (let i = 1; i <= 5; i++) {
        const req = new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.99' },
          body: JSON.stringify({ username: uniqueUsername, password: 'wrong_password' }),
        });
        const res = await LoginRoute.POST(req);
        assert.equal(res.status, 401, `Attempt ${i} should be 401`);
      }

      // 6th attempt must be 429 Account Locked
      const req6 = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.99' },
        body: JSON.stringify({ username: uniqueUsername, password: 'wrong_password' }),
      });
      const res6 = await LoginRoute.POST(req6);
      assert.equal(res6.status, 429);
      const data6 = await res6.json();
      assert.equal(data6.error, 'ACCOUNT_LOCKED');
    });

    test('TS-13: Successful login sets HttpOnly session_token cookie', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test_staff', password: 'staff1234' }),
      });
      const res = await LoginRoute.POST(req);
      assert.equal(res.status, 200);

      const setCookie = res.headers.get('set-cookie');
      assert.ok(setCookie, 'Set-Cookie header must be present');
      assert.ok(setCookie.includes('session_token='), 'Must include session_token');
      assert.ok(setCookie.toLowerCase().includes('httponly'), 'Must be HttpOnly');
    });
  });

  // ----------------------------------------------------
  // Staff Case Management & PII (TS-01, TS-03, TS-04, TS-09)
  // ----------------------------------------------------
  describe('Staff Case Management & Privacy', () => {
    test('TS-01: Create case with map coordinates and default status PENDING', async () => {
      const req = new Request('http://localhost/api/staff/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': staffUser.id,
          'x-user-role': 'STAFF',
        },
        body: JSON.stringify({
          reporterName: 'นายประสิทธิ์ สุขใจ',
          phoneNumber: '0812345678',
          peopleCount: 4,
          urgency: 'HIGH',
          itemsNeeded: ['น้ำดื่ม', 'ยารักษาโรค'],
          latitude: 7.0085,
          longitude: 100.4725,
          addressDetail: 'ใกล้สะพานท่าเคียน ชุมชนริมคลองอู่ตะเภา อ.หาดใหญ่ จ.สงขลา',
          description: 'ระดับน้ำสูงเข้าบ้าน ต้องการเรือลำเลียง',
        }),
      });

      const res = await StaffCasesRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.case.id);
      assert.equal(data.case.status, 'PENDING');
      assert.equal(data.case.latitude, 7.0085);
      assert.equal(data.case.longitude, 100.4725);
      assert.equal(data.case.peopleCount, 4);

      testCaseId = data.case.id;
    });

    test('TS-04: Reject cases with non-positive people count (peopleCount < 1)', async () => {
      const req = new Request('http://localhost/api/staff/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: 'ทดสอบคนศูนย์',
          phoneNumber: '0899999999',
          peopleCount: 0,
          latitude: 7.012,
          longitude: 100.478,
        }),
      });

      const res = await StaffCasesRoute.POST(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'INVALID_PEOPLE_COUNT');
    });

    test('TS-03: List API masks phone number at backend response level', async () => {
      const req = new Request('http://localhost/api/staff/cases', {
        headers: { 'x-user-id': staffUser.id, 'x-user-role': 'STAFF' },
      });
      const res = await StaffCasesRoute.GET(req);
      assert.equal(res.status, 200);
      const cases = await res.json();
      assert.ok(Array.isArray(cases));

      const found = cases.find((c) => c.id === testCaseId);
      assert.ok(found, 'Created test case must be in list');
      assert.equal(found.phoneNumber, '081-XXX-5678', 'Phone must be masked in list view');
    });

    test('TS-09: Unmask full PII on detail route and generate Audit Log', async () => {
      const req = new Request(`http://localhost/api/staff/cases/${testCaseId}`, {
        headers: {
          'x-user-id': staffUser.id,
          'x-user-role': 'STAFF',
          'x-forwarded-for': '192.168.1.50',
        },
      });

      const res = await StaffCaseDetailRoute.GET(req, { params: { id: testCaseId } });
      assert.equal(res.status, 200);
      const detail = await res.json();
      assert.equal(detail.phoneNumber, '0812345678', 'Detail view should reveal unmasked phone');

      // Verify Audit Log was recorded in DB
      const log = await prisma.auditLog.findFirst({
        where: {
          action: 'UNMASK_FULL_PII',
          targetId: testCaseId,
        },
      });
      assert.ok(log, 'AuditLog entry must be created when PII is unmasked');
      assert.equal(log.userId, staffUser.id);
      assert.equal(log.ipAddress, '192.168.1.50');
    });
  });

  // ----------------------------------------------------
  // RBAC & Admin Settings (TS-08, TS-14)
  // ----------------------------------------------------
  describe('RBAC & Dynamic Feature Flag', () => {
    test('TS-08: Staff role is restricted from Admin Settings (403 Forbidden)', async () => {
      const req = new Request('http://localhost/api/admin/settings', {
        headers: { 'x-user-id': staffUser.id, 'x-user-role': 'STAFF' },
      });
      const res = await AdminSettingsRoute.GET(req);
      assert.equal(res.status, 403);
    });

    test('TS-08: Admin role can read Admin Settings and Audit Logs', async () => {
      const req = new Request('http://localhost/api/admin/settings', {
        headers: { 'x-user-id': adminUser.id, 'x-user-role': 'ADMIN' },
      });
      const res = await AdminSettingsRoute.GET(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.settings);
      assert.ok(Array.isArray(data.auditLogs));
    });

    test('TS-14: Admin can dynamically toggle ENABLE_PUBLIC_INTAKE feature flag', async () => {
      const req = new Request('http://localhost/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminUser.id,
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ key: 'ENABLE_PUBLIC_INTAKE', value: 'true' }),
      });

      const res = await AdminSettingsRoute.POST(req);
      assert.equal(res.status, 200);

      const dbSetting = await prisma.systemSetting.findUnique({
        where: { key: 'ENABLE_PUBLIC_INTAKE' },
      });
      assert.equal(dbSetting?.value, 'true');
    });
  });

  // ----------------------------------------------------
  // Public Intake Flow & Feature Guard (TS-02, TS-06, TS-17, TS-18)
  // ----------------------------------------------------
  describe('Public Intake: Feature Guard, Rate Limiting & Sanitization', () => {
    test('TS-02: Public intake returns 404 when feature flag is turned OFF', async () => {
      // Turn flag OFF
      await prisma.systemSetting.update({
        where: { key: 'ENABLE_PUBLIC_INTAKE' },
        data: { value: 'false' },
      });

      const req = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: 'ผู้ประสบภัยทดสอบ',
          phoneNumber: '0855554444',
          peopleCount: 1,
          latitude: 7.012,
          longitude: 100.478,
        }),
      });

      const res = await PublicCasesRoute.POST(req);
      assert.equal(res.status, 404, 'Must return 404 Not Found when flag is OFF');
    });

    test('TS-17 & TS-18: When flag is ON, accepts submission, sanitizes input, and returns Ref ID', async () => {
      // Turn flag ON
      await prisma.systemSetting.update({
        where: { key: 'ENABLE_PUBLIC_INTAKE' },
        data: { value: 'true' },
      });

      const req = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '172.16.0.5',
        },
        body: JSON.stringify({
          reporterName: '<script>alert("hacked")</script> สมคิด',
          phoneNumber: '0891234567',
          peopleCount: 2,
          urgency: 'CRITICAL',
          itemsNeeded: ['<script>xss</script>น้ำดื่ม'],
          latitude: 7.025,
          longitude: 100.475,
          addressDetail: 'ต.หาดใหญ่ อ.หาดใหญ่ จ.สงขลา <b>หมู่ 4</b>',
          description: '<img src=x onerror=alert(1)> น้ำท่วมสูง 1 เมตร',
        }),
      });

      const res = await PublicCasesRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();

      assert.ok(data.caseId, 'Must return caseId as tracking Ref ID (TS-18)');

      // Verify Stored XSS Sanitization in database (TS-17)
      const createdCase = await prisma.reliefCase.findUnique({
        where: { id: data.caseId },
      });
      assert.ok(createdCase);
      assert.ok(!createdCase.reporterName.includes('<script>'));
      assert.ok(createdCase.reporterName.includes('&lt;script&gt;'));
      assert.ok(!createdCase.description.includes('<img'));
      assert.ok(createdCase.description.includes('&lt;img'));
      assert.equal(createdCase.source, 'PUBLIC');
    });

    test('TS-06: Rate limiting blocks after 5 requests/min per IP (6th is 429)', async () => {
      const testIp = '198.51.100.25';

      // 5 allowed requests
      for (let i = 1; i <= 5; i++) {
        const req = new Request('http://localhost/api/public/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': testIp,
          },
          body: JSON.stringify({
            reporterName: `Spam Tester ${i}`,
            phoneNumber: '0810000000',
            peopleCount: 1,
            latitude: 7.015,
            longitude: 100.465,
          }),
        });

        const res = await PublicCasesRoute.POST(req);
        assert.equal(res.status, 201, `Submission ${i} should be accepted`);
      }

      // 6th request from same IP must be 429 Too Many Requests
      const req6 = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({
          reporterName: 'Spam Tester 6',
          phoneNumber: '0810000000',
          peopleCount: 1,
          latitude: 7.012,
          longitude: 100.478,
        }),
      });

      const res6 = await PublicCasesRoute.POST(req6);
      assert.equal(res6.status, 429, '6th request must trigger rate limit 429');
      const data6 = await res6.json();
      assert.equal(data6.error, 'TOO_MANY_REQUESTS');
    });
  });
});
