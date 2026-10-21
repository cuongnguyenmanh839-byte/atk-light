// seed.js - plain JavaScript to avoid TypeScript config conflicts
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ATK Light database...');

  // Lighting Scenes
  const scenes = [
    { code: 'TOUR', name: 'Tham quan', description: 'Anh sang hai hoa, chao don khach', brightness: 70, colorTemperature: 4000, sortOrder: 0 },
    { code: 'MEMORIAL', name: 'Le tuong niem', description: 'Anh sang trang nghiem, am ap', brightness: 50, colorTemperature: 3200, sortOrder: 1 },
    { code: 'SECURITY', name: 'An ninh', description: 'Chieu sang tang cuong bao ve', brightness: 100, colorTemperature: 5000, sortOrder: 2 },
    { code: 'ENERGY_SAVING', name: 'Tiet kiem', description: 'Toi uu hoa nang luong', brightness: 35, colorTemperature: 3500, sortOrder: 3 },
  ];
  for (const scene of scenes) {
    await prisma.lightingScene.upsert({ where: { code: scene.code }, create: scene, update: scene });
  }
  console.log('✅ Lighting scenes OK');

  // System state
  await prisma.systemState.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', power: true, brightness: 70, colorTemperature: 4000, mode: 0 },
    update: {},
  });

  await prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });

  // Areas + Lights
  const areasData = [
    { code: 'khau-ty', name: 'Doi Khau Ty', description: 'Khu doi lich su', icon: 'mountain', mapX: 18, mapY: 35, totalLights: 38, activeLights: 38 },
    { code: 'tin-keo', name: 'Lan Tin Keo', description: 'Noi Bac Ho lam viec 1947-1948', icon: 'house', mapX: 56, mapY: 14, totalLights: 32, activeLights: 32 },
    { code: 'memorial', name: 'Nha tuong niem', description: 'Nha tuong niem anh hung liet si', icon: 'temple', mapX: 54, mapY: 44, totalLights: 56, activeLights: 56 },
    { code: 'square', name: 'Quang truong', description: 'Quang truong trung tam', icon: 'monument', mapX: 78, mapY: 60, totalLights: 42, activeLights: 22 },
  ];

  for (const areaData of areasData) {
    const area = await prisma.area.upsert({
      where: { code: areaData.code },
      create: { ...areaData, power: true },
      update: { totalLights: areaData.totalLights, activeLights: areaData.activeLights },
    });
    const existing = await prisma.lightDevice.count({ where: { areaId: area.id } });
    if (existing === 0) {
      const lights = Array.from({ length: areaData.totalLights }, (_, i) => ({
        areaId: area.id,
        name: `${areaData.name} - Den ${String(i + 1).padStart(2, '0')}`,
        deviceCode: `${areaData.code}-L${String(i + 1).padStart(3, '0')}`,
        power: i < areaData.activeLights,
        brightness: 70,
        colorTemperature: 4000,
        status: 'ONLINE',
      }));
      await prisma.lightDevice.createMany({ data: lights });
    }
    console.log(`✅ Area: ${areaData.name} (${areaData.totalLights} lights)`);
  }

  // Users
  const usersData = [
    { username: 'superadmin', email: 'superadmin@atk.vn', fullName: 'Quan tri toi cao', role: 'SUPER_ADMIN', password: 'SuperAdmin@2026' },
    { username: 'admin', email: 'admin@atk.vn', fullName: 'Quan tri vien', role: 'ADMIN', password: 'Admin@2026' },
    { username: 'operator', email: 'operator@atk.vn', fullName: 'Nguoi van hanh', role: 'OPERATOR', password: 'Operator@2026' },
    { username: 'viewer', email: 'viewer@atk.vn', fullName: 'Nguoi xem', role: 'VIEWER', password: 'Viewer@2026' },
  ];
  for (const u of usersData) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { username: u.username },
      create: { username: u.username, email: u.email, fullName: u.fullName, role: u.role, passwordHash, status: 'ACTIVE' },
      update: { passwordHash },
    });
    console.log(`✅ User: ${u.username} (${u.role}) | pass: ${u.password}`);
  }

  // Schedules
  await prisma.schedule.deleteMany({});
  await prisma.schedule.createMany({
    data: [
      { name: 'Bat chieu sang buoi toi', startTime: '18:00', daysOfWeek: '1,2,3,4,5,6,7', sceneCode: 'TOUR', power: true, enabled: true },
      { name: 'Chuyen tiet kiem khuya', startTime: '22:30', daysOfWeek: '1,2,3,4,5,6,7', sceneCode: 'ENERGY_SAVING', power: true, enabled: true },
      { name: 'Tat he thong ban dem', startTime: '00:00', daysOfWeek: '1,2,3,4,5,6,7', power: false, enabled: true },
    ],
  });
  console.log('✅ Schedules OK');

  // Energy records (today)
  const today = new Date(); today.setHours(0,0,0,0);
  const existingEnergy = await prisma.energyRecord.count({ where: { recordedAt: { gte: today } } });
  if (existingEnergy === 0) {
    const energyData = [3,3,4,4,4,5,6,8,10,9,8,7,7,6,8,10,13,16,13,18,15,12,11,20,17,9];
    const base = new Date(); base.setHours(0,0,0,0);
    await prisma.energyRecord.createMany({
      data: energyData.map((value, i) => ({
        energy: value,
        power: value * 1000 / 3600,
        recordedAt: new Date(base.getTime() + i * (24 / 25) * 3600 * 1000),
      })),
    });
    console.log('✅ Energy records OK');
  }

  // Alerts
  const alertCount = await prisma.alert.count();
  if (alertCount === 0) {
    await prisma.alert.createMany({
      data: [
        { type: 'SYSTEM_OK', severity: 'INFO', title: 'He thong hoat dong binh thuong', message: 'He thong chieu sang on dinh', createdAt: new Date(Date.now() - 2*60*60*1000) },
        { type: 'SCHEDULE_EXECUTED', severity: 'INFO', title: 'Lich tu dong: Tham quan', message: 'Den khu vuc da bat theo lich', createdAt: new Date(Date.now() - 5*60*60*1000) },
        { type: 'SYSTEM_CHECK', severity: 'INFO', title: 'Hoan tat kiem tra dinh ky', message: 'Tat ca cac khu vuc deu hoat dong tot', createdAt: new Date(Date.now() - 24*60*60*1000) },
      ],
    });
    console.log('✅ Alerts OK');
  }

  console.log('\n🎉 Seed completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
