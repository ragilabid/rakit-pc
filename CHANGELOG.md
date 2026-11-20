# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.

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
