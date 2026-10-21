const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function main() {
  const outputDir = path.join(__dirname, '..', 'Bao_Cao_Hinh_Anh_He_Thong');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const BASE = 'http://127.0.0.1:5173';

  // 1. DESKTOP CONTEXT
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();

  console.log('Navigating to web app...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Auto login if needed
  const adminBtn = page.locator('button:has-text("Admin")').first();
  if (await adminBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await adminBtn.click();
    await page.waitForTimeout(800);
  }

  const closeDialogIfOpen = async () => {
    const closeBtn = page.locator('.detail-header button[aria-label="Đóng"], button[aria-label="Đóng"]').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click({ force: true });
      await page.waitForTimeout(400);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  };

  // 01: Desktop Tong quan
  await closeDialogIfOpen();
  console.log('Capturing 01_Desktop_Tong_Quan_He_Thong.png...');
  await page.screenshot({ path: path.join(outputDir, '01_Desktop_Tong_Quan_He_Thong.png') });

  // Helper to open tab
  const openTab = async (label) => {
    await closeDialogIfOpen();
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
      return true;
    }
    return false;
  };

  // 02: Vu Dieu Anh Sang & Am Nhac Lich Su
  console.log('Capturing 02_Desktop_Vu_Dieu_Anh_Sang_Am_Nhac_Lich_Su.png...');
  if (await openTab('Âm nhạc lịch sử')) {
    await page.screenshot({ path: path.join(outputDir, '02_Desktop_Vu_Dieu_Anh_Sang_Am_Nhac_Lich_Su.png') });
  }

  // 03: Khu vuc chieu sang
  console.log('Capturing 03_Desktop_Dieu_Khien_Khu_Vuc_Den.png...');
  if (await openTab('Khu vực')) {
    await page.screenshot({ path: path.join(outputDir, '03_Desktop_Dieu_Khien_Khu_Vuc_Den.png') });
  }

  // 04: Giam sat nang luong
  console.log('Capturing 04_Desktop_Giam_Sat_Nang_Luong.png...');
  if (await openTab('Giám sát năng lượng')) {
    await page.screenshot({ path: path.join(outputDir, '04_Desktop_Giam_Sat_Nang_Luong.png') });
  }

  // 05: Lich hoat dong
  console.log('Capturing 05_Desktop_Lich_Hoat_Dong_Tu_Dong.png...');
  if (await openTab('Lịch hoạt động')) {
    await page.screenshot({ path: path.join(outputDir, '05_Desktop_Lich_Hoat_Dong_Tu_Dong.png') });
  }

  // 06: Phan quyen bao mat
  console.log('Capturing 06_Desktop_Phan_Quyen_Bao_Mat.png...');
  if (await openTab('Phân quyền')) {
    await page.screenshot({ path: path.join(outputDir, '06_Desktop_Phan_Quyen_Bao_Mat.png') });
  }

  // 07: Modal Dang Nhap
  console.log('Capturing 07_Desktop_Hop_Thoai_Dang_Nhap.png...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('atk-access-token');
    localStorage.removeItem('atk-refresh-token');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '07_Desktop_Hop_Thoai_Dang_Nhap.png') });

  await desktopContext.close();

  // 2. MOBILE / APK CONTEXT (Samsung Galaxy S23 style)
  console.log('Opening mobile context for APK...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobileContext.newPage();
  await mPage.goto(BASE, { waitUntil: 'networkidle' });
  await mPage.waitForTimeout(800);

  // 08: Mobile APK Dang Nhap va Cau hinh IP
  console.log('Capturing 08_Mobile_APK_Dang_Nhap_Va_Cau_Hinh_IP.png...');
  const cfgBtn = mPage.locator('button:has-text("Cấu hình IP Server")').first();
  if (await cfgBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await cfgBtn.click();
    await mPage.waitForTimeout(500);
  }
  await mPage.screenshot({ path: path.join(outputDir, '08_Mobile_APK_Dang_Nhap_Va_Cau_Hinh_IP.png') });

  // Mobile Login
  const mAdminBtn = mPage.locator('button:has-text("Admin")').first();
  if (await mAdminBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await mAdminBtn.click();
    await mPage.waitForTimeout(1000);
  }

  const closeMobileDialogIfOpen = async () => {
    const closeBtn = mPage.locator('.detail-header button[aria-label="Đóng"], button[aria-label="Đóng"]').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click({ force: true });
      await mPage.waitForTimeout(400);
    } else {
      await mPage.keyboard.press('Escape');
      await mPage.waitForTimeout(300);
    }
  };

  // 09: Mobile APK Tong quan
  await closeMobileDialogIfOpen();
  console.log('Capturing 09_Mobile_APK_Tong_Quan_Giao_Dien_Doc.png...');
  await mPage.screenshot({ path: path.join(outputDir, '09_Mobile_APK_Tong_Quan_Giao_Dien_Doc.png') });

  // 10: Mobile APK Vu Dieu Anh Sang
  console.log('Capturing 10_Mobile_APK_Vu_Dieu_Anh_Sang.png...');
  const mMusicBtn = mPage.locator('button:has-text("Nhạc"), [aria-label*="nhạc"]').first();
  if (await mMusicBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await mMusicBtn.click();
    await mPage.waitForTimeout(800);
    await mPage.screenshot({ path: path.join(outputDir, '10_Mobile_APK_Vu_Dieu_Anh_Sang.png') });
  }

  // 11: Mobile APK Khu vuc
  await closeMobileDialogIfOpen();
  console.log('Capturing 11_Mobile_APK_Dieu_Khien_Khu_Vuc.png...');
  const mAreaBtn = mPage.locator('button:has-text("Khu vực")').first();
  if (await mAreaBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await mAreaBtn.click();
    await mPage.waitForTimeout(800);
    await mPage.screenshot({ path: path.join(outputDir, '11_Mobile_APK_Dieu_Khien_Khu_Vuc.png') });
  }

  await mobileContext.close();
  await browser.close();

  console.log('All screenshots captured successfully!');
}

main().catch(console.error);
