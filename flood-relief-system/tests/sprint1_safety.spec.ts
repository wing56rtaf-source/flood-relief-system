// Playwright E2E Test Suite - Flood Relief System
import { test, expect } from '@playwright/test';

test.describe('Sprint 1 - Safety & Auth', () => {
  test('TS-02: Public Intake should be hidden by default', async ({ page }) => {
    const response = await page.goto('/report');
    expect(response?.status()).toBe(404);
  });

  // More tests to be implemented once @fullstack-dev provides the endpoints
});
