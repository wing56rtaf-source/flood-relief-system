# Development Log: RTAF Flood Relief Operations System
> **ระบบบริหารจัดการและประสานงานช่วยเหลือผู้ประสบอุทกภัย กองทัพอากาศ (RTAF Flood Relief Operations System)**  
> เอกสารบันทึกประวัติ สถาปัตยกรรม คำสั่ง และแนวทางการพัฒนาสำหรับ AI Agent และทีมนักพัฒนา

---

## 📌 กฎเหล็กสำหรับ AI และนักพัฒนา (Mandatory Rule for Future AIs)

> [!IMPORTANT]
> **ทุกครั้งที่มีการแก้ไข เพิ่มเติม หรืออัปเดตระบบ (Features, Bug Fixes, Refactoring, Configs, Deployment)**
> **AI หรือผู้พัฒนา "ต้อง" บันทึกการเปลี่ยนแปลงลงในเอกสาร `DEVELOPMENT_LOG.md` นี้ในหัวข้อ "บันทึกประวัติการพัฒนาตามรอบ (Changelog)" เสมอ** โดยระบุ:
> 1. วันที่และเวลา (Date & Time)
> 2. วัตถุประสงค์ / คำขอของผู้ใช้งาน (Objective / User Request)
> 3. รายละเอียดไฟล์ที่แก้ไขและการเปลี่ยนแปลง (Files Modified & Changes Made)
> 4. การทดสอบและการยืนยันผล (Verification & Test Results)
> 5. สถานะ Git Branch (`developer` หรือ `production`)

---

## 🏗️ สถาปัตยกรรมระบบและเทคโนโลยี (System Architecture & Tech Stack)

| ส่วนประกอบ (Component) | เทคโนโลยี / เครื่องมือ (Technology) | รายละเอียด (Details) |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2 (App Router) | รองรับ Server Components, Edge Middleware, API Route Handlers |
| **Language & Typing** | TypeScript, React 18 | Strict Type Checking ปลอดภัยต่อ Production |
| **UI & Styling** | Tailwind CSS, Lucide Icons | Responsive Mobile-First, Dark Mode สลับ Theme ผ่าน LocalStorage |
| **Database & ORM** | PostgreSQL (Neon.tech Serverless) + Prisma ORM 5.22 | Connection Pooling ผ่าน AWS ap-southeast-1, SSL Required |
| **Local Dev DB** | SQLite (`prisma/dev.db`) | สำหรับการทดสอบในเครื่องบน branch `developer` |
| **Authentication** | JWT (JSON Web Token) via Web Crypto & jsonwebtoken | Session Cookie (`httpOnly`, `secure`, `sameSite: 'lax'`, อายุ 8 ชม.) |
| **OTP / MFA Gateway** | RTAF MFA Gateway (กองทัพอากาศ) | `POST http://apigw.rtaf.mi.th/login-rtaf-mfa/v2/mfa/login` |
| **Map & Geolocation** | OpenStreetMap + Leaflet (React-Leaflet) | Dynamic Import (`ssr: false`), Reverse Geocoding (Nominatim API) |
| **Audio & Alerts** | Web Audio API Oscillator | สังเคราะห์เสียงกริ่งแจ้งเตือนวิกฤตความถี่ 880Hz / 660Hz ไม่ต้องพึ่งพาไฟล์เสียงภายนอก |
| **Hosting & Deploy** | Vercel Serverless & Edge | โปรเจกต์ `neo-4906/flood-relief-system` โดเมนหลัก: `https://flood-relief-system.vercel.app` |

---

## 🌿 กลยุทธ์การแยก Git Branch (Branching Strategy)

ระบบแบ่งออกเป็น 2 Branch หลักอย่างเด็ดขาด:

### 1. Branch: `developer` (สำหรับการพัฒนาและทดสอบ)
- **วัตถุประสงค์:** รองรับการพัฒนาฟีเจอร์ใหม่ การ Debugging และการรัน Unit/Integration Tests ภายในเครื่อง
- **สิ่งที่อนุญาต:**
  - มี Mock OTP Bypass สำหรับทดสอบ (`cleanOtp === '123456'`)
  - มีการ์ด "เลือกบัญชีทดสอบตามสิทธิ์" ในหน้า `/login`
  - มีโฟลเดอร์ชุดทดสอบ `tests/` และ script รัน Jest/Node tests

