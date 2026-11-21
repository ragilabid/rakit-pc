import { expect, test } from '@playwright/test';

test('halaman awal beranda tampil beserta panggung dan daftar pelajaran', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Rakit PC' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Daftar pelajaran' })).toBeVisible();
});
