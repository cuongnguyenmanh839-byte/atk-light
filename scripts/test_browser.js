const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  const outputDir = path.join(__dirname, '..', 'reports_images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e2) {
      console.error('Could not launch msedge or chrome:', e2.message);
      process.exit(1);
    }
  }

  console.log('Browser launched successfully!');
  await browser.close();
}

run().catch(console.error);
