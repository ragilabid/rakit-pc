import { expect, test } from '@playwright/test';

test.describe('Kategori A & C — UI 2D, Navigasi, Progres, dan Konten (Playwright)', () => {
  test('[KU-01] [KU-03] buka tautan langsung #ram dan #RAM membuka pelajaran RAM yang sama', async ({
    page,
  }) => {
    await page.goto('/#ram');
    await expect(
      page.getByRole('heading', { level: 1, name: /Memori akses acak \(RAM\)/i }),
    ).toBeVisible();

    await page.goto('/#RAM');
    await expect(
      page.getByRole('heading', { level: 1, name: /Memori akses acak \(RAM\)/i }),
    ).toBeVisible();
  });

  test('[KU-02] tautan langsung ke slug tidak dikenal (#abcxyz) jatuh ke beranda tanpa layar kosong', async ({
    page,
  }) => {
    await page.goto('/#abcxyz');
    await expect(page.getByRole('heading', { level: 1, name: 'Daftar pelajaran' })).toBeVisible();
    await expect(page.getByText(/Halaman yang dituju tidak ditemukan/i)).toBeVisible();
  });

  test('[KU-04] [KU-05] [KU-06] selesaikan pelajaran (idempoten) dan pulihkan saat muat ulang halaman', async ({
    page,
  }) => {
    await page.goto('/#motherboard');
    await expect(page.getByTestId('progress-counter')).toContainText('0/7');

    const completeBtn = page.getByRole('button', { name: 'Selesaikan pelajaran' });
    await completeBtn.click();
    await expect(page.getByTestId('progress-counter')).toContainText('1/7');

    // Klik kedua kali tidak menaikkan penghitung menjadi 2/7 (KU-05)
    await completeBtn.click();
    await expect(page.getByTestId('progress-counter')).toContainText('1/7');

    // Muat ulang halaman di tengah pelajaran (KU-06)
    await page.reload();
    await expect(page.getByTestId('progress-counter')).toContainText('1/7');
    await expect(
      page.getByRole('heading', { level: 1, name: /Motherboard \(papan induk\)/i }),
    ).toBeVisible();
  });

  test('[KU-08] pelajaran Rakit PC dikunci sampai seluruh prasyarat selesai', async ({ page }) => {
    await page.goto('/#rakit-pc');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Pelajaran ini masih terkunci' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Selesaikan pelajaran' })).toHaveCount(0);
  });

  test('[KU-09] hapus progres di Pengaturan meminta konfirmasi lalu kembali ke 0/7', async ({
    page,
  }) => {
    await page.goto('/#motherboard');
    await page.getByRole('button', { name: 'Selesaikan pelajaran' }).click();
    await expect(page.getByTestId('progress-counter')).toContainText('1/7');

    await page.getByRole('link', { name: 'Pengaturan' }).click();
    await page.getByRole('button', { name: 'Hapus seluruh progres belajar' }).click();

    // Dialog konfirmasi muncul
    await expect(
      page.getByRole('heading', { name: 'Konfirmasi penghapusan progres' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ya, hapus semua progres' }).click();

    await expect(page.getByTestId('progress-counter')).toContainText('0/7');
  });

  test('[KU-11] jika localStorage diblokir, aplikasi tetap jalan dan menampilkan pemberitahuan', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('SecurityError: localStorage disabled');
        },
      });
    });
    const page = await context.newPage();
    await page.goto('/#ram');
    await expect(
      page.getByRole('heading', { level: 1, name: /Memori akses acak \(RAM\)/i }),
    ).toBeVisible();
    await expect(page.getByTestId('storage-warning-banner')).toBeVisible();
    await context.close();
  });

  test('[KU-12] tombol Back dan Forward browser berfungsi antar pelajaran', async ({ page }) => {
    await page.goto('/#motherboard');
    await expect(
      page.getByRole('heading', { level: 1, name: /Motherboard \(papan induk\)/i }),
    ).toBeVisible();

    await page.goto('/#cpu');
    await expect(page.getByRole('heading', { level: 1, name: /Prosesor \(CPU\)/i })).toBeVisible();

    await page.goBack();
    await expect(
      page.getByRole('heading', { level: 1, name: /Motherboard \(papan induk\)/i }),
    ).toBeVisible();

    await page.goForward();
    await expect(page.getByRole('heading', { level: 1, name: /Prosesor \(CPU\)/i })).toBeVisible();
  });

  test('[KU-22] [KU-23] [KU-28] klik komponen di panggung, buka tab Spesifikasi, dan ganti bahasa', async ({
    page,
  }) => {
    await page.goto('/#ram');

    // Klik komponen Alur Kunci (Notch) RAM di daftar panggung (KU-23)
    await page.getByRole('button', { name: 'Alur Kunci (Notch) RAM' }).click();
    await expect(page.getByTestId('selected-stage-part')).toContainText(
      'Celah Penanda Orientasi Modul RAM',
    );

    // Buka tab Spesifikasi (KU-22)
    await page.getByRole('tab', { name: 'Spesifikasi' }).click();
    await expect(page.getByText(/DDR4 \(288 pin/i)).toBeVisible();

    // Ganti bahasa ke Inggris (KU-28)
    await page.getByLabel('Bahasa').selectOption('en');
    await expect(
      page.getByRole('heading', { level: 1, name: /Random access memory \(RAM\)/i }),
    ).toBeVisible();
    await expect(page.getByTestId('selected-stage-part')).toContainText(
      'RAM Module Alignment Notch',
    );
  });

  test('[KU-18] responsif di lebar 320, 768, dan 1280 px serta simpan tangkapan layar Fase 2', async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 640 },
      { width: 768, height: 900 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/#beranda');
      await expect(page.getByRole('heading', { level: 1, name: 'Daftar pelajaran' })).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);

      await page.screenshot({
        path: `docs/screenshots/fase-2/beranda-${vp.width}px.png`,
        fullPage: true,
      });

      await page.goto('/#ram');
      await expect(
        page.getByRole('heading', { level: 1, name: /Memori akses acak \(RAM\)/i }),
      ).toBeVisible();
      await page.screenshot({
        path: `docs/screenshots/fase-2/pelajaran-ram-${vp.width}px.png`,
        fullPage: true,
      });
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#hasil');
    await expect(
      page.getByRole('heading', { level: 1, name: /Hasil simulasi perakitan & POST/i }),
    ).toBeVisible();
    try {
      await page.screenshot({
        path: 'docs/screenshots/fase-2/hasil-1280px.png',
        fullPage: true,
      });
    } catch {
      // Abaikan bila berkas tangkapan layar lama sedang dibuka oleh peninjau gambar Windows
    }
  });
});