### 2. Branch: `production` (สำหรับขึ้นระบบจริงบน Vercel)
- **วัตถุประสงค์:** รหัสโปรแกรมที่พร้อมใช้งานจริง มีความปลอดภัยสูงสุดตามมาตรฐานความมั่นคงปลอดภัยไซเบอร์
- **ข้อห้ามเด็ดขาด (Strict Rules):**
  - ❌ **ห้ามมี** โค้ด Bypass OTP ทุกกรณี (ไม่มี `cleanOtp === '123456'`) ต้องผ่าน RTAF MFA Gateway จริงเท่านั้น
  - ❌ **ห้ามมี** การ์ดเลือกบัญชีทดสอบในหน้า `/login`
  - ❌ **ห้ามมี** โฟลเดอร์ `tests/` หรือไฟล์ทดสอบที่ไม่ได้ใช้งานจริงบน Vercel

---

## 🔐 สรุปความปลอดภัยและนโยบายความเป็นส่วนตัว (Security Policies)
1. **การปกปิดข้อมูล PII (Phone Number Masking):**
   - ในหน้ารายการเคส (`/dashboard`) ข้อมูลเบอร์โทรศัพท์จะถูก Mask อัตโนมัติ เช่น `081-XXX-4567`
   - เจ้าหน้าที่ที่มีสิทธิ์จะสามารถกด "เปิดดูเบอร์โทรศัพท์ฉบับเต็ม" ได้ และระบบจะบันทึก `AuditLog` พร้อมเหตุผลการเปิดดูทุกครั้ง
2. **การป้องกัน Brute-force & Rate Limiting:**
   - หน้า Login ป้องกันการสุ่มรหัสผ่าน ผิดเกิน 5 ครั้งจะถูก Lock ชั่วคราว 15 นาที
   - หน้าแจ้งเหตุสาธารณะ (`/report`) จำกัดอัตราการส่งข้อมูล (IP Rate Limit) 5 ครั้งต่อนาที
3. **Public Intake Gatekeeper:**
   - หน้ารับแจ้งเหตุสาธารณะถูกปิดกั้นไว้เป็นค่าเริ่มต้น (`ENABLE_PUBLIC_INTAKE=false`) เมื่อปิด ผู้ใช้ทั่วไปที่พยายามเข้าถึง `/report` หรือ API `/api/public/cases` จะได้รับ HTTP 404 โดยตรง

---

## 📜 บันทึกประวัติการพัฒนาตามรอบ (Changelog)

### [2026-11-08] - Sprint 9: Expand Landmark Dictionary (Hat Yai & Khlong Hoi Khong 183 Places)
- **Branch:** `developer`
- **Objective:** อัปเกรดขยายคลังพจนานุกรมแลนด์มาร์กหาดใหญ่และคลองหอยโข่งเต็มรูปแบบจากชุดข้อมูลทางการของผู้ใช้งาน ครอบคลุม 183 สถานที่ (โรงพยาบาล/อนามัย 17 แห่ง, ศูนย์ราชการ/อปท. 30 แห่ง, ขนส่ง/สถานีรถไฟ 10 แห่ง, สถาบันการศึกษา 22 แห่ง, ตลาด/ห้าง 21 แห่ง, จุดเสี่ยงน้ำท่วมริมคลอง 20 แห่ง, ชุมชนหาดใหญ่ 28 แห่ง, และหมู่บ้านใน อ.คลองหอยโข่ง ครบทั้ง 4 ตำบล 32 หมู่บ้าน) โดยใช้ข้อมูลใหม่แทนที่ข้อมูลเดิมที่ซ้ำกัน
- **Files Modified:**
  1. `src/lib/landmarks-hatyai.ts`: นำเข้าข้อมูลแลนด์มาร์ก 183 รายการพร้อมคำย่อ/ภาษาพูดและพิกัดดาวเทียมละเอียดครบถ้วน
