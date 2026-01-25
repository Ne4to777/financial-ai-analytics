#!/usr/bin/env node

/**
 * Скрипт для автоматического получения скриншотов диаграмм
 * Использование: node screenshot-diagram.js [номер диаграммы]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshot(diagramNumber) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Устанавливаем размер viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    // Открываем страницу viewer
    const url = `http://localhost:8000/view-diagram-full.html`;
    console.log(`📸 Открываю: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Ждём загрузки sidebar
    await page.waitForSelector('.diagram-item', { timeout: 5000 });
    
    // Выбираем нужную диаграмму через клик в sidebar
    console.log(`🎯 Выбираю диаграмму ${diagramNumber}`);
    await page.click(`[data-diagram="${diagramNumber}"]`);
    
    // Ждём рендеринга Mermaid (даём время на загрузку и рендеринг)
    await page.waitForTimeout(3000);
    
    // Делаем скриншот только области с диаграммой
    const screenshotPath = path.join(__dirname, `screenshots/diagram-${diagramNumber}.png`);
    
    // Создаём директорию если нужно
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
    
    // Скриншот только контейнера с диаграммой
    const diagramContainer = await page.$('#diagram-container');
    if (diagramContainer) {
      await diagramContainer.screenshot({ path: screenshotPath });
    } else {
      // Fallback - скриншот всей страницы
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
    }
    
    console.log(`✅ Скриншот сохранён: ${screenshotPath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// Получаем номер диаграммы из аргументов
const diagramNumber = process.argv[2] || '01';

captureScreenshot(diagramNumber)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
