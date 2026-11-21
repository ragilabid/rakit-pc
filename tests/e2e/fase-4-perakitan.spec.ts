import { expect, test } from '@playwright/test';

test.describe('Fase 4 — Simulasi Perakitan Interaktif, Kegagalan Fisik/Logis, & Diagnosis Bip AMI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#rakit-pc');
    // Buka prasyarat dasar untuk masuk ke meja simulasi perakitan
    await page.getByTestId('unlock-prereqs-practice-btn').click();
    await expect(page.getByTestId('assembly-simulator')).toBeVisible();
  });

  test('[KU-30] [KU-47] [KU-51] [KU-52] [KU-53] alur rakitan benar langkah demi langkah hingga POST sukses dan layar hasil guru', async ({
    page,
  }) => {
    // Pengingat ESD tampil tetapi tidak memblokir perakitan (KU-51)
    await expect(page.getByTestId('esd-reminder-box')).toBeVisible();

    // 1. Siapkan Motherboard B650 ATX (AM5, DDR5)
    await page.getByTestId('install-motherboard-btn').click();
    await expect(page.getByTestId('installed-mb-badge')).toContainText('B650 ATX');

    // 2. Pasang CPU Ryzen 5 7600 (AM5) dengan segitiga sejajar
    await page.getByTestId('install-cpu-btn').click();
    await expect(page.getByTestId('installed-cpu-badge')).toContainText('Ryzen 5 7600');

    // 3. Oleskan pasta termal & pasang pendingin CPU
    await page.getByTestId('apply-paste-btn').click();
    await expect(page.getByTestId('paste-applied-badge')).toBeVisible();
    await page.getByTestId('install-cooler-btn').click();

    // 4. Pasang RAM di A2, lepas, lalu pasang lagi di A2 dan B2 tanpa komponen ganda (KU-47)
    await page.getByTestId('install-ram-btn').click();
    await expect(page.getByTestId('ram-slot-chip-A2')).toBeVisible();
    await page.getByTestId('remove-ram-A2').click();
    await expect(page.getByTestId('ram-slot-chip-A2')).toHaveCount(0);

    await page.getByTestId('install-ram-btn').click();
    await page.locator('#sim-ram-slot').selectOption('B2');
    await page.getByTestId('install-ram-btn').click();
    await expect(page.getByTestId('ram-slot-chip-A2')).toBeVisible();
    await expect(page.getByTestId('ram-slot-chip-B2')).toBeVisible();

    // 5. Pasang SSD NVMe M.2 (OS Terpasang)
    await page.getByTestId('install-storage-btn').click();

    // 6. Siapkan casing ATX, standoff sesuai, & masukkan motherboard ke casing
    await page.getByTestId('install-case-btn').click();
    await page.getByTestId('mount-board-btn').click();
    await expect(page.getByTestId('mounted-in-case-badge')).toBeVisible();

    // 7. Pasang PSU 650 W & GPU RTX 4060
    await page.getByTestId('install-psu-btn').click();
    await page.getByTestId('install-gpu-btn').click();

    // 8. Hubungkan seluruh kabel daya (ATX 24-pin, CPU 8-pin, PCIe 8-pin), front panel, & monitor ke GPU
    await page.getByTestId('cable-atx24-checkbox').check();
    await page.getByTestId('cable-cpu8-checkbox').check();
    await page.getByTestId('cable-pcie8-checkbox').check();
    await page.getByTestId('cable-frontpanel-checkbox').check();

    // 9. Nyalakan PC -> POST berhasil dengan 1 bip pendek (KU-30, KU-53)
    await page.getByTestId('power-on-post-btn').click();
    await expect(page.getByTestId('post-success-banner')).toBeVisible();
    await expect(page.getByTestId('post-success-banner')).toContainText('1 pendek');

    // 10. Buka layar hasil untuk dilihat guru secara tatap muka (KU-52)
    await page.getByTestId('open-teacher-results-btn').click();
    await expect(page.getByTestId('teacher-results-screen')).toBeVisible();
    await expect(page.getByTestId('result-status-text')).toContainText('POST berhasil');
    await expect(page.getByTestId('result-total-score')).toContainText('100 / 100');
  });

  test('[KU-31] [KU-32] [KU-46] kegagalan FISIK (urutan salah, soket CPU salah, tipe RAM salah) ditolak langsung dengan penjelasan', async ({
    page,
  }) => {
    // 1. Siapkan Motherboard B760 ATX (LGA1700, DDR5)
    await page.locator('#sim-mb-select').selectOption('mb-b760-atx-ddr5');
    await page.getByTestId('install-motherboard-btn').click();

    // Coba pasang motherboard ke casing sebelum CPU & RAM -> ditolak karena melanggar urutan (KU-46)
    await page.getByTestId('install-case-btn').click();
    await page.getByTestId('mount-board-btn').click();
    const rejectionAlert = page.getByTestId('physical-rejection-alert');
    await expect(rejectionAlert).toBeVisible();
    await expect(rejectionAlert).toHaveAttribute('data-rejection-code', 'OUT_OF_ORDER_STEP');

    // Coba pasang CPU Ryzen 5 7600 (AM5) ke motherboard LGA1700 -> ditolak fisik (KU-31)
    await page.locator('#sim-cpu-select').selectOption('cpu-ryzen5-7600');
    await page.getByTestId('install-cpu-btn').click();
    await expect(rejectionAlert).toHaveAttribute('data-rejection-code', 'CPU_SOCKET_MISMATCH');
    await expect(rejectionAlert).toContainText('Soket CPU tidak cocok');

    // Pasang CPU Intel i5-13400F (LGA1700) yang cocok
    await page.locator('#sim-cpu-select').selectOption('cpu-i5-13400f');
    await page.getByTestId('install-cpu-btn').click();
    await expect(page.getByTestId('installed-cpu-badge')).toContainText('i5-13400F');

    // Coba pasang RAM DDR4 ke slot DDR5 -> ditolak fisik dengan penjelasan notch (KU-32)
    await page.locator('#sim-ram-select').selectOption('ram-ddr4-16gb');
    await page.getByTestId('install-ram-btn').click();
    await expect(rejectionAlert).toHaveAttribute('data-rejection-code', 'RAM_TYPE_MISMATCH');
    await expect(rejectionAlert).toContainText('notch');
  });

  test('[KU-36] [KU-38] [KU-54] [KU-56] kegagalan LOGIS (kabel daya lupa, PSU kurang, RAM bermasalah) gagal saat POST dan dievaluasi lewat diagnosis', async ({
    page,
  }) => {
    // Bangun rakitan standar lengkap terlebih dahulu
    await page.getByTestId('auto-assemble-valid-btn').click();

    // 1. Lepas kabel ATX 24-pin -> gagal menyala saat dinyalakan (KU-38)
    await page.getByTestId('cable-atx24-checkbox').uncheck();
    await page.getByTestId('power-on-post-btn').click();
    const postFailure = page.getByTestId('post-failure-banner');
    await expect(postFailure).toBeVisible();
    await expect(postFailure).toHaveAttribute('data-issue-code', 'MISSING_ATX_24PIN');

    // Pasang kembali kabel ATX 24-pin
    await page.getByTestId('cable-atx24-checkbox').check();

    // 2. Uji daya PSU kurang: ganti motherboard LGA1700 + CPU i9-13900K (250W) + GPU 320W + PSU 450W = beban 650W > 450W (KU-36)
    await page.locator('#sim-mb-select').selectOption('mb-b760-atx-ddr5');
    await page.getByTestId('install-motherboard-btn').click();
    await page.locator('#sim-cpu-select').selectOption('cpu-i9-13900k');
    await page.getByTestId('install-cpu-btn').click();
    await page.locator('#sim-gpu-select').selectOption('gpu-high-power-320w');
    await page.getByTestId('install-gpu-btn').click();
    await page.locator('#sim-psu-select').selectOption('psu-450w');
    await page.getByTestId('install-psu-btn').click();

    await expect(page.getByTestId('power-meter-readout')).toContainText('650 W');
    await expect(page.getByTestId('power-meter-readout')).toContainText('450 W');

    await page.getByTestId('power-on-post-btn').click();
    await expect(postFailure).toHaveAttribute('data-issue-code', 'PSU_WATTAGE_INSUFFICIENT');

    // Naikkan PSU ke 650 W, lalu lepas seluruh RAM untuk menguji kode bip AMI memori & diagnosis (KU-54, KU-56)
    await page.locator('#sim-psu-select').selectOption('psu-650w');
    await page.getByTestId('install-psu-btn').click();
    await page.getByTestId('remove-ram-A2').click();
    await page.getByTestId('remove-ram-B2').click();

    await page.getByTestId('power-on-post-btn').click();
    await expect(postFailure).toHaveAttribute('data-issue-code', 'MISSING_RAM');
    await expect(postFailure).toContainText('3 pendek berulang');

    // Siswa memilih jawaban diagnosis yang keliru (mis. PSU kurang) -> umpan balik menjelaskan mengapa salah (KU-56)
    await page.locator('#sim-diagnosis-select').selectOption('PSU_WATTAGE_INSUFFICIENT');
    await page.getByTestId('check-diagnosis-btn').click();
    const diagFeedback = page.getByTestId('diagnosis-feedback-box');
    await expect(diagFeedback).toHaveAttribute('data-correct', 'false');
    await expect(diagFeedback).toContainText('Pilihan Anda belum tepat karena');

    // Siswa memilih jawaban diagnosis yang benar (MISSING_RAM)
    await page.locator('#sim-diagnosis-select').selectOption('MISSING_RAM');
    await page.getByTestId('check-diagnosis-btn').click();
    await expect(diagFeedback).toHaveAttribute('data-correct', 'true');
  });

  test('simpan tangkapan layar Fase 4 pada lebar 320, 768, dan 1280 px tanpa overflow horizontal', async ({
    page,
  }) => {
    await page.getByTestId('auto-assemble-valid-btn').click();
    await page.getByTestId('power-on-post-btn').click();

    const viewports = [
      { width: 320, height: 640 },
      { width: 768, height: 900 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBe(false);

      await page.screenshot({
        path: `docs/screenshots/fase-4/simulasi-rakit-${vp.width}px.png`,
        fullPage: true,
      });
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByTestId('open-teacher-results-btn').click();
    await expect(page.getByTestId('teacher-results-screen')).toBeVisible();
    await page.screenshot({
      path: 'docs/screenshots/fase-4/layar-hasil-guru-1280px.png',
      fullPage: true,
    });
  });
});