- **Verification & Test Results:**
  - ทดสอบการค้นหาทั้ง 183 สถานที่: `บ้านจอมหรำ`, `ค่ายรัตนพล`, `เขต 8`, `สะพานท่าเคียน`, `อ่างเก็บน้ำคลองหลา`, `แสงทอง`, `บขส.ตลาดเกษตร`, `มอ`, `กิมหยง` ตอบสนองแม่นยำภายใน < 5ms
  - `npm run build` ผ่านสมบูรณ์ (14/14 static pages, 0 errors)

### [2026-11-08] - Sprint 8: Streamline Map Layers (Remove Satellite Switcher)
- **Branch:** `developer`
- **Objective:** ปลดตัวสลับชั้นข้อมูลดาวเทียม (Satellite Switcher) ออกจากแผนที่ทั้งใน Dashboard และ Public Map ตามความต้องการของผู้ใช้งาน เพื่อให้ UI แผนที่เรียบง่าย โหลดเร็ว คลีน และเน้นเฉพาะแผนที่ถนน OpenStreetMap มาตรฐานร่วมกับระบบค้นหาอัจฉริยะ Smart Address Search
- **Files Modified:**
  1. `src/app/dashboard/map-picker.tsx`: ปลด State `layerType`, `satelliteLayerRef`, `labelsLayerRef`, `handleToggleLayer` และปุ่มสลับ Street/Satellite ออกจาก Floating Controls
  2. `src/components/public-map.tsx`: ปลดเลเยอร์ดาวเทียมและปุ่มสลับเลเยอร์ออกเช่นเดียวกัน คงไว้เฉพาะปุ่มรีเซ็ตศูนย์กลางหาดใหญ่และปุ่มพอดีเคส
- **Verification & Test Results:**
  - `npm run build` ผ่านสมบูรณ์ (14/14 static pages, 0 errors, Type check ผ่าน)
  - แผนที่แสดงผลเฉพาะ OpenStreetMap Street Layer สะอาดตา ไม่โหลดภาพถ่ายดาวเทียมภายนอกเกินจำเป็น

### [2026-11-07] - Sprint 7: Smart Address Search & Satellite Map Layer (แนวทางที่ 1)
- **Branch:** `developer`
- **Objective:** พัฒนาระบบค้นหาสถานที่อัจฉริยะบนแผนที่ (Smart Address Search) และตัวสลับภาพถ่ายดาวเทียม (Satellite Layer) ตามเอกสารข้อเสนอทางเทคนิค `LOCATION_ASSISTANCE_PROPOSAL.md` เพื่อช่วยให้เจ้าหน้าที่รับสายสามารถปักหมุดระบุตำแหน่งผู้ประสบภัยจากภาษาพูด/คำย่อได้รวดเร็วภายใน 5–10 วินาที
- **Files Modified & Added:**
  1. `src/lib/landmarks-hatyai.ts` (สร้างใหม่): คลังพจนานุกรมแลนด์มาร์กหาดใหญ่และสงขลา (39 สถานที่สำคัญ, คำย่อ, ชุมชน, จุดเสี่ยงน้ำท่วม พร้อม In-Memory Fast Substring/Fuzzy Search < 10ms และกำหนด Bounding Box หาดใหญ่)
  2. `src/app/api/geocode/route.ts` (สร้างใหม่): Two-Tier Hybrid Geocoding API รองรับการค้นหา Local Dictionary ก่อน และ Fallback ไปยัง Forward Geocoder ภายในกรอบพิกัดหาดใหญ่-สงขลา พร้อม In-Memory LRU Cache
  3. `src/components/smart-map-search.tsx` (สร้างใหม่): Floating Search Bar พร้อม Auto-Suggest Dropdown, Categorized Badges, ปุ่ม Shortcut Chips ยอดนิยม (ม.อ., ทุ่งรี 17, กิมหยง, ไดอาน่า, หาดใหญ่ใน, คลองแห) และรองรับ Keyboard Navigation
  4. `src/app/dashboard/map-picker.tsx` (ปรับปรุง): 
     - เพิ่มตัวสลับชั้นข้อมูลแผนที่ (Street / Satellite Layer Switcher) ด้วย Esri World Imagery ความละเอียดสูง + Hybrid Labels
     - ติดตั้ง `SmartMapSearch` บนมุมซ้ายบนของแผนที่ และย้ายปุ่มควบคุมการซูมของ Leaflet ไปที่มุมขวาล่างเพื่อป้องกันการบดบัง
     - เพิ่มฟังก์ชัน `handleLocationFound` สั่ง `flyTo` ซูมไปยังจุดที่พบ และเลื่อนหมุดพิกัดอัตโนมัติ
  5. `src/app/dashboard/page.tsx` (ปรับปรุง):
     - เชื่อมต่อ `onSelectPlaceName` จาก `MapPicker` เข้ากับแบบฟอร์มลงทะเบียนเคสใหม่ เพื่อ Auto-fill ชื่อสถานที่ลงในช่อง "รายละเอียดที่อยู่ / จุดสังเกต"
     - ขยายความสูงของ Map Container ใน Modal รับเรื่องเพื่อเพิ่มพื้นที่ใช้งานให้เจ้าหน้าที่
  6. `src/components/public-map.tsx` (ปรับปรุง): เพิ่ม `SmartMapSearch` และ Layer Switcher บนแผนที่สาธารณะหน้า Landing Page
  7. `prisma/schema.prisma` (แก้ไข): ปรับ `datasource provider = "sqlite"` บน branch `developer` ให้สอดคล้องกับ `.env` (`DATABASE_URL="file:./dev.db"`) แก้ปัญหา `PrismaClientInitializationError: Invalid prisma.reliefCase.findMany() invocation` เนื่องจากโปรโตคอลไม่ตรงกัน
