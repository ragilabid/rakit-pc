# Rakit PC

Platform belajar perangkat komputer 3D dan simulasi perakitan PC interaktif untuk siswa Fase E SMK (TJKT, DPIB, KKA).

Spesifikasi lengkap proyek ada di [SPEC.md](./SPEC.md).

## Prasyarat

- Node.js sesuai versi di `.nvmrc` (Node 24)
- npm
- Docker (untuk build dan menjalankan kontainer lokal/server sekolah)

## Perintah Pengembangan & Pengujian

```bash
npm install
npm run dev
npm run check:i18n
npm run lint
npm run test
npm run build
npm run test:e2e
npm run test:smoke
```

## Menjalankan dengan Docker (Server Sekolah / Offline)

```bash
docker build -t rakit-pc .
docker run --rm -p 8080:80 rakit-pc
```

Atau menggunakan Docker Compose:

```bash
docker compose up --build -d
```

Aplikasi akan disajikan oleh nginx (non-root, dengan `HEALTHCHECK` dan kompresi gzip) di `http://localhost:8080`.

---

## Panduan Deploy ke Vercel (Produksi — `SPEC.md` Bagian 9)

Aplikasi ini adalah aplikasi statis murni tanpa backend dan tanpa variabel lingkungan rahasia. Konfigurasi header cache dan MIME `.glb` serta `sw.js` telah disiapkan di [vercel.json](./vercel.json).

### Langkah Menghubungkan Repositori ke Vercel

1. Masuk ke dasbor **Vercel** dan klik **Add New... → Project**.
2. Impor repositori GitHub **`ragilabid/rakit-pc`**.
3. Pastikan pengaturan proyek sesuai dengan rincian berikut:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
   - **Node.js Version:** `24.x` (otomatis membaca `.nvmrc`)
   - **Environment Variables:** _Kosongkan_ (tidak ada variabel lingkungan).
4. **Pengaturan Privasi Siswa (WAJIB):**
   - Pastikan **Vercel Web Analytics** dan **Speed Insights** dalam keadaan **Disabled / Off** pada tab _Analytics_ dan _Speed Insights_ proyek Vercel agar tidak ada skrip pelacak atau pengiriman data siswa.
5. Klik **Deploy**.
   - Cabang `main` akan menjadi lingkungan **Production**.
   - Cabang `fase-*` atau Pull Request akan menjadi lingkungan **Preview**.

### Menjalankan Uji Asap (_Smoke Test_) terhadap URL Produksi

Setelah deploy ke Vercel selesai, jalankan skrip _smoke test_ Playwright dengan mengarahkan `PLAYWRIGHT_BASE_URL` ke URL produksi Anda:

```powershell
# PowerShell (Windows)
$env:PLAYWRIGHT_BASE_URL="https://rakit-pc.vercel.app"
npm run test:smoke
```

```bash
# Bash (Linux / macOS)
PLAYWRIGHT_BASE_URL="https://rakit-pc.vercel.app" npm run test:smoke
```

Skrip `npm run test:smoke` akan menguji pembukaan `#ram`, fallback `#abcxyz`, penyelesaian satu pelajaran, mode cadangan 2D, layar hasil penilaian dinamis `#hasil`, serta kesiapan PWA.

---

## Dokumentasi Rilis & Verifikasi

- [SPEC.md](./SPEC.md) — Spesifikasi utama proyek
- [docs/desain.md](./docs/desain.md) — Rencana desain & token visual
- [docs/verifikasi-konten.md](./docs/verifikasi-konten.md) — Tabel data teknis `TODO-VERIFIKASI`
- [docs/pemetaan-kasus-uji.md](./docs/pemetaan-kasus-uji.md) — Pemetaan 63 kasus uji (`KU-01` s.d. `KU-63`)
- [docs/uji-manual-rilis.md](./docs/uji-manual-rilis.md) — Daftar periksa uji manual perangkat 2018–2022, HP, & jaringan lambat
