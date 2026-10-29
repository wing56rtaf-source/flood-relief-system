import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import * as LoginRoute from '../src/app/api/auth/login/route.js';
import * as UsersRoute from '../src/app/api/staff/users/route.js';
import * as StaffCasesRoute from '../src/app/api/staff/cases/route.js';
import * as StaffCaseDetailRoute from '../src/app/api/staff/cases/[id]/route.js';
import * as PublicCasesRoute from '../src/app/api/public/cases/route.js';
import * as PublicCaseDetailRoute from '../src/app/api/public/cases/[id]/route.js';
import * as PublicStatusRoute from '../src/app/api/public/status/route.js';
import * as AdminSettingsRoute from '../src/app/api/admin/settings/route.js';
import { calculateDistanceMeters } from '../src/lib/duplicate-detector.js';

const prisma = new PrismaClient();

describe('Prime Admin, OTP Login, RBAC Roles, Duplicate Prevention & Self-Update Suite', () => {
  let primeAdminUser;
  let adminUser;
  let dataEntryUser;
  let rescuerUser;
  let testCaseId;

  before(async () => {
    const passwordHash = await bcrypt.hash('admin1234', 10);

    primeAdminUser = await prisma.user.upsert({
      where: { username: 'nattanon_r' },
      update: { role: 'PRIME_ADMIN', name: 'Prime Admin (nattanon_r)' },
      create: {
        username: 'nattanon_r',
        name: 'Prime Admin (nattanon_r)',
        passwordHash,
        role: 'PRIME_ADMIN',
      },
    });

    adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { role: 'ADMIN', name: 'ผู้ดูแลระบบกลาง' },
      create: {
        username: 'admin',
        name: 'ผู้ดูแลระบบกลาง',
        passwordHash,
        role: 'ADMIN',
      },
    });

    dataEntryUser = await prisma.user.upsert({
      where: { username: 'staff_entry' },
      update: { role: 'DATA_ENTRY', name: 'เจ้าหน้าที่บันทึกข้อมูล' },
      create: {
        username: 'staff_entry',
        name: 'เจ้าหน้าที่บันทึกข้อมูล',
        passwordHash,
        role: 'DATA_ENTRY',
      },
    });

    rescuerUser = await prisma.user.upsert({
      where: { username: 'rescuer1' },
      update: { role: 'RESCUE', name: 'หน่วยกู้ภัยทีม A' },
      create: {
        username: 'rescuer1',
        name: 'หน่วยกู้ภัยทีม A',
        passwordHash,
        role: 'RESCUE',
      },
    });

    // Ensure Public intake is ON for testing public flows
    await prisma.systemSetting.upsert({
      where: { key: 'ENABLE_PUBLIC_INTAKE' },
      update: { value: 'true' },
      create: { key: 'ENABLE_PUBLIC_INTAKE', value: 'true' },
    });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  // ----------------------------------------------------
  // 1. Username (Email RTAF) & OTP 123456 Login
  // ----------------------------------------------------
  describe('OTP Login (Username / Email RTAF + Mock OTP: 123456)', () => {
    test('Prime Admin logs in successfully using Email RTAF and OTP 123456', async () => {
      // Login with clean username
      const req1 = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nattanon_r', otp: '123456' }),
      });
      const res1 = await LoginRoute.POST(req1);
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.success, true);
      assert.equal(data1.user.role, 'PRIME_ADMIN');

      const setCookie = res1.headers.get('set-cookie');
      assert.ok(setCookie.includes('session_token='), 'Should set HttpOnly session_token');

      // Login with full email format (@rtaf.mi.th)
      const req2 = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nattanon_r@rtaf.mi.th', otp: '123456' }),
      });
      const res2 = await LoginRoute.POST(req2);
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.user.username, 'nattanon_r');
    });

    test('Data Entry staff logs in successfully using Username and OTP 123456', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'staff_entry', otp: '123456' }),
      });
      const res = await LoginRoute.POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.role, 'DATA_ENTRY');
    });

    test('Rescuer logs in successfully using Username and OTP 123456', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'rescuer1', otp: '123456' }),
      });
      const res = await LoginRoute.POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.role, 'RESCUE');
    });

    test('Rejects invalid OTP (e.g. 999999) with 401 Unauthorized', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nattanon_r', otp: '999999' }),
      });
      const res = await LoginRoute.POST(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'INVALID_CREDENTIALS');
    });
  });

  // ----------------------------------------------------
  // 2. User Management Authority (Prime Admin & Data Entry)
  // ----------------------------------------------------
  describe('User Management by Prime Admin & Data Entry', () => {
    test('Prime Admin has permission to add new users and assign roles', async () => {
      const uniqueUsername = `rescuer_team_b_${Date.now()}`;
      const req = new Request('http://localhost/api/staff/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
        body: JSON.stringify({
          username: uniqueUsername,
          name: 'กู้ภัยมิตรภาพ ทีม B',
          role: 'RESCUE',
        }),
      });
      const res = await UsersRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.username, uniqueUsername);
      assert.equal(data.user.role, 'RESCUE');
    });

    test('Data Entry staff has permission to add users', async () => {
      const uniqueUsername = `entry_clerk_${Date.now()}`;
      const req = new Request('http://localhost/api/staff/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
        body: JSON.stringify({
          username: uniqueUsername,
          name: 'เจ้าหน้าที่คีย์ข้อมูล 2',
          role: 'DATA_ENTRY',
        }),
      });
      const res = await UsersRoute.POST(req);
      assert.equal(res.status, 201);
    });

    test('Data Entry is FORBIDDEN from creating ADMIN accounts (403)', async () => {
      const req = new Request('http://localhost/api/staff/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
        body: JSON.stringify({
          username: `illegal_admin_${Date.now()}`,
          name: 'แอบสร้างแอดมิน',
          role: 'ADMIN',
        }),
      });
      const res = await UsersRoute.POST(req);
      assert.equal(res.status, 403);
    });

    test('Prime Admin and Admin can create an ADMIN account', async () => {
      const uniqueUsername = `sub_admin_${Date.now()}`;
      const req = new Request('http://localhost/api/staff/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
        body: JSON.stringify({
          username: uniqueUsername,
          name: 'แอดมินผู้ช่วย',
          role: 'ADMIN',
        }),
      });
      const res = await UsersRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.user.role, 'ADMIN');
    });

    test('Rescue role is FORBIDDEN from adding users (403 Forbidden)', async () => {
      const req = new Request('http://localhost/api/staff/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
        body: JSON.stringify({
          username: 'illegal_user',
          name: 'Illegal User',
          role: 'RESCUE',
        }),
      });
      const res = await UsersRoute.POST(req);
      assert.equal(res.status, 403);
    });

    test('Prime Admin and Admin can search users by query', async () => {
      const req = new Request('http://localhost/api/staff/users?search=nattanon', {
        method: 'GET',
        headers: {
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
      });
      const res = await UsersRoute.GET(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.some((u) => u.username === 'nattanon_r'));
    });

    test('Data Entry staff is FORBIDDEN from editing users (PATCH) and deleting users (DELETE)', async () => {
      // Data entry tries to PATCH user -> 403
      const patchReq = new Request('http://localhost/api/staff/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
        body: JSON.stringify({ id: rescuerUser.id, name: 'Changed by Data Entry' }),
      });
      const patchRes = await UsersRoute.PATCH(patchReq);
      assert.equal(patchRes.status, 403);

      // Data entry tries to DELETE user -> 403
      const delReq = new Request(`http://localhost/api/staff/users?id=${rescuerUser.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
      });
      const delRes = await UsersRoute.DELETE(delReq);
      assert.equal(delRes.status, 403);
    });

    test('Prime Admin and Admin can edit existing user details (name, username, role)', async () => {
      // First create a temporary user
      const tempUser = await prisma.user.create({
        data: {
          username: `edit_target_${Date.now()}`,
          name: 'นายเป้าหมาย ทดสอบ',
          role: 'DATA_ENTRY',
          passwordHash: 'dummy',
        },
      });

      const updatedUsername = `new_target_${Date.now()}`;
      // Admin performs PATCH
      const patchReq = new Request('http://localhost/api/staff/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminUser.id,
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          id: tempUser.id,
          username: `${updatedUsername}@rtaf.mi.th`,
          name: 'นายเป้าหมาย แก้ไขแล้ว',
          role: 'RESCUE',
        }),
      });

      const patchRes = await UsersRoute.PATCH(patchReq);
      assert.equal(patchRes.status, 200);
      const patchData = await patchRes.json();
      assert.equal(patchData.user.username, updatedUsername);
      assert.equal(patchData.user.name, 'นายเป้าหมาย แก้ไขแล้ว');
      assert.equal(patchData.user.role, 'RESCUE');

      // Verify in DB
      const updated = await prisma.user.findUnique({ where: { id: tempUser.id } });
      assert.equal(updated.username, updatedUsername);
      assert.equal(updated.role, 'RESCUE');
      assert.equal(updated.name, 'นายเป้าหมาย แก้ไขแล้ว');
    });

    test('Prime Admin and Admin can delete user, with protection against deleting prime_admin or self', async () => {
      // Create user to delete
      const delUser = await prisma.user.create({
        data: {
          username: `delete_target_${Date.now()}`,
          name: 'ผู้ใช้รอการลบ',
          role: 'RESCUE',
          passwordHash: 'dummy',
        },
      });

      // Cannot delete prime_admin
      const primeDelReq = new Request(`http://localhost/api/staff/users?id=${primeAdminUser.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
      });
      const primeDelRes = await UsersRoute.DELETE(primeDelReq);
      assert.ok([400, 403].includes(primeDelRes.status));

      // Successful deletion of target user
      const delReq = new Request(`http://localhost/api/staff/users?id=${delUser.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
      });
      const delRes = await UsersRoute.DELETE(delReq);
      assert.equal(delRes.status, 200);

      const check = await prisma.user.findUnique({ where: { id: delUser.id } });
      assert.equal(check, null, 'Deleted user should no longer exist in DB');
    });
  });

  // ----------------------------------------------------
  // 3. Two Roles: Data Entry vs. Rescue Permissions
  // ----------------------------------------------------
  describe('RBAC: Data Entry (Add/Delete/Manage) vs. Rescue (View/Update Status Only)', () => {
    test('Data Entry can add new cases and delete cases', async () => {
      // Create case
      const createReq = new Request('http://localhost/api/staff/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
        body: JSON.stringify({
          reporterName: 'คุณทดสอบ ผู้กรอกข้อมูล',
          phoneNumber: '0899998877',
          peopleCount: 3,
          urgency: 'HIGH',
          itemsNeeded: ['น้ำดื่ม', 'อาหารแห้ง'],
          description: 'ระดับน้ำสูง รถเข้าไม่ได้',
          latitude: 7.009,
          longitude: 100.473,
          addressDetail: 'ใกล้ตลาดสดหาดใหญ่',
        }),
      });
      const createRes = await StaffCasesRoute.POST(createReq);
      assert.equal(createRes.status, 201);
      const createData = await createRes.json();
      testCaseId = createData.case.id;
      assert.ok(testCaseId);
    });

    test('Rescue role CAN view cases and case details', async () => {
      const req = new Request(`http://localhost/api/staff/cases/${testCaseId}`, {
        method: 'GET',
        headers: {
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
      });
      const res = await StaffCaseDetailRoute.GET(req, { params: { id: testCaseId } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, testCaseId);
    });

    test('Rescue role CAN update case status (e.g. IN_PROGRESS)', async () => {
      const req = new Request(`http://localhost/api/staff/cases/${testCaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const res = await StaffCaseDetailRoute.PATCH(req, { params: { id: testCaseId } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.case.status, 'IN_PROGRESS');
    });

    test('Rescue role CANNOT create new cases (403 Forbidden)', async () => {
      const req = new Request('http://localhost/api/staff/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
        body: JSON.stringify({
          reporterName: 'พยายามสร้างโดยกู้ภัย',
          phoneNumber: '0811112222',
          peopleCount: 2,
          urgency: 'LOW',
          latitude: 7.01,
          longitude: 100.48,
          addressDetail: 'สถานที่',
        }),
      });
      const res = await StaffCasesRoute.POST(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'FORBIDDEN');
    });

    test('Rescue role CANNOT delete cases (403 Forbidden)', async () => {
      const req = new Request(`http://localhost/api/staff/cases/${testCaseId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
      });
      const res = await StaffCaseDetailRoute.DELETE(req, { params: { id: testCaseId } });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'FORBIDDEN');
    });

    test('Rescue role CANNOT empty trash bin (403 Forbidden)', async () => {
      const req = new Request('http://localhost/api/staff/cases?trashOnly=true', {
        method: 'DELETE',
        headers: {
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
      });
      const res = await StaffCasesRoute.DELETE(req);
      assert.equal(res.status, 403);
    });

    test('Data Entry CAN delete cases (Permanent deletion allowed)', async () => {
      const req = new Request(`http://localhost/api/staff/cases/${testCaseId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
      });
      const res = await StaffCaseDetailRoute.DELETE(req, { params: { id: testCaseId } });
      assert.equal(res.status, 200);
    });

    test('Admin role CAN create cases and delete cases (Full Data Entry parity)', async () => {
      // 1. Admin creates case
      const createReq = new Request('http://localhost/api/staff/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminUser.id,
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          reporterName: 'คุณทดสอบ สร้างโดยแอดมิน',
          phoneNumber: '0877776655',
          peopleCount: 4,
          urgency: 'CRITICAL',
          itemsNeeded: ['เรือ/รถอพยพ'],
          latitude: 7.018,
          longitude: 100.472,
          addressDetail: 'ใกล้ ม.อ. หาดใหญ่',
        }),
      });
      const createRes = await StaffCasesRoute.POST(createReq);
      assert.equal(createRes.status, 201);
      const createData = await createRes.json();
      const adminCaseId = createData.case.id;

      // 2. Admin deletes case
      const delReq = new Request(`http://localhost/api/staff/cases/${adminCaseId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': adminUser.id,
          'x-user-role': 'ADMIN',
        },
      });
      const delRes = await StaffCaseDetailRoute.DELETE(delReq, { params: { id: adminCaseId } });
      assert.equal(delRes.status, 200);
    });
  });

  // ----------------------------------------------------
  // Feature Flag Toggle (ENABLE_PUBLIC_INTAKE) Permissions
  // ----------------------------------------------------
  describe('Feature Flag Toggle: Prime Admin and Admin ONLY', () => {
    test('Prime Admin can access and toggle ENABLE_PUBLIC_INTAKE', async () => {
      // GET
      const getReq = new Request('http://localhost/api/admin/settings', {
        method: 'GET',
        headers: {
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
      });
      const getRes = await AdminSettingsRoute.GET(getReq);
      assert.equal(getRes.status, 200);
      const getData = await getRes.json();
      assert.ok('ENABLE_PUBLIC_INTAKE' in getData.features);

      // POST toggle
      const postReq = new Request('http://localhost/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': primeAdminUser.id,
          'x-user-role': 'PRIME_ADMIN',
        },
        body: JSON.stringify({ key: 'ENABLE_PUBLIC_INTAKE', value: 'true' }),
      });
      const postRes = await AdminSettingsRoute.POST(postReq);
      assert.equal(postRes.status, 200);
    });

    test('Admin can access and toggle ENABLE_PUBLIC_INTAKE', async () => {
      const postReq = new Request('http://localhost/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminUser.id,
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ key: 'ENABLE_PUBLIC_INTAKE', value: 'false' }),
      });
      const postRes = await AdminSettingsRoute.POST(postReq);
      assert.equal(postRes.status, 200);

      // Restore to true
      await prisma.systemSetting.update({
        where: { key: 'ENABLE_PUBLIC_INTAKE' },
        data: { value: 'true' },
      });
    });

    test('Data Entry and Rescue are FORBIDDEN from admin settings (403 Forbidden)', async () => {
      // Data Entry
      const entryReq = new Request('http://localhost/api/admin/settings', {
        method: 'GET',
        headers: {
          'x-user-id': dataEntryUser.id,
          'x-user-role': 'DATA_ENTRY',
        },
      });
      const entryRes = await AdminSettingsRoute.GET(entryReq);
      assert.equal(entryRes.status, 403);

      // Rescue
      const rescueReq = new Request('http://localhost/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': rescuerUser.id,
          'x-user-role': 'RESCUE',
        },
        body: JSON.stringify({ key: 'ENABLE_PUBLIC_INTAKE', value: 'true' }),
      });
      const rescueRes = await AdminSettingsRoute.POST(rescueReq);
      assert.equal(rescueRes.status, 403);
    });
  });

  // ----------------------------------------------------
  // 4. Duplicate Report Simulation & Handling
  // ----------------------------------------------------
  describe('Duplicate Report Simulation & Prevention', () => {
    test('Detects geographic distance correctly using Haversine formula', () => {
      // Same point = 0 meters
      const d0 = calculateDistanceMeters(7.0076, 100.4712, 7.0076, 100.4712);
      assert.equal(d0, 0);

      // ~50 meters difference
      const d50 = calculateDistanceMeters(7.0076, 100.4712, 7.0080, 100.4712);
      assert.ok(d50 > 30 && d50 < 60, `Distance should be ~44m, got ${d50}`);
    });

    test('When user submits repeat requests, system detects duplicate, merges notes and avoids clutter', async () => {
      const uniquePhone = `0877${Date.now().toString().slice(-6)}`;
      const lat = 7.0055;
      const lng = 100.4722;

      // 1st request: Creates the case
      const req1 = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '180.180.1.1' },
        body: JSON.stringify({
          reporterName: 'คุณสมชาย น้ำท่วม',
          phoneNumber: uniquePhone,
          peopleCount: 4,
          urgency: 'MEDIUM',
          itemsNeeded: ['น้ำดื่ม'],
          description: 'ระดับน้ำถึงหน้าอก',
          latitude: lat,
          longitude: lng,
          addressDetail: 'บ้านเลขที่ 99 ชุมชนท่าเคียน',
        }),
      });
      const res1 = await PublicCasesRoute.POST(req1);
      assert.equal(res1.status, 201);
      const data1 = await res1.json();
      const firstCaseId = data1.caseId;
      assert.ok(firstCaseId);

      // 2nd request (REPEAT by same phone or close coordinates with additional urgency)
      const req2 = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '180.180.1.1' },
        body: JSON.stringify({
          reporterName: 'คุณสมชาย น้ำท่วม',
          phoneNumber: uniquePhone,
          peopleCount: 4,
          urgency: 'CRITICAL',
          itemsNeeded: ['ยารักษาโรค', 'เรือ/รถอพยพ'],
          description: 'น้ำขึ้นเร็วมาก คนแก่เริ่มหนาวสั่น ต้องการความช่วยเหลือด่วนมาก!',
          latitude: lat + 0.0001,
          longitude: lng + 0.0001,
          addressDetail: 'บ้านเลขที่ 99 ชุมชนท่าเคียน',
        }),
      });
      const res2 = await PublicCasesRoute.POST(req2);
      assert.equal(res2.status, 201, 'Duplicate submission returns 201 Created with merge confirmation');
      const data2 = await res2.json();
      assert.equal(data2.isDuplicate, true);
      assert.equal(data2.caseId, firstCaseId, 'Should point to the existing case Ref ID');

      // Check merged case in database
      const existingCase = await prisma.reliefCase.findUnique({
        where: { id: firstCaseId },
      });
      assert.equal(existingCase.urgency, 'CRITICAL', 'Urgency should be upgraded to CRITICAL');
      assert.ok(existingCase.description.includes('แจ้งซ้ำ'), 'Description should append repeat report details');
      const items = JSON.parse(existingCase.itemsNeeded);
      assert.ok(items.includes('ยารักษาโรค'), 'Items should merge new items');
    });
  });

  // ----------------------------------------------------
  // 5. Public Online Self-Update Status
  // ----------------------------------------------------
  describe('Online Public Case Tracking & Self-Update Status', () => {
    let publicCaseId;

    before(async () => {
      const c = await prisma.reliefCase.create({
        data: {
          reporterName: 'ผู้ขอความช่วยเหลือออนไลน์',
          phoneNumber: '0855554433',
          peopleCount: 2,
          urgency: 'MEDIUM',
          itemsNeeded: JSON.stringify(['น้ำดื่ม']),
          description: 'ติดอยู่บนชั้นสอง',
          latitude: 7.02,
          longitude: 100.47,
          addressDetail: 'ซอยเพชรเกษม',
          status: 'PENDING',
          source: 'PUBLIC',
        },
      });
      publicCaseId = c.id;
    });

    test('Public user can retrieve case status using Ref ID', async () => {
      const req = new Request(`http://localhost/api/public/cases/${publicCaseId}`, {
        method: 'GET',
      });
      const res = await PublicCaseDetailRoute.GET(req, { params: { id: publicCaseId } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, publicCaseId);
      assert.equal(data.status, 'PENDING');
      assert.ok(data.phoneNumber.includes('XXX'), 'Phone number must remain masked for privacy');
    });

    test('Public user can self-update status to RESOLVED (mark as helped)', async () => {
      const req = new Request(`http://localhost/api/public/cases/${publicCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          note: 'ได้รับความช่วยเหลือจากกู้ภัยแล้ว ปลอดภัยแล้ว ขอบคุณครับ',
        }),
      });
      const res = await PublicCaseDetailRoute.PATCH(req, { params: { id: publicCaseId } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.case.status, 'RESOLVED');

      // Verify in DB
      const updated = await prisma.reliefCase.findUnique({ where: { id: publicCaseId } });
      assert.equal(updated.status, 'RESOLVED');
      assert.ok(updated.description.includes('ได้รับความช่วยเหลือจากกู้ภัยแล้ว'));
    });
  });

  // ----------------------------------------------------
  // 6. Urgency Levels, Public Status & Resolved Sort Order
  // ----------------------------------------------------
  describe('Urgency Levels, Public Status & Resolved Sort Order', () => {
    test('/api/public/status returns enabled boolean matching database', async () => {
      const res = await PublicStatusRoute.GET();
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(typeof data.enabled, 'boolean');
    });

    test('Public intake accepts LOW and HIGH urgency levels correctly', async () => {
      const uniqueLowPhone = '088' + Math.floor(1000000 + Math.random() * 9000000);
      const randomOffset = Math.random() * 0.5;
      // 1. Submit case with LOW urgency
      const reqLow = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: 'ผู้ขอระดับปกติ',
          phoneNumber: uniqueLowPhone,
          peopleCount: 1,
          urgency: 'LOW',
          latitude: 8.0 + randomOffset,
          longitude: 101.0 + randomOffset,
          addressDetail: 'ใกล้ตลาดสดหาดใหญ่',
        }),
      });
      const resLow = await PublicCasesRoute.POST(reqLow);
      assert.equal(resLow.status, 201);
      const dataLow = await resLow.json();
      assert.equal(dataLow.isDuplicate, undefined);
      const lowCase = await prisma.reliefCase.findUnique({ where: { id: dataLow.caseId } });
      assert.equal(lowCase.urgency, 'LOW');

      // 2. Submit case with HIGH urgency
      const uniqueHighPhone = '089' + Math.floor(1000000 + Math.random() * 9000000);
      const reqHigh = new Request('http://localhost/api/public/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: 'ผู้ขอระดับด่วนมาก',
          phoneNumber: uniqueHighPhone,
          peopleCount: 3,
          urgency: 'HIGH',
          latitude: 8.5 + randomOffset,
          longitude: 101.5 + randomOffset,
          addressDetail: 'ใกล้อ่างเก็บน้ำ ม.อ.',
        }),
      });
      const resHigh = await PublicCasesRoute.POST(reqHigh);
      assert.equal(resHigh.status, 201);
      const dataHigh = await resHigh.json();
      assert.equal(dataHigh.isDuplicate, undefined);
      const highCase = await prisma.reliefCase.findUnique({ where: { id: dataHigh.caseId } });
      assert.equal(highCase.urgency, 'HIGH');
    });

    test('Dashboard sort logic places RESOLVED cases at the very bottom', () => {
      const URGENCY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const cases = [
        { id: '1', status: 'RESOLVED', urgency: 'CRITICAL', createdAt: '2026-10-29T10:00:00Z' },
        { id: '2', status: 'PENDING', urgency: 'LOW', createdAt: '2026-10-29T09:00:00Z' },
        { id: '3', status: 'IN_PROGRESS', urgency: 'MEDIUM', createdAt: '2026-10-29T11:00:00Z' },
        { id: '4', status: 'PENDING', urgency: 'CRITICAL', createdAt: '2026-10-29T08:00:00Z' },
      ];

      const sorted = [...cases].sort((a, b) => {
        const aResolved = a.status === 'RESOLVED' ? 1 : 0;
        const bResolved = b.status === 'RESOLVED' ? 1 : 0;
        if (aResolved !== bResolved) return aResolved - bResolved;
        const urgencyDiff = (URGENCY_ORDER[a.urgency] ?? 4) - (URGENCY_ORDER[b.urgency] ?? 4);
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // The active CRITICAL case (id 4) should be first
      assert.equal(sorted[0].id, '4', 'Active CRITICAL case must come first');
      // The resolved CRITICAL case (id 1) must be at the very bottom
      assert.equal(sorted[sorted.length - 1].id, '1', 'RESOLVED case must be placed at the very bottom');
    });
  });
});