- **Verification & Test Results:**
  - รัน Unit Test ตรวจสอบ Local Search Engine ผ่านชุดคำค้นยอดนิยม (`มอ`, `ม.อ.`, `ทุ่งรี 17`, `กิมหยง`, `ไดอาน่า`, `หาดใหญ่ใน`, `กองบิน 56`) ผ่าน 100% ตอบสนองแม่นยำ
  - ทดสอบ `prisma.reliefCase.findMany()` ดึงข้อมูลเคสจาก `dev.db` สำเร็จ 44 เคส ปราศจาก error
  - ทดสอบการสลับภาพดาวเทียมความละเอียดสูง (Esri Satellite) ราบรื่น ไม่เกิดภาพขาดหรือข้อผิดพลาด
  - `npm run build` ผ่านสมบูรณ์ (14/14 static pages generated, 0 Errors, API Route dynamic configuration ผ่าน)

### [2026-11-03] - Sprint 6: Map Zoom Optimization & Pin Popup Card Persistence
- **Branch:** `production` & `developer`
- **Objective:** ปรับแต่งระบบแผนที่ OpenStreetMap Leaflet ให้คงระดับการซูมและไม่ปิดการ์ดข้อมูลเมื่อมี Background Polling
- **Changes Made:**
  1. **ปรับระดับการซูม (FlyTo Zoom Level):**
     - ปรับระยะซูมเมื่อกด "ดูบนแผนที่" จากเดิมระดับ 17 (Street/Rooftop level ซึ่งใกล้เกินไป) เป็นระดับ 15 (Neighborhood/District level) ทำให้เห็นบริบทถนนและชุมชนรอบข้างได้สบายตาขึ้น
  2. **คงระดับการซูม ไม่ถูกดึงกลับ (Zoom Persistence & Auto-fit Control):**
     - แก้ไขปัญหา Background Polling ทุก 3.5 วินาทีที่สั่ง `fitBoundsToCases` ซ้ำซ้อนจนดึงหน้าจอกลับไปครอบคลุมทุกเคส
     - เพิ่ม `hasInitiallyFittedRef` เพื่อให้ระบบคำนวณ Auto-fit ครอบคลุมเคสทั้งหมดเฉพาะการเปิดแผนที่ครั้งแรกเท่านั้น หากผู้ใช้ซูมดูเคสหรือเลื่อนมุมมอง แผนที่จะคงมุมมองนั้นไว้ตลอดเวลา
     - ผู้ใช้ยังสามารถกดปุ่ม "🗺️ ปรับพอดีเคส" ด้านบนขวาได้ทุกเมื่อที่ต้องการปรับมุมมองให้ครอบคลุมเคสทั้งหมด
  3. **การ์ดข้อมูลบนหมุดไม่หาย (Pin Popup Card Persistence):**
     - เพิ่มระบบ Fingerprint Cache (`getCasesFingerprint`) เพื่อตรวจสอบว่าข้อมูลเคสมีการเปลี่ยนแปลงจริงหรือไม่ หากข้อมูลเคสในการโพลล์รอบใหม่ไม่มีการเปลี่ยนแปลง จะไม่ทำลายหรือวาด Marker ซ้ำ
     - เพิ่ม `activePopupCaseIdRef` และ `isUpdatingLayersRef` จดจำ ID ของการ์ดที่กำลังเปิดอ่านอยู่ แม้จะมีการอัปเดตสถานะเคสแบบเรียลไทม์ การ์ดข้อมูลจะเปิดแสดงต่อเนื่องโดยไม่ปิดหายไปหลังจาก 2-3 วินาที
