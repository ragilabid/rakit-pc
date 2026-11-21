import { expect, test } from '@playwright/test';

test.describe('Kategori B — Tampilan 3D, Kontrol Kamera, Kualitas, dan Aksesibilitas (Playwright)', () => {
  test('[KU-13] perangkat tanpa WebGL2 menampilkan pesan jelas dan mengaktifkan mode cadangan 2D', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      (window as unknown as { __FORCE_NO_WEBGL2__?: boolean }).__FORCE_NO_WEBGL2__ = true;
    });
    const page = await context.newPage();
    await page.goto('/#ram');

    await expect(page.getByTestId('webgl2-unavailable-banner')).toBeVisible();
    await expect(page.getByTestId('webgl2-unavailable-banner')).toContainText('WebGL2');
    await expect(page.locator('svg.stage-schematic-svg')).toBeVisible();
    await context.close();
  });

  test('[KU-14] touch-action: none hanya diterapkan pada area kanvas panggung, bukan pada body halaman', async ({
    page,
  }) => {
    await page.goto('/#ram');

    const touchActions = await page.evaluate(() => {
      const stageEl = document.querySelector('[data-testid="stage-canvas-container"]');
      return {
        bodyTouchAction: window.getComputedStyle(document.body).touchAction,
        stageTouchAction: stageEl ? window.getComputedStyle(stageEl).touchAction : '',
      };
    });

    expect(touchActions.stageTouchAction).toBe('none');
    expect(touchActions.bodyTouchAction).not.toBe('none');
  });

  test('[KU-15] zoom kamera berhenti di batas min/max (2.2 m s.d. 9.0 m) dan tidak menembus model', async ({
    page,
  }) => {
    await page.goto('/#motherboard');
    const readout = page.getByTestId('camera-status-readout');
    await expect(readout).toHaveAttribute('data-distance', '4.5');

    // Klik zoom in (+) berulang kali melampaui batas terdekat
    const zoomInBtn = page.getByRole('button', { name: 'Perbesar kamera' });
    for (let i = 0; i < 12; i++) {
      await zoomInBtn.click();
    }
    await expect(readout).toHaveAttribute('data-distance', '2.2');

    // Klik zoom out (-) berulang kali melampaui batas terjauh
    const zoomOutBtn = page.getByRole('button', { name: 'Perkecil kamera' });
    for (let i = 0; i < 20; i++) {
      await zoomOutBtn.click();
    }
    await expect(readout).toHaveAttribute('data-distance', '9');
  });

  test('[KU-16] mengetik "w" di kolom isian tidak memicu pan kamera, sedangkan di luar input menggeser kamera', async ({
    page,
  }) => {
    await page.goto('/#ram');
    const readout = page.getByTestId('camera-status-readout');
    await expect(readout).toHaveAttribute('data-pan-z', '0');

    // Fokus di kolom pencarian bagian panggung lalu ketik "w"
    const searchInput = page.getByLabel('Cari bagian di panggung');
    await searchInput.focus();
    await searchInput.type('w');
    await expect(readout).toHaveAttribute('data-pan-z', '0');

    // Hapus teks, keluar dari input (fokus ke tombol reset), lalu tekan "w"
    await searchInput.fill('');
    await page.getByRole('button', { name: 'Reset posisi kamera' }).focus();
    await page.keyboard.press('w');
    await expect(readout).not.toHaveAttribute('data-pan-z', '0');
  });

  test('[KU-17] opsi kualitas Rendah/Sedang/Tinggi berfungsi dan FPS rendah memunculkan saran turun kualitas', async ({
    page,
  }) => {
    await page.goto('/#motherboard');
    const qualitySelect = page.locator('#quality-select');
    await qualitySelect.selectOption('high');
    await expect(qualitySelect).toHaveValue('high');

    // Simulasikan FPS rendah pada perangkat spek rendah
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('rakit-pc:simulate-fps', { detail: { fps: 16 } }));
    });

    const suggestion = page.getByTestId('fps-downgrade-suggestion');
    await expect(suggestion).toBeVisible();

    await page.getByRole('button', { name: 'Turunkan kualitas ke Rendah' }).click();
    await expect(qualitySelect).toHaveValue('low');
    await expect(suggestion).toHaveCount(0);
  });

  test('[KU-19] pindah tab ke latar belakang menjeda render dan kembali ke tab melanjutkan normal tanpa crash', async ({
    page,
  }) => {
    await page.goto('/#cpu');

    // Simulasikan tab disembunyikan (document.hidden = true)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('stage-render-paused-indicator')).toBeVisible();

    // Simulasikan pengguna kembali ke tab setelah beberapa menit
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('stage-render-paused-indicator')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: /Prosesor \(CPU\)/i })).toBeVisible();
  });

  test('[KU-21] aksesibilitas: navigasi komponen panggung hanya dengan keyboard dan aria-label lengkap', async ({
    page,
  }) => {
    await page.goto('/#ram');
    const notchBtn = page.getByRole('button', {
      name: /Alur Kunci \(Notch\) RAM/i,
    });
    await notchBtn.focus();
    await page.keyboard.press('Enter');

    await expect(notchBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('selected-stage-part')).toContainText(
      'Celah Penanda Orientasi Modul RAM',
    );
  });

  test('[KU-18] simpan tangkapan layar Fase 3 pada lebar 320, 768, dan 1280 px tanpa overflow horizontal', async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 640 },
      { width: 768, height: 900 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/#motherboard');
      await expect(
        page.getByRole('heading', { level: 1, name: /Motherboard \(papan induk\)/i }),
      ).toBeVisible();

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBe(false);

      await page.screenshot({
        path: `docs/screenshots/fase-3/panggung-3d-${vp.width}px.png`,
        fullPage: true,
      });
    }
  });
});
