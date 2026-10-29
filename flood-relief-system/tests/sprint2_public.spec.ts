import { test, expect } from '@playwright/test';

test.describe('Sprint 2 - Public Intake Form', () => {
  test.use({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1' });

  test('TS-16: Should handle geolocation successfully', async ({ page, context }) => {
    // Mocking Geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    
    await page.goto('/report');
    await page.click('text=ดึงตำแหน่งปัจจุบันของฉัน');
    await expect(page.locator('text=ดึงพิกัดตำแหน่งปัจจุบันสำเร็จแล้ว')).toBeVisible();
  });

  test('TS-06: Should trigger rate limit after 5 submissions', async ({ request }) => {
    // This would be an API test
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/public/cases', { data: { /* valid data */ } });
      expect(res.status()).toBe(201);
    }
    const res6 = await request.post('/api/public/cases', { data: { /* valid data */ } });
    expect(res6.status()).toBe(429);
  });
});
