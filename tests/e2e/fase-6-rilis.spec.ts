import { expect, test } from '@playwright/test';

test.describe('Fase 6 — PWA, Penilaian Dinamis, Aksesibilitas Skip-Link, & Tangkapan Layar Rilis', () => {
  test('audit aksesibilitas keyboard: skip-link, aria-controls tabpanel, dan layar hasil dinamis', async ({
    page,
  }) => {
    await page.goto('/#beranda');

    // Tekan Tab pertama kali -> memfokuskan tautan "Lewati ke konten utama"
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Lewati ke konten utama' });
    await expect(skipLink).toBeFocused();

    // Periksa atribut ARIA tab & tabpanel pada halaman pelajaran
    await page.goto('/#motherboard');
    const overviewTab = page.locator('#tab-overview');
    await expect(overviewTab).toHaveAttribute('aria-controls', 'panel-overview');
    await expect(page.locator('#panel-overview')).toHaveAttribute(
      'aria-labelledby',
      'tab-overview',
    );
  });

  test('penilaian dinamis di #hasil berubah dari 0/100 (belum diuji) -> skor merakit parsial -> 100/100 saat POST sukses', async ({
    page,
  }) => {
    await page.goto('/#hasil');
    await expect(page.getByTestId('result-status-text')).toContainText('Belum diuji POST');
    await expect(page.getByTestId('result-total-score')).toContainText('0 / 100');

    await page.screenshot({
      path: 'docs/screenshots/fase-6/hasil-belum-mulai-1280px.png',
      fullPage: true,
    });

    // Buka meja perakitan dan pasang beberapa komponen (tanpa POST dulu)
    await page.goto('/#rakit-pc');
    await page.getByTestId('unlock-prereqs-practice-btn').click();
    await page.getByTestId('install-motherboard-btn').click();
    await page.getByTestId('install-cpu-btn').click();

    // Cek layar #hasil saat baru memasang sebagian komponen (skor parsial terhitung otomatis)
    await page.getByRole('link', { name: 'Hasil' }).click();
    await expect(page.getByTestId('result-status-text')).toContainText('MERAKIT');
    await expect(page.getByTestId('result-total-score')).not.toContainText('0 / 100');

    // Kembali ke meja perakitan, selesaikan rakitan penuh, dan nyalakan POST
    await page.goto('/#rakit-pc');
    await page.getByTestId('auto-assemble-valid-btn').click();
    await page.getByTestId('power-on-post-btn').click();

    await page.screenshot({
      path: 'docs/screenshots/fase-6/simulasi-3d-final-1280px.png',
      fullPage: true,
    });

    await page.getByTestId('open-teacher-results-btn').click();
    await expect(page.getByTestId('result-status-text')).toContainText('POST berhasil');
    await expect(page.getByTestId('result-total-score')).toContainText('100 / 100');

    await page.screenshot({
      path: 'docs/screenshots/fase-6/hasil-setelah-post-1280px.png',
      fullPage: true,
    });
  });
});
