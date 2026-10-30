# AI Agent Development Guidelines & Instructions
> **สำหรับ AI Agent ทุกตัวที่เข้ามาทำงานต่อในโปรเจกต์นี้ (Mandatory Instructions)**

## 1. การบันทึก Development Log (บังคับดำเนินการทุกครั้ง)
- **ทุกครั้งที่มีการอัปเดต โค้ด เพิ่มฟีเจอร์ แก้ไขบั๊ก หรือ Deploy ระบบใหม่:**
  - คุณ **ต้อง (MUST)** อัปเดตไฟล์ `DEVELOPMENT_LOG.md` ในส่วน **"บันทึกประวัติการพัฒนาตามรอบ (Changelog)"** เสมอ
  - ระบุ วันที่, วัตถุประสงค์, รายการไฟล์ที่แก้ไข, รายละเอียดการเปลี่ยนแปลง และผลการทดสอบ

## 2. นโยบายการจัดการ Git Branch
- **`production` Branch:**
  - ใช้สำหรับส่งโค้ดขึ้น Production บน Vercel เท่านั้น
  - **ห้ามมี** Test Mock OTP เด็ดขาด (ต้องไม่มี `cleanOtp === '123456'`)
  - **ห้ามมี** การ์ด Demo Accounts บนหน้า `/login`
  - **ห้ามมี** โฟลเดอร์ `tests/`
- **`developer` Branch:**
  - ใช้สำหรับพัฒนาฟีเจอร์ใหม่และทดสอบ
  - อนุญาตให้มี Mock OTP และ Demo accounts ได้ เพื่อความสะดวกในการทดสอบในเครื่อง

## 3. สภาพแวดล้อมและเทคโนโลยีหลัก
- **Database:** PostgreSQL บน Neon.tech (ใช้ connection pooling) สำหรับ Production
- **Authentication:** RTAF MFA Gateway (`POST http://apigw.rtaf.mi.th/login-rtaf-mfa/v2/mfa/login`)
- **JWT:** Web Crypto Edge Verification ใน `src/middleware.ts` และ jsonwebtoken ใน `src/lib/auth.ts` (ใช้ Secret เดียวกันเสมอ)
- **Deployment:** Vercel Project `neo-4906/flood-relief-system` (`https://flood-relief-system.vercel.app`)