- **Verification:**
  - ตรวจสอบโค้ด Leaflet lifecycle, Layer Group, Event Listeners (`popupopen`, `popupclose`, `map.click`) ไม่เกิด Memory Leak หรือ Error

---

### [2026-10-30] - Sprint 5: Production Deployment & Bug Fixes
- **Branch:** `production` & `developer`
- **Objective:** ปรับแต่งระบบสำหรับใช้งานจริง Deploy บน Neon PostgreSQL และ Vercel พร้อมแก้ปัญหา Login ค้าง
- **Changes Made:**
  1. **Neon PostgreSQL Migration:**
     - ปรับ `prisma/schema.prisma` เปลี่ยน datasource เป็น `postgresql`
     - ซิงค์โครงสร้าง Table สู่ Neon DB ผ่าน `npx prisma db push`
     - Seed ข้อมูลผู้ใช้เริ่มต้น (`admin`, `staff_korat`, `rescue_unit1`, `data_entry1`) ด้วยรหัสผ่าน Hash ที่ปลอดภัย
  2. **Vercel Deployment Configuration:**
     - ตั้งค่า Project: `neo-4906/flood-relief-system`
     - สร้าง `.vercelignore` กรอง `node_modules`, `.next`, `.git` เพื่อให้การอัปโหลดรวดเร็ว
     - เพิ่ม Environment Variables ถาวรบน Vercel: `DATABASE_URL`, `JWT_SECRET`, `ENABLE_PUBLIC_INTAKE`
  3. **Security Clean-up บน Production:**
     - ถอดเงื่อนไข `cleanOtp === '123456'` ออกจาก `src/app/api/auth/login/route.ts` 100%
     - ถอดการ์ด demo accounts ("เลือกบัญชีทดสอบตามสิทธิ์") ออกจาก `src/app/login/page.tsx`
  4. **แก้ปัญหา Login Freeze (หน้าจอค้างเมื่อกรอก OTP ถูก):**
     - ซิงค์ Fallback Secret ใน `src/middleware.ts` และ `src/lib/auth.ts` ให้ตรงกัน
     - ปรับ Cookie Option เป็น `sameSite: 'lax'`
     - เปลี่ยนการ Redirect ใน `src/app/login/page.tsx` จาก `router.push('/dashboard')` เป็น `window.location.href = '/dashboard'` เพื่อให้ส่ง Cookie ใหม่ได้ทันทีโดยไม่มี Router Race Condition
- **Verification:**
  - Build ผ่านสำเร็จ (0 Errors)
  - Vercel Deployment `Ready` ที่ https://flood-relief-system.vercel.app
  - ทดสอบ Session Token ผ่าน Edge Middleware ตอบกลับ `HTTP 200 OK` เปิดเข้าสู่ Dashboard ได้ทันที

---

