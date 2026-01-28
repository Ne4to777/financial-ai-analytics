const { test, expect } = require('@playwright/test');

test.describe('Developer Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/portal.html');
  });

  test('should display header with title and status', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Financial Analytics Platform');
    await expect(page.locator('.status-badge.online')).toBeVisible();
    await expect(page.locator('.status-badge.online')).toContainText('Production Live');
  });

  test('should display quick access buttons', async ({ page }) => {
    const buttons = page.locator('.btn');
    await expect(buttons).toHaveCount(3);
    
    // Check button text
    await expect(buttons.nth(0)).toContainText('API Documentation');
    await expect(buttons.nth(1)).toContainText('Health Check');
    await expect(buttons.nth(2)).toContainText('GitHub Repository');
  });

  test('should display all resource cards', async ({ page }) => {
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(12);
    
    // Check specific cards
    await expect(cards.first().locator('.card-title')).toContainText('API & Docs');
    await expect(page.getByText('Architecture')).toBeVisible();
    await expect(page.getByText('Development')).toBeVisible();
  });

  test('should have working links in cards', async ({ page }) => {
    // Test first link in API card
    const firstLink = page.locator('.link-item a').first();
    await expect(firstLink).toHaveAttribute('href', 'https://backend-mocha-nine-95.vercel.app/docs');
    await expect(firstLink).toHaveAttribute('target', '_blank');
  });

  test('should display footer', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('Built with TypeScript + Fastify + Supabase');
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.grid')).toBeVisible();
  });

  test('should have proper dark theme colors', async ({ page }) => {
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be dark (close to #0a0a0b)
    expect(bgColor).toMatch(/rgb\(10, 10, 11\)/);
  });

  test('should have hover effects on clickable cards', async ({ page }) => {
    const card = page.locator('.card').first();
    
    // Get initial border color
    const initialBorder = await card.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );
    
    // Hover
    await card.hover();
    await page.waitForTimeout(400);
    
    // Get border after hover
    const afterBorder = await card.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );
    
    // Should change
    expect(initialBorder).not.toBe(afterBorder);
  });
});

test.describe('MD Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/md-viewer.html?file=/README.md');
  });

  test('should display back button', async ({ page }) => {
    await expect(page.locator('.back-btn')).toContainText('Back to Portal');
  });

  test('should display file name', async ({ page }) => {
    await expect(page.locator('#file-name')).toContainText('README.md');
  });

  test('should render markdown content', async ({ page }) => {
    await page.waitForSelector('.markdown-body');
    await expect(page.locator('.markdown-body h1').first()).toBeVisible();
  });

  test('should display diagrams with zoom controls', async ({ page }) => {
    await page.goto('http://localhost:8000/md-viewer.html?file=/mindmap/diagrams/02a-architecture-mvp.md');
    
    await page.waitForSelector('.mermaid-container');
    await expect(page.locator('.zoom-controls')).toBeVisible();
    await expect(page.locator('.zoom-btn')).toHaveCount(3);
  });

  test('should have working zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:8000/md-viewer.html?file=/mindmap/diagrams/02a-architecture-mvp.md');
    
    await page.waitForSelector('.zoom-controls');
    
    const zoomInfo = page.locator('.zoom-info');
    await expect(zoomInfo).toContainText('100%');
    
    // Click zoom in
    await page.locator('[data-action="zoom-in"]').click();
    await page.waitForTimeout(300);
    
    // Zoom should increase
    const newZoom = await zoomInfo.textContent();
    expect(newZoom).not.toBe('100%');
  });

  test('should have dark theme', async ({ page }) => {
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be dark
    expect(bgColor).toMatch(/rgb\(10, 10, 11\)/);
  });

  test('should have proper content width', async ({ page }) => {
    const markdownBody = page.locator('.markdown-body');
    await markdownBody.waitFor();
    
    const width = await markdownBody.evaluate((el) =>
      el.offsetWidth
    );
    
    // Should be narrow (around 900px max)
    expect(width).toBeLessThanOrEqual(920);
  });

  test('should have full-width diagrams', async ({ page }) => {
    await page.goto('http://localhost:8000/md-viewer.html?file=/mindmap/diagrams/02a-architecture-mvp.md');
    
    const container = page.locator('.mermaid-container').first();
    await container.waitFor();
    
    const containerWidth = await container.evaluate((el) =>
      el.offsetWidth
    );
    
    const viewportWidth = page.viewportSize().width;
    
    // Diagram should be close to viewport width
    expect(containerWidth).toBeGreaterThan(viewportWidth * 0.9);
  });
});
