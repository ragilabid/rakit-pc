import { expect, test } from '@playwright/test';

test.describe('Kategori F — Kuis, Latihan, Layar Hasil Guru, Persistensi, & Privasi Jaringan (Playwright)', () => {
  test('[KU-58] kuis tampil di tab Latihan dan jawaban benar/salah memberi umpan balik penjelas', async ({
    page,
  }) => {
    await page.goto('/#ram');
    await page.getByRole('tab', { name: 'Latihan' }).click();

    await expect(page.getByTestId('lesson-quiz-panel')).toBeVisible();

    // Pilih jawaban salah (opsi a) lalu periksa
    await page.getByTestId('quiz-opt-quiz-ram-1-a').check();
    await page.getByTestId('quiz-submit-quiz-ram-1').click();

    const feedback = page.getByTestId('quiz-feedback-quiz-ram-1');
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveAttribute('data-correct', 'false');
    await expect(feedback).toContainText('Kurang tepat');
    await expect(feedback).toContainText('notch');

    // Pilih jawaban benar (opsi c) lalu periksa
    await page.getByTestId('quiz-opt-quiz-ram-1-c').check();
    await page.getByTestId('quiz-submit-quiz-ram-1').click();
    await expect(feedback).toHaveAttribute('data-correct', 'true');
    await expect(feedback).toContainText('Jawaban tepat!');
    await expect(page.getByTestId('quiz-attempts-quiz-ram-1')).toContainText('2');
  });

  test('[KU-59] [KU-60] [KU-61] [KU-62] hasil simulasi & kuis tampil jelas untuk guru, bertahan setelah reload, dan terhapus saat reset progres', async ({
    page,
  }) => {
    // 1. Jawab satu kuis dengan benar di pelajaran Motherboard
    await page.goto('/#motherboard');
    await page.getByRole('tab', { name: 'Latihan' }).click();
    await page.getByTestId('quiz-opt-quiz-mb-1-b').check();
    await page.getByTestId('quiz-submit-quiz-mb-1').click();
    await expect(page.getByTestId('quiz-feedback-quiz-mb-1')).toHaveAttribute(
      'data-correct',
      'true',
    );

    // 2. Jalankan simulasi perakitan dan POST
    await page.goto('/#rakit-pc');
    await page.getByTestId('unlock-prereqs-practice-btn').click();
    await page.getByTestId('auto-assemble-valid-btn').click();
    await page.getByTestId('power-on-post-btn').click();

    // 3. Buka layar hasil untuk dilihat guru tatap muka (KU-60)
    await page.getByTestId('open-teacher-results-btn').click();
    await expect(page.getByTestId('teacher-results-screen')).toBeVisible();
    await expect(page.getByTestId('result-total-score')).toContainText('100 / 100');
    await expect(page.getByTestId('result-quiz-score')).toContainText('14%');

    // 4. Muat ulang halaman dan pastikan hasil masih tersimpan (KU-61)
    await page.reload();
    await expect(page.getByTestId('result-total-score')).toContainText('100 / 100');
    await expect(page.getByTestId('result-quiz-score')).toContainText('14%');

    // 5. Reset progres di Pengaturan (setelah konfirmasi) juga menghapus hasil tersimpan (KU-62)
    await page.getByRole('link', { name: 'Pengaturan' }).click();
    await page.getByRole('button', { name: 'Hapus seluruh progres belajar' }).click();
    await page.getByRole('button', { name: 'Ya, hapus semua progres' }).click();

    await page.getByRole('link', { name: 'Hasil' }).click();
    await expect(page.getByTestId('result-quiz-score')).toContainText('0%');
  });

  test('[KU-63] tidak ada permintaan jaringan yang mengirim data siswa atau memanggil domain eksternal', async ({
    page,
  }) => {
    const suspiciousRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      const method = req.method().toUpperCase();
      const isLocal =
        url.startsWith('http://127.0.0.1:4173') ||
        url.startsWith('http://localhost:4173') ||
        url.startsWith('data:') ||
        url.startsWith('blob:');

      if (!isLocal || method !== 'GET') {
        suspiciousRequests.push(`${method} ${url}`);
      }
    });

    await page.goto('/#motherboard');
    await page.getByRole('tab', { name: 'Latihan' }).click();
    await page.getByTestId('quiz-opt-quiz-mb-1-b').check();
    await page.getByTestId('quiz-submit-quiz-mb-1').click();
    await page.getByRole('button', { name: 'Selesaikan pelajaran' }).click();

    await page.goto('/#hasil');
    await expect(page.getByTestId('teacher-results-screen')).toBeVisible();

    expect(suspiciousRequests).toEqual([]);
  });
});