### [2026-10-29] - Sprint 4: Code Optimization, Test Execution & Git Strategy
- **Branch:** Initialized `developer` & `production`
- **Objective:** ตรวจสอบความปลอดภัย Clean code และทดสอบระบบทุกฟังก์ชัน
- **Changes Made:**
  1. ดำเนินการทดสอบ Security Test Suite ครบทุกเคส:
     - Auth & RBAC Tests (`TS-01` ถึง `TS-06`) ผ่านทั้งหมด
     - Case Management & Urgency Level Tests (`TS-07` ถึง `TS-12`) ผ่านทั้งหมด
     - PII Masking & Audit Trail Tests (`TS-13` ถึง `TS-15`) ผ่านทั้งหมด
     - Public Intake & Rate Limiting Tests (`TS-16` ถึง `TS-18`) ผ่านทั้งหมด
  2. เชื่อมต่อระบบ Login เข้ากับ RTAF MFA API Gateway:
     - Endpoint: `http://apigw.rtaf.mi.th/login-rtaf-mfa/v2/mfa/login`
     - Method: `POST`, Header: `Content-Type: application/json`
     - Body: `{ "user": email, "pass": otp }`
  3. Clean Code: จัดระเบียบ Source Code กำจัดโค้ดซ้ำซ้อน และเพิ่ม Type safety

---

### [2026-10-29] - Sprint 3: Urgency Levels, Emergency Alerts & Audio
- **Branch:** `developer`
- **Objective:** ปรับแต่งระดับความเร่งด่วน การแจ้งเตือนฉุกเฉินสีแดง สั่นหน้าจอ และเสียงกริ่ง
- **Changes Made:**
  1. ปรับระดับความเร่งด่วนใน `/dashboard` และ `/report` ให้ตรงกัน:
     - 4 ระดับ: ปกติ (`MEDIUM` - Default), ด่วน (`HIGH`), วิกฤต (`CRITICAL`), ต่ำ (`LOW`)
  2. ออกแบบระบบ Emergency Notification Drawer / Toast:
     - จัดวางการ์ดแจ้งเตือนสีแดงมุมขวาบนแบบ Stack ซ้อนกันอย่างสวยงาม
     - เพิ่มเมนูการตั้งค่าระบบแจ้งเตือน (เปิด/ปิดการสั่น, กำหนดเวลาสั่น 1-10 วินาที, เปิด/ปิดเสียง)
     - จัดกรอบเมนูตั้งค่าให้มีขนาดกะทัดรัด อยู่ทางขวาของกล่อง Feature Flag Toggle
  3. เสียงแจ้งเตือนวิกฤต:
     - สังเคราะห์เสียงผ่าน Web Audio API กริ่งเตือนตามระยะเวลาที่ตั้งค่าการเขย่าหน้าจอ

---

### [2026-10-28] - Sprint 1 & 2: Core Platform & Public Intake
- **Branch:** `developer`
- **Objective:** พัฒนาระบบพื้นฐานตามข้อกำหนด Hermes Handoff
- **Changes Made:**
  1. สร้าง Next.js 14 App Router, โครงสร้าง UI Dashboard เจ้าหน้าที่
  2. พัฒนาระบบแผนที่ Interactive Map ด้วย OpenStreetMap Leaflet สำหรับปักหมุดผู้ประสบภัย
  3. หน้ารับแจ้งเหตุสาธารณะ (`/report`) พร้อมระบบระบุตำแหน่ง GPS ปัจจุบันของผู้ประสบภัย
  4. ระบบ Feature Toggle ปิด/เปิดการเข้าถึงหน้าสาธารณะ

---

## 🚀 คู่มือการรันและการดูแลระบบ (Operations & Runbook)

### 1. การเปิดใช้งานในเครื่องสำหรับทดสอบ (Local Development)
```bash
cd flood-relief-system
git checkout developer
npm install
npx prisma generate
npm run dev
# เปิดใช้งานที่ http://localhost:3000
```

### 2. การรันชุดทดสอบ (Automated Tests)
```bash
cd flood-relief-system
git checkout developer
npm test
```

### 3. การอัปเดตและ Deploy ขึ้น Production บน Vercel
```bash
cd flood-relief-system
git checkout production

# 1. ตรวจสอบโค้ดว่าไม่มี Mock OTP และไม่มี Demo Account Card
# 2. คอมไพล์ทดสอบ
npm run build

# 3. Deploy ไปยัง Vercel
npx vercel --prod --yes --token=<VERCEL_TOKEN>
```

---
*เอกสารนี้ถูกจัดทำขึ้นเพื่อเป็น Single Source of Truth สำหรับสถาปัตยกรรมและประวัติการพัฒนาของระบบ Flood Relief Operations System (RTAF)*
