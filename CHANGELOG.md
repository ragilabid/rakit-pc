# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.

## [v0.5-fase5] - 2026-11-21

### Ditambahkan

- Katalog perangkat keras lengkap level Fase E SMK di `src/content/lessons.json` (`deviceCatalog`): komponen **Internal** (motherboard, CPU, RAM, storage SATA/NVMe, GPU PCIe x16, PSU ATX, pendingin CPU, kartu jaringan NIC/Wi-Fi), **Peripheral Eksternal** (keyboard, mouse, monitor, printer, scanner, speaker/headset, webcam), dan **Perangkat Usang / Sejarah** (kabel pita IDE/PATA 40-pin, port VGA D-Sub 15-pin, port PS/2, Floppy Disk Drive 3,5", port paralel LPT1/serial RS-232, slot AGP).
- Data soal kuis per pelajaran (`src/content/quiz.json`), mesin domain evaluasi kuis murni (`src/domain/quiz/index.ts`), dan komponen antarmuka kuis (`src/ui/QuizPanel.tsx`) dengan umpan balik penjelas mengapa pilihan salah keliru.
- Penyimpanan lokal jawaban & skor kuis (`quizAnswers`) di store Zustand berversi (`src/store/useProgressStore.ts`), tampil di layar hasil guru (`#hasil`), bertahan saat halaman dimuat ulang, dan terhapus bersih saat reset progres.
- 6 kasus uji Kategori F (`KU-58` s.d. `KU-63`) yang telah disetujui, diimplementasikan pada Vitest (`tests/unit/domain-kategori-f.test.ts`) dan Playwright (`tests/e2e/kategori-f.spec.ts`), termasuk pemeriksaan bebas permintaan jaringan yang mengirim data siswa.
- Tabel lengkap `TODO-VERIFIKASI` (Item, Nilai yang Ditulis, Sumber yang Disarankan) di `docs/verifikasi-konten.md`.
- Pemeriksaan `check-i18n.mjs` diperluas untuk memvalidasi seluruh kunci terjemahan di `src/content/quiz.json`.

## [v0.4-fase4] - 2026-11-21

### Ditambahkan

- Komponen meja simulasi perakitan interaktif (`src/ui/AssemblySimulator.tsx`) yang menghubungkan fungsi-fungsi murni mesin domain (`src/domain/assembly`, `compat`, `power`, `post`, `diagnosis`, `scoring`) ke panggung 3D (`InteractiveBuild3DAssembly` di `src/three/PrimitiveHardwareScene.tsx`).
- Visualisasi 3D real-time saat komponen dipasang/dilepas mengikuti urutan perakitan (casing + standoff, motherboard, CPU, pasta termal, heatsink/cooler, modul RAM per slot `A1..B2`, SSD M.2, PSU, GPU, kabel daya, dan indikator LED status POST).
- Penolakan langsung tingkat FISIK dengan pesan alasan & cara memperbaiki (`CPU_SOCKET_MISMATCH`, `CPU_ORIENTATION_INVALID`, `RAM_TYPE_MISMATCH`, `RAM_ORIENTATION_REVERSED`, `SLOT_ALREADY_OCCUPIED`, `FORM_FACTOR_INCOMPATIBLE`, `OUT_OF_ORDER_STEP`).
- Evaluasi kegagalan tingkat LOGIS saat POST beserta kode bunyi bip BIOS AMI dan panel latihan diagnosis interaktif dengan umpan balik penjelas (`evaluateDiagnosisAnswer`).
- Penyimpanan hasil simulasi terakhir (`lastSimulationResult`) di store Zustand berversi dan pembaruan Layar Hasil Tatap Muka Guru (`#hasil`) dengan skor, waktu, jumlah percobaan, dan rincian umpan balik.
- Rangkaian tes E2E Playwright Fase 4 (`tests/e2e/fase-4-perakitan.spec.ts`), fitur scroll terpisah pada panel materi/simulasi, serta tangkapan layar pada lebar `320 px`, `768 px`, dan `1280 px` di `docs/screenshots/fase-4/`.

## [v0.3-fase3] - 2026-11-21

### Ditambahkan

- Scene 3D berbasis `three.js` dan `@react-three/fiber` dengan rakitan komponen perangkat keras berdetail tinggi di `src/three/PrimitiveHardwareScene.tsx`.
- Pengendali panggung & kamera 3D (`src/three/stageController.ts`): kontrol mouse/sentuh (`touch-action: none` hanya pada kanvas), pembatasan jarak zoom min/max (`2.2 m` s.d. `9.0 m`) dan sudut polar agar kamera tidak menembus model, serta pintasan keyboard (`WASD`, `Q/E`, `+/-`) yang otomatis nonaktif saat fokus di dalam `<input>` / `<textarea>`.
- Deteksi otomatis dukungan WebGL2 (`detectWebGL2Support`) yang menampilkan pesan jelas dan mengaktifkan mode cadangan gambar 2D jika WebGL2 tidak tersedia (`KU-13`).
- Pemilih kualitas `Rendah` / `Sedang` / `Tinggi` beserta pemantau FPS otomatis yang menyarankan penurunan kualitas saat FPS rendah (`KU-17`).
- Penjedaan loop render 3D otomatis saat tab browser berada di latar belakang (`visibilitychange`, `KU-19`) dan indikator pemuatan model (`KU-20`).
- Padanan daftar tombol komponen untuk navigasi penuh via keyboard & pembaca layar dengan `aria-label` dan `aria-live="polite"` (`KU-21`, `KU-23`).
- Terjemahan i18n penuh untuk tabel referensi kode bip AMI.
- Tes unit Vitest (`tests/unit/three-kategori-b.test.ts`), tes E2E Playwright (`tests/e2e/kategori-b.spec.ts`), panduan uji manual perangkat nyata (`docs/uji-manual-fase3.md`), serta tangkapan layar Fase 3 (`320 px`, `768 px`, `1280 px`) di `docs/screenshots/fase-3/`.

## [v0.2-fase2] - 2026-11-21

### Ditambahkan

- Rencana desain UI/UX (`docs/desain.md`) beserta token warna perangkat keras, tipografi lokal (`IBM Plex Sans` dan `IBM Plex Mono` tanpa CDN), dan wireframe ASCII.
- Hash router tidak peka huruf besar/kecil (`src/router/index.ts`) dengan fallback ke beranda untuk slug tidak dikenal serta dukungan tombol Back/Forward browser.
- Store progres Zustand berversi (`src/store/useProgressStore.ts`) dengan middleware `persist`, pembungkus `try/catch` untuk `localStorage`, pemberitahuan otomatis jika penyimpanan diblokir/penuh, penguncian prasyarat pelajaran, dan reset progres dengan konfirmasi.
- Sistem i18n (`src/i18n/index.ts`, `id.json`, `en.json`) dengan fallback bahasa ke Indonesia serta skrip pemeriksa kunci terjemahan saat build (`scripts/check-i18n.mjs`).
- Halaman Beranda, Daftar Pelajaran, Halaman Pelajaran bertab (`Ikhtisar`, `Spesifikasi`, `Latihan`), Panggung Komponen Interaktif dengan daftar tombol fokus keyboard, Katalog Perangkat (internal, peripheral eksternal, perangkat usang), Referensi Kontrol & Kode Bip AMI, Layar Hasil Tatap Muka Guru, dan Pengaturan.
- 20 tes unit Vitest baru (`tests/unit/domain-kategori-a-c.test.ts`) dan rangkaian tes E2E Playwright (`tests/e2e/kategori-a-c.spec.ts`) untuk Kategori A dan Kategori C.
- Tangkapan layar responsif pada lebar `320 px`, `768 px`, dan `1280 px` di `docs/screenshots/fase-2/`.

## [v0.1-fase1] - 2026-11-20

### Ditambahkan

- Skema TypeScript domain murni (`src/domain/types.ts`) dan data awal (`src/content/components.json`) untuk CPU (AM5/LGA1700), motherboard (ATX/Mini-ITX, DDR4/DDR5), RAM, PSU (450W/650W), casing, GPU, penyimpanan, pendingin, dan kabel.
- Skema aturan kompatibilitas deklaratif (`src/content/rules.json`) dan mesin evaluator (`src/domain/compat/index.ts`) untuk kegagalan Tingkat 1 (FISIK — ditolak langsung) dan Tingkat 2 (LOGIS — dievaluasi saat POST).
- Mesin penghitung daya PSU (`src/domain/power/index.ts`).
- Mesin state perakitan & validasi urutan pemasangan (`src/domain/assembly/index.ts`), termasuk pengingat keselamatan ESD/K3 non-pemblokir.
- Simulator POST & pemetaan kode bip AMI (`src/domain/post/index.ts`) yang melaporkan masalah pemblokir satu per satu.
- Tabel kode bip AMI (`src/content/beep-ami.json`) beserta daftar `TODO-VERIFIKASI` di `docs/verifikasi-konten.md`.
- Mesin diagnosis (`src/domain/diagnosis/index.ts`) dengan umpan balik penjelas mengapa jawaban salah dan petunjuk perbaikan.
- Mesin penilaian siswa (`src/domain/scoring/index.ts`) berdasarkan hasil + waktu + jumlah percobaan.
- 28 kasus uji Vitest otomatis untuk Kategori D (`KU-30` s.d. `KU-52`) dan Kategori E (`KU-53` s.d. `KU-57`) serta uji kemurnian arsitektur domain.

### Diubah

- Menaikkan Vitest ke v5 (`5.1.1`) dan ESLint ke v10 (`10.15.0`).

## [v0.0-fase0] - 2026-11-19

### Ditambahkan

- Scaffold Vite + React + TypeScript (strict mode).
- Konfigurasi ESLint, Prettier, Vitest, dan Playwright.
- Struktur folder sesuai arsitektur di `SPEC.md` Bagian 4.
- Konfigurasi Docker multi-stage (`Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`) non-root dengan `HEALTHCHECK`.
- Konfigurasi dasar `vercel.json`, `.nvmrc`, `README.md`, `CHANGELOG.md`, dan `CREDITS.md`.
- Workflow CI GitHub Actions untuk `lint`, `test`, dan `build`.
- Halaman awal placeholder polos dengan pesan `<noscript>`.
