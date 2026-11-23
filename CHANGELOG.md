# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.

## [v1.0] - 2026-11-23

### Ditambahkan

- Dukungan **PWA (Progressive Web App)** lengkap: `public/manifest.webmanifest`, Service Worker `public/sw.js` (strategi _Cache-First_ untuk aset `/assets/` & `/models/` serta _Network-First_ dengan fallback cache untuk navigasi offline), dan registrasi otomatis di `src/main.tsx`.
- Optimasi kinerja _lazy-loading_ pada lapisan 3D (`React.lazy` + `<Suspense>` untuk `PrimitiveHardwareScene` di `src/ui/StagePreview.tsx`) sehingga bundel utama aplikasi terpisah dari chunk 3D.
- Logika penilaian dinamis penuh pada layar `#hasil` (`src/App.tsx`) dan `src/ui/AssemblySimulator.tsx`: menghapus nilai statis bawaan (`95/100`), menampilkan status nyata (`Belum diuji POST` dengan skor `0 / 100` saat belum merakit), penghitung waktu rakit _real-time_ (`mm:ss`), pembaruan skor progres komponen secara langsung setiap langkah perakitan/penolakan fisik, serta perhitungan skor penuh (`hasil + waktu + percobaan - penalti peringatan`) saat `Nyalakan PC (Simulasi POST)` dijalankan.
- Penyempurnaan detail visual model 3D pada `InteractiveBuild3DAssembly` (`src/three/PrimitiveHardwareScene.tsx`): heatsink VRM bersirip, _Rear I/O shield_, bingkai soket CPU ILM + segitiga emas, keping RAM dengan chip DRAM & _heatspreader_, _tower cooler_ dengan 4 ujung pipa tembaga _heatpipe_ & kipas PWM, SSD M.2 dengan chip _controller_ perak & baut _standoff_, GPU _dual-fan_ dengan pipa _heatpipe_, serta PSU dengan kisi-kisi kipas konsentris.
- Audit & perbaikan aksesibilitas: tautan **Lewati ke konten utama** (`.skip-link`), relasi `id` / `aria-controls` / `aria-labelledby` pada seluruh tab dan panel pelajaran, serta `aria-labelledby` pada dialog konfirmasi reset progres.
- Dokumen pemetaan lengkap 63 kasus uji (`KU-01` s.d. `KU-63`) di `docs/pemetaan-kasus-uji.md`.
- Daftar uji manual rilis untuk perangkat 2018–2022, HP layar sentuh, dan jaringan lambat/offline di `docs/uji-manual-rilis.md`.
- Panduan deploy produksi **Vercel** di `README.md` beserta skrip _smoke test_ `npm run test:smoke` (`tests/e2e/smoke.spec.ts`) yang mendukung variabel lingkungan `PLAYWRIGHT_BASE_URL`.

## [v0.5-fase5] - 2026-11-21

### Ditambahkan

- Katalog perangkat keras lengkap level Fase E SMK di `src/content/lessons.json` (`deviceCatalog`): komponen **Internal**, **Peripheral Eksternal**, dan **Perangkat Usang / Sejarah**.
- Data soal kuis per pelajaran (`src/content/quiz.json`), mesin domain evaluasi kuis murni (`src/domain/quiz/index.ts`), dan komponen antarmuka kuis (`src/ui/QuizPanel.tsx`) dengan umpan balik penjelas mengapa pilihan salah keliru.
- Penyimpanan lokal jawaban & skor kuis (`quizAnswers`) di store Zustand berversi (`src/store/useProgressStore.ts`).
- 6 kasus uji Kategori F (`KU-58` s.d. `KU-63`) di Vitest (`tests/unit/domain-kategori-f.test.ts`) dan Playwright (`tests/e2e/kategori-f.spec.ts`).
- Tabel lengkap `TODO-VERIFIKASI` di `docs/verifikasi-konten.md`.

## [v0.4-fase4] - 2026-11-21

### Ditambahkan

- Komponen meja simulasi perakitan interaktif (`src/ui/AssemblySimulator.tsx`) yang menghubungkan fungsi-fungsi murni mesin domain ke panggung 3D (`InteractiveBuild3DAssembly` di `src/three/PrimitiveHardwareScene.tsx`).
- Visualisasi 3D real-time saat komponen dipasang/dilepas mengikuti urutan perakitan, penolakan langsung tingkat FISIK, evaluasi kegagalan tingkat LOGIS saat POST beserta kode bunyi bip BIOS AMI, dan panel latihan diagnosis interaktif.
- Rangkaian tes E2E Playwright Fase 4 (`tests/e2e/fase-4-perakitan.spec.ts`), fitur scroll terpisah pada panel materi/simulasi, serta tangkapan layar di `docs/screenshots/fase-4/`.

## [v0.3-fase3] - 2026-11-21

### Ditambahkan

- Scene 3D berbasis `three.js` dan `@react-three/fiber` dengan rakitan komponen perangkat keras berdetail tinggi di `src/three/PrimitiveHardwareScene.tsx`.
- Pengendali panggung & kamera 3D (`src/three/stageController.ts`), deteksi WebGL2 (`KU-13`), opsi kualitas & saran FPS otomatis (`KU-17`), jeda render saat tab tersembunyi (`KU-19`), indikator muat model (`KU-20`), dan padanan tombol aksesibilitas keyboard (`KU-21`).
- Tes unit Vitest (`tests/unit/three-kategori-b.test.ts`), tes E2E Playwright (`tests/e2e/kategori-b.spec.ts`), dan panduan uji manual (`docs/uji-manual-fase3.md`).

## [v0.2-fase2] - 2026-11-21

### Ditambahkan

- Rencana desain UI/UX (`docs/desain.md`), hash router (`src/router/index.ts`), store progres Zustand berversi (`src/store/useProgressStore.ts`), sistem i18n (`src/i18n/`) dengan `scripts/check-i18n.mjs`, serta 20 tes unit Vitest dan 10 tes E2E Playwright Kategori A & C.

## [v0.1-fase1] - 2026-11-20

### Ditambahkan

- Skema TypeScript domain murni (`src/domain/types.ts`), data awal (`src/content/components.json`), aturan kompatibilitas deklaratif (`src/content/rules.json`), tabel kode bip AMI (`src/content/beep-ami.json`), mesin domain (`compat`, `power`, `assembly`, `post`, `diagnosis`, `scoring`), dan 28 tes unit Vitest Kategori D & E.

## [v0.0-fase0] - 2026-11-19

### Ditambahkan

- Scaffold Vite + React + TypeScript (strict mode), ESLint, Prettier, Vitest, Playwright, struktur folder, Docker multi-stage non-root dengan `HEALTHCHECK`, `vercel.json`, dan CI GitHub Actions.
