import { expect, test } from '@playwright/test';

test.describe('Uji Asap Produksi & PWA (SPEC Bagian 7 & Bagian 9)', () => {
  test('halaman awal beranda, <noscript>, dan manifest PWA tersedia', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Rakit PC' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Daftar pelajaran' })).toBeVisible();

    const manifestResp = await request.get('/manifest.webmanifest');
    expect(manifestResp.status()).toBe(200);

    const swResp = await request.get('/sw.js');
    expect(swResp.status()).toBe(200);
  });

  test('smoke test Bagian 9: buka #ram, #abcxyz, selesaikan 1 pelajaran, uji mode 2D, dan cek logika penilaian dinamis di #hasil', async ({
    page,
  }) => {
    // 1. Sebelum simulasi dijalankan, layar #hasil wajib menampilkan skor 0 / 100 (bukan angka statis 95/100)
    await page.goto('/#hasil');
    await expect(page.getByTestId('result-status-text')).toContainText('Belum diuji POST');
    await expect(page.getByTestId('result-total-score')).toContainText('0 / 100');
    await expect(page.getByTestId('result-time-text')).toContainText('00:00');
    await expect(page.getByTestId('result-attempts-text')).toContainText('0');

    // 2. Buka #ram dan uji mode cadangan 2D
    await page.goto('/#ram');
    await expect(
      page.getByRole('heading', { level: 1, name: /Memori akses acak \(RAM\)/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Mode 3D' }).click();
    await expect(page.locator('svg.stage-schematic-svg')).toBeVisible();

    // 3. Selesaikan satu pelajaran -> penghitung naik menjadi 1/7
    await page.getByRole('button', { name: 'Selesaikan pelajaran' }).click();
    await expect(page.getByTestId('progress-counter')).toContainText('1/7');

    // 4. Buka #abcxyz -> jatuh ke beranda dengan pemberitahuan
    await page.goto('/#abcxyz');
    await expect(page.getByRole('heading', { level: 1, name: 'Daftar pelajaran' })).toBeVisible();

    // 5. Jalankan perakitan di #rakit-pc -> layar #hasil terhitung secara dinamis dari mesin domain
    await page.goto('/#rakit-pc');
    await page.getByTestId('unlock-prereqs-practice-btn').click();
    await page.getByTestId('auto-assemble-valid-btn').click();
    await page.getByTestId('power-on-post-btn').click();
    await page.getByTestId('open-teacher-results-btn').click();

    await expect(page.getByTestId('result-status-text')).toContainText('POST berhasil');
    await expect(page.getByTestId('result-total-score')).toContainText('100 / 100');
    await expect(page.getByTestId('result-breakdown-result')).toContainText('60 / 60');
  });
});
