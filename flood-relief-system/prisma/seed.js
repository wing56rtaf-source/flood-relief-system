const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Flood Relief System Database (Hat Yai Demo Cases) ---');

  // 1. Seed Users (Prime Admin, Data Entry, Rescue, Admin & Staff)
  const defaultPasswordHash = await bcrypt.hash('admin1234', 10);
  const staffPasswordHash = await bcrypt.hash('staff1234', 10);

  // Prime Admin - First user with user management authority
  const primeAdmin = await prisma.user.upsert({
    where: { username: 'nattanon_r' },
    update: { role: 'PRIME_ADMIN', name: 'Prime Admin (nattanon_r)' },
    create: {
      username: 'nattanon_r',
      name: 'Prime Admin (nattanon_r)',
      passwordHash: defaultPasswordHash,
      role: 'PRIME_ADMIN',
    },
  });
  console.log(`Created/Updated Prime Admin: ${primeAdmin.username}`);

  // Role 1: ผู้กรอกข้อมูล (DATA_ENTRY) - เพิ่มข้อมูล, จัดการสิทธิ์, ลบเคส
  const dataEntry = await prisma.user.upsert({
    where: { username: 'staff_entry' },
    update: { role: 'DATA_ENTRY', name: 'เจ้าหน้าที่บันทึกข้อมูล (สมใจ)' },
    create: {
      username: 'staff_entry',
      name: 'เจ้าหน้าที่บันทึกข้อมูล (สมใจ)',
      passwordHash: staffPasswordHash,
      role: 'DATA_ENTRY',
    },
  });
  console.log(`Created/Updated Data Entry User: ${dataEntry.username}`);

  // Role 2: หน่วยกู้ภัย (RESCUE) - ดูข้อมูลได้อย่างเดียว, เปลี่ยนสถานะได้, ห้ามเพิ่มหรือลบ
  const rescuer = await prisma.user.upsert({
    where: { username: 'rescuer1' },
    update: { role: 'RESCUE', name: 'หน่วยกู้ภัยทีมเผชิญเหตุ A' },
    create: {
      username: 'rescuer1',
      name: 'หน่วยกู้ภัยทีมเผชิญเหตุ A',
      passwordHash: staffPasswordHash,
      role: 'RESCUE',
    },
  });
  console.log(`Created/Updated Rescue User: ${rescuer.username}`);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      username: 'admin',
      name: 'ผู้ดูแลระบบกลาง',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created/Updated Admin user: ${admin.username}`);

  const staff = await prisma.user.upsert({
    where: { username: 'staff1' },
    update: { passwordHash: staffPasswordHash },
    create: {
      username: 'staff1',
      name: 'เจ้าหน้าที่ สมชาย',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
    },
  });
  console.log(`Created/Updated Staff user: ${staff.username}`);

  // 2. Seed System Settings (Default Feature Flag: OFF)
  await prisma.systemSetting.upsert({
    where: { key: 'ENABLE_PUBLIC_INTAKE' },
    update: {},
    create: {
      key: 'ENABLE_PUBLIC_INTAKE',
      value: 'false',
      updatedBy: admin.id,
    },
  });

  // 3. Clear all old relief cases first
  const deleted = await prisma.reliefCase.deleteMany({});
  console.log(`Cleared ${deleted.count} existing relief cases.`);

  // 4. Seed 10 realistic Hat Yai flood relief cases
  const hatYaiCases = [
    {
      reporterName: 'คุณประสิทธิ์ สุขใจ',
      phoneNumber: '0819991122',
      peopleCount: 4,
      urgency: 'CRITICAL',
      itemsNeeded: JSON.stringify(['เรือ/รถอพยพ', 'ยารักษาโรค', 'น้ำดื่ม']),
      description: 'ระดับน้ำในตลาดสูงกว่า 1.2 เมตร มีผู้สูงอายุติดอยู่บนชั้นสอง มีอาการไข้สูง ต้องการเรืออพยพด่วน',
      latitude: 7.0076,
      longitude: 100.4712,
      addressDetail: 'ตลาดกิมหยง ซอย 3 ถ.ศุภสารรังสรรค์ อ.หาดใหญ่',
      status: 'IN_PROGRESS',
      source: 'STAFF',
    },
    {
      reporterName: 'คุณกัลยา นิยมไทย',
      phoneNumber: '0895551234',
      peopleCount: 6,
      urgency: 'CRITICAL',
      itemsNeeded: JSON.stringify(['เรือ/รถอพยพ', 'น้ำดื่ม', 'อาหารแห้ง']),
      description: 'น้ำเอ่อล้นจากคลองอู่ตะเภาเข้าท่วมชั้นล่างมิด มีเด็กเล็ก 2 คนและคนแก่ 1 คน ไฟฟ้าดับ',
      latitude: 7.0235,
      longitude: 100.4570,
      addressDetail: 'ชุมชนริมคลองอู่ตะเภา ซอยร่วมมิตร อ.หาดใหญ่',
      status: 'PENDING',
      source: 'PUBLIC',
    },
    {
      reporterName: 'คุณธวัชชัย รัตนวงศ์',
      phoneNumber: '0823334455',
      peopleCount: 3,
      urgency: 'HIGH',
      itemsNeeded: JSON.stringify(['น้ำดื่ม', 'อาหารแห้ง', 'ยารักษาโรค']),
      description: 'กระแสน้ำแรงตัดขาดทางเข้าออกซอย อาหารและน้ำดื่มใกล้หมด ต้องการเสบียงยังชีพ',
      latitude: 6.9935,
      longitude: 100.4635,
      addressDetail: 'ชุมชนบางหัก ซอยประสานมิตร อ.หาดใหญ่',
      status: 'PENDING',
      source: 'STAFF',
    },
    {
      reporterName: 'คุณสมจิตต์ แก้วมณี',
      phoneNumber: '0867778899',
      peopleCount: 2,
      urgency: 'CRITICAL',
      itemsNeeded: JSON.stringify(['ยารักษาโรค', 'เรือ/รถอพยพ']),
      description: 'ผู้ป่วยโรคไตต้องไปฟอกไตที่ รพ.หาดใหญ่ น้ำท่วมถนนรถยนต์สัญจรไม่ได้',
      latitude: 6.9985,
      longitude: 100.4755,
      addressDetail: 'ชุมชนป้อมหก เลียบทางรถไฟหาดใหญ่',
      status: 'IN_PROGRESS',
      source: 'STAFF',
    },
    {
      reporterName: 'คุณปรีชา แซ่หลี',
      phoneNumber: '0812345678',
      peopleCount: 5,
      urgency: 'HIGH',
      itemsNeeded: JSON.stringify(['น้ำดื่ม', 'อาหารแห้ง']),
      description: 'มีทารกแรกเกิด 3 เดือน ต้องการน้ำสะอาดชงนมและผ้าอ้อมสำเร็จรูป',
      latitude: 7.0040,
      longitude: 100.4490,
      addressDetail: 'ชุมชนท่าเคียน ซอย 8 ถ.ศรีภูวนารถ อ.หาดใหญ่',
      status: 'PENDING',
      source: 'PUBLIC',
    },
    {
      reporterName: 'คุณวรรณา ศิริพร',
      phoneNumber: '0878889900',
      peopleCount: 3,
      urgency: 'MEDIUM',
      itemsNeeded: JSON.stringify(['อาหารแห้ง', 'น้ำดื่ม']),
      description: 'น้ำท่วมหน้าบ้านระดับหัวเข่า ออกไปซื้ออาหารไม่ได้ ต้องการข้าวกล่องและน้ำดื่ม',
      latitude: 7.0195,
      longitude: 100.4815,
      addressDetail: 'ชุมชนเกาะเสือ ซอย 5 อ.หาดใหญ่',
      status: 'IN_PROGRESS',
      source: 'STAFF',
    },
    {
      reporterName: 'คุณอนันต์ ชูชาติ',
      phoneNumber: '0834445566',
      peopleCount: 2,
      urgency: 'MEDIUM',
      itemsNeeded: JSON.stringify(['น้ำดื่ม', 'อาหารสัตว์']),
      description: 'ติดอยู่ในบ้านพร้อมสุนัข 3 ตัว ต้องการน้ำดื่มและอาหารสัตว์',
      latitude: 7.0025,
      longitude: 100.4910,
      addressDetail: 'ซอยเพชรเกษม 10 ชุมชนคลองเรียน อ.หาดใหญ่',
      status: 'PENDING',
      source: 'PUBLIC',
    },
    {
      reporterName: 'คุณมาลี เพชรทอง',
      phoneNumber: '0845556677',
      peopleCount: 4,
      urgency: 'HIGH',
      itemsNeeded: JSON.stringify(['น้ำดื่ม', 'ยารักษาโรค']),
      description: 'น้ำกัดเท้าและมีผื่นคัน ต้องการยารักษาโรคน้ำกัดเท้าและยาสามัญ',
      latitude: 6.9950,
      longitude: 100.4820,
      addressDetail: 'ชุมชนจันทร์วิโรจน์ ซอย 2 อ.หาดใหญ่',
      status: 'IN_PROGRESS',
      source: 'STAFF',
    },
    {
      reporterName: 'คุณศักดา พรหมเกิด',
      phoneNumber: '0881112233',
      peopleCount: 1,
      urgency: 'LOW',
      itemsNeeded: JSON.stringify(['น้ำดื่ม']),
      description: 'ได้รับถุงยังชีพเรียบร้อยแล้ว น้ำเริ่มลดระดับ สถานการณ์ปลอดภัย',
      latitude: 7.0395,
      longitude: 100.5040,
      addressDetail: 'หน้าสวนสาธารณะหาดใหญ่ ต.คอหงส์ อ.หาดใหญ่',
      status: 'RESOLVED',
      source: 'STAFF',
    },
    {
      reporterName: 'คุณนภัสสร รุ่งเรือง',
      phoneNumber: '0891239876',
      peopleCount: 2,
      urgency: 'LOW',
      itemsNeeded: JSON.stringify(['น้ำดื่ม', 'อาหารแห้ง']),
      description: 'นักศึกษา ม.อ. ได้รับการอพยพมายังศูนย์พักพิงชั่วคราวเรียบร้อยแล้ว',
      latitude: 6.9995,
      longitude: 100.5015,
      addressDetail: 'หอพักหน้า ม.อ. ประตู 108 ถ.ปุณณกัณฑ์ อ.หาดใหญ่',
      status: 'RESOLVED',
      source: 'PUBLIC',
    },
  ];

  await prisma.reliefCase.createMany({
    data: hatYaiCases,
  });

  console.log(`Successfully seeded ${hatYaiCases.length} Hat Yai demo flood relief cases!`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
