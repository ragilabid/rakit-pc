# SPEC.md — Platform Belajar Perangkat Komputer & Simulasi Perakitan PC

> Dokumen ini adalah **sumber kebenaran** proyek. Setiap AI agent (Copilot, Claude, dll.) **wajib membaca file ini sebelum mengerjakan apa pun**. Jika ada konflik antara permintaan dan SPEC ini, hentikan pekerjaan dan tanyakan kepada pemilik proyek (Abid).

---

## 1. Tujuan

Aplikasi web interaktif untuk siswa Fase E SMK (TJKT, DPIB, KKA) belajar mengenal perangkat komputer dalam tampilan 3D, lalu mempraktikkan perakitan PC secara virtual, termasuk pemecahan masalah berdasarkan kode bunyi (beep).

- Bahasa utama: **Indonesia** (default).
- Pengguna: siswa dan guru, tanpa akun.
- Penggunaan utama: PC lab sekolah dan HP siswa.

## 2. Keputusan Produk (final, tidak boleh diubah AI tanpa persetujuan)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Akun | **Anonim, tanpa login.** Progres hanya di perangkat/browser itu (localStorage), **tidak ikut** ke perangkat lain. |
| 2 | Cakupan materi | Perangkat **internal, eksternal (peripheral), dan usang** (IDE, VGA, PS/2 sebagai materi sejarah). Level **Fase E SMK**. |
| 3 | Perakitan | **Longgar**: siswa dibiarkan gagal lalu belajar dari hasilnya (rincian di [Bagian 6.3 — Simulasi perakitan: dua tingkat kegagalan](#63-simulasi-perakitan-dua-tingkat-kegagalan)). |
| 4 | Kode bip | Standar **AMI** saja. |
| 5 | Perangkat target | Perangkat **tahun 2018–2022, kelas medium**. Basis **WebGL2**, ada opsi kualitas rendah dan mode cadangan 2D. |
| 6 | Hasil siswa | **Tidak dikirim ke guru.** Guru melihat hasil **secara tatap muka** (siswa menunjukkan layarnya). Tidak ada ekspor, kirim, dasbor guru, atau backend. |
| 7 | Keselamatan (ESD/K3) | **Pengingat saja**, tidak wajib dicentang. |
| 8 | Prasyarat pelajaran | Pelajaran **dikunci** sampai prasyarat selesai. |
| 9 | Urutan perakitan | **Mengikuti urutan** yang ditentukan. |
| 10 | Penilaian | Skor berdasarkan **hasil + waktu + jumlah percobaan**. |
| 11 | Banyak penyebab masalah | Dilaporkan **satu per satu**. |

## 3. Teknologi

| Kebutuhan | Pilihan |
|---|---|
| Bahasa | TypeScript (strict mode) |
| Framework | React + Vite |
| 3D | three.js + @react-three/fiber + @react-three/drei |
| Model 3D | glTF/GLB, kompresi Draco atau meshopt, dimuat per pelajaran (lazy load) |
| State | Zustand + middleware `persist` (localStorage, berversi) |
| Routing | Hash routing buatan sendiri (`#slug`) |
| i18n | i18next, bahasa default Indonesia |
| Tes unit | Vitest |
| Tes UI/E2E | Playwright |
| Lint/format | ESLint + Prettier |
| Paket | npm; versi Node dikunci di `.nvmrc` |
| Hosting produksi | **Vercel** |
| Kontainer | **Docker** (build multi-stage, disajikan nginx) |

**Larangan:**
- Tidak ada backend, database, login, cookie pelacak, atau analitik.
- Tidak ada dependensi runtime ke CDN eksternal (font dan aset di-host sendiri, agar jalan di lab dengan internet lambat/offline).
- Tidak menambah library besar tanpa persetujuan.

## 4. Arsitektur

Empat lapisan. **Ketergantungan hanya boleh dari atas ke bawah.**

```
UI (React)                  halaman pelajaran, panel spesifikasi, hasil
  ↓
Lapisan 3D (R3F)            kamera, klik komponen, kualitas, cadangan 2D
  ↓
Mesin domain (TS murni)     kompatibilitas, daya, simulasi POST, diagnosis, skor
  ↓
Data/konten (JSON)          komponen, pelajaran, aturan, kode bip, terjemahan
```

**Aturan wajib:**
1. **Mesin domain tidak boleh meng-import React, three.js, atau API browser.** Ia fungsi murni agar bisa dites dengan Vitest.
2. **Konten adalah data, bukan kode.** Menambah komponen/pelajaran = menambah JSON, bukan mengubah logika.
3. Semua teks tampilan lewat i18n. Tidak boleh ada teks Indonesia yang ditulis langsung di komponen.
4. Aturan kompatibilitas ditulis sebagai **data deklaratif**, bukan `if` yang tersebar.

### Struktur folder

```
<nama-proyek>/          # nama folder lokal = nama repo GitHub
├─ SPEC.md
├─ Dockerfile
├─ docker-compose.yml
├─ nginx.conf
├─ .dockerignore
├─ vercel.json
├─ .nvmrc
├─ docs/
│   ├─ kasus_uji_platform_perangkat_komputer.xlsx   # sumber kasus uji
│   ├─ referensi/        # tangkapan layar referensi UI
│   └─ screenshots/      # hasil tangkapan layar per fase
├─ public/models/            # GLB per pelajaran
├─ src/
│   ├─ domain/               # mesin murni (tanpa UI)
│   │   ├─ assembly/         # state perakitan, aturan, urutan
│   │   ├─ compat/           # evaluasi aturan kompatibilitas
│   │   ├─ power/            # hitung kebutuhan daya PSU
│   │   ├─ post/             # simulasi POST + kode bip AMI
│   │   ├─ diagnosis/        # mesin diagnosis + umpan balik
│   │   └─ scoring/          # skor: hasil + waktu + percobaan
│   ├─ content/              # JSON: components, lessons, rules, beep-ami, quiz
│   ├─ three/                # scene, kontrol kamera, kualitas, fallback 2D
│   ├─ ui/                   # komponen React
│   ├─ store/                # Zustand (progres, pengaturan)
│   ├─ i18n/                 # id.json (default), en.json (opsional)
│   └─ router/               # hash router
└─ tests/
    ├─ unit/                 # Vitest (domain)
    └─ e2e/                  # Playwright
```

## 5. Alur Git & GitHub (WAJIB)

1. Repositori ada di **GitHub**. Cabang utama: `main`.
   - **Nama repo GitHub = nama folder kerja lokal** di komputer pengembangan (persis sama). Nama folder ini disebut `<nama-proyek>` di seluruh dokumen.
   - Format nama: **huruf kecil, angka, dan tanda hubung** saja, tanpa spasi atau huruf besar (Docker dan Vercel mewajibkan/menyukai huruf kecil). Contoh: `platform-perangkat-komputer`.
   - Nama diputuskan sekali di awal Fase 0 dan **tidak diganti** setelahnya.
2. Kerjakan tiap fase di cabang `fase-N-nama` (contoh: `fase-1-mesin-domain`).
3. **Commit sering** dengan format Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`.
4. **Di akhir SETIAP fase pengembangan, AI WAJIB:**
   1. Menjalankan semua tes (`npm run test`, `npm run lint`, `npm run build`).
   2. Memastikan Docker build berhasil (`docker build`).
   3. **Commit semua perubahan dan push ke GitHub.**
   4. Merge ke `main`, lalu beri tag, misalnya `v0.1-fase1`.
   5. Memperbarui checklist fase di [Bagian 12 — Fase Pengembangan](#12-fase-pengembangan) dokumen ini.
5. **Dilarang memulai fase berikutnya** sebelum langkah 4 selesai.
6. Jangan pernah commit: `node_modules`, `dist`, file `.env`, atau aset berlisensi tidak jelas.
7. Jangan `git push --force` ke `main`.

## 6. Aturan Domain

### 6.1 Navigasi & progres

- Tautan langsung `#ram` membuka pelajaran RAM. Slug **tidak peka huruf besar/kecil** (`#RAM` = `#ram`).
- Slug tidak dikenal → jatuh ke beranda (bukan layar kosong).
- Tombol Back/Forward browser berfungsi antar pelajaran.
- Menyelesaikan pelajaran dua kali **tidak** menaikkan penghitung dua kali (idempoten).
- Muat ulang halaman memulihkan progres dan posisi pelajaran.
- Reset progres di Settings wajib **meminta konfirmasi**, lalu semua kembali ke `0/N`.
- Jika localStorage penuh/diblokir (mode privat): aplikasi tetap jalan, progres tidak tersimpan, tampilkan **pemberitahuan**. Semua akses storage dibungkus `try/catch`.
- Tanpa JavaScript: `<noscript>` menampilkan pesan jelas "aktifkan JavaScript".
- Skema localStorage **berversi** (`schemaVersion`) agar migrasi aman.

### 6.2 Tampilan 3D & kontrol

- Basis WebGL2. Jika tidak tersedia: pesan jelas + **mode cadangan gambar 2D**.
- Opsi kualitas **Rendah / Sedang / Tinggi**, dengan deteksi FPS otomatis yang menyarankan turun kualitas.
- Layar sentuh: geser, cubit, rotasi berfungsi **tanpa menggulung halaman** (`touch-action: none` hanya pada kanvas).
- Zoom dibatasi min/max, kamera tidak boleh menembus model.
- Pintasan keyboard (mis. `w`) **tidak aktif saat fokus di input/textarea**.
- Layar sempit (±320 px) tetap bisa dipakai.
- Pindah tab 5 menit lalu kembali: render lanjut normal, tanpa crash (jeda render saat tab tersembunyi).
- Muat model: tampilkan indikator progres; aplikasi tidak boleh macet di jaringan lambat.
- **Aksesibilitas:** semua tombol bisa dijangkau keyboard; setiap komponen 3D punya **padanan daftar** yang bisa difokus (tidak bergantung pada klik di kanvas); teks alternatif dan `aria-label` lengkap.

### 6.3 Simulasi perakitan: dua tingkat kegagalan

Prinsip: **siswa dibiarkan gagal lalu belajar.** Setiap kegagalan harus berakhir dengan **umpan balik yang menjelaskan penyebab**, bukan sekadar "salah".

**Tingkat 1 — FISIK (tidak mungkin terpasang):** ditolak langsung dengan penjelasan.
- Soket CPU berbeda (mis. AM5 ke LGA1700)
- Tipe RAM berbeda soket/notch (DDR4 ke slot DDR5)
- Orientasi CPU salah (segitiga penanda) atau RAM terbalik (notch)
- Dua komponen di satu slot
- Form factor tidak muat (ATX ke casing Mini-ITX) — *usulan, konfirmasi pemilik*

**Tingkat 2 — LOGIS (terpasang, gagal saat dinyalakan):** dibiarkan terpasang, lalu simulasi POST/boot gagal dengan diagnosis.
- Daya PSU kurang (peringatan/gagal menyala) atau tipis tanpa cadangan (peringatan "tanpa cadangan")
- Konektor 24-pin / CPU 8-pin / PCIe GPU tidak terpasang
- Tanpa CPU atau tanpa RAM (pesan sesuai bagian yang hilang)
- Tanpa pendingin CPU (peringatan suhu + mati otomatis); pasta termal terlupa (suhu tinggi)
- Kabel front panel tertukar (tombol power tidak berfungsi + petunjuk)
- Penyimpanan tanpa OS (`no bootable device`)
- Standoff tidak sesuai (peringatan korsleting)
- RAM tidak berpasangan (jalan, catatan performa dual-channel lebih rendah)
- Total RAM melebihi batas motherboard (peringatan kapasitas)

**Aturan lain:**
- **Urutan pemasangan mengikuti urutan** yang ditentukan di data pelajaran.
- Melepas dan memasang ulang komponen: status konsisten, **tidak ada komponen ganda**.
- Keselamatan (ESD/K3): **pengingat saja**, tidak memblokir.
- Rakitan benar → dinyatakan berhasil + simulasi POST sukses.

### 6.4 Pemecahan masalah & kode bip

- Standar: **AMI** saja. Tabel kode bip disimpan di `src/content/beep-ami.json`.
- **AI dilarang mengarang tabel bip.** Susun dari dokumentasi resmi AMI, lalu **diverifikasi oleh Abid** sebelum dipakai.
- Satu bip pendek = POST normal.
- Bip berulang (RAM tidak terdeteksi) → diagnosis mengarah ke RAM.
- Tidak ada tampilan → petunjuk colok kabel monitor ke port GPU, bukan port motherboard.
- Jawaban diagnosis salah → umpan balik **menjelaskan** mengapa keliru dan petunjuk yang benar.
- Beberapa penyebab sekaligus → dilaporkan **satu per satu**.

### 6.5 Konten

- Spesifikasi (DDR4 vs DDR5, jenis soket CPU, SATA vs NVMe M.2) harus akurat dan konsisten dengan data komponen.
- Klik komponen di 3D → label, nama, dan penjelasan fungsi.
- Istilah ambigu (HDD/SSD/SSHD) dijelaskan sesuai **level Fase E**, tidak terlalu teknis.
- Semua UI dan label 3D ikut berganti saat bahasa diganti. Bahasa tidak didukung → jatuh ke Indonesia.
- Skrip pemeriksa i18n wajib ada: gagal build jika ada kunci terjemahan hilang.
- **Spesifikasi teknis dalam konten buatan AI wajib diverifikasi Abid** sebelum rilis.

### 6.6 Hasil siswa

- Layar hasil di akhir simulasi/kuis menampilkan: **skor, waktu, jumlah percobaan, dan umpan balik**.
- Dirancang untuk **dilihat guru secara tatap muka** (teks besar, jelas, tanpa perlu login).
- Disimpan lokal di perangkat. **Tidak ada fitur kirim, ekspor, atau sinkronisasi.**

## 7. Kinerja & Kompatibilitas

- Target perangkat: tahun 2018–2022 (kelas medium), browser modern, WebGL2.
- Model low-poly, tekstur dikompres, dimuat per pelajaran.
- Anggaran ukuran (target awal, boleh disesuaikan setelah pengukuran): muat awal ringan tanpa model; tiap pelajaran memuat model sendiri saja.
- Dukung PWA (service worker men-cache aset) agar lab dengan jaringan lambat tetap nyaman.
- Opsi kualitas rendah wajib ada dan berfungsi di PC lab lama.

## 8. Docker

Proyek **wajib bisa dibuild ke Docker** pada setiap fase.

- `Dockerfile` **multi-stage**:
  1. Tahap build: image Node (versi sesuai `.nvmrc`), `npm ci`, `npm run build`.
  2. Tahap runtime: **nginx** (alpine) menyajikan folder `dist`.
- `nginx.conf`: kompresi gzip, cache panjang untuk aset ber-hash, **tanpa cache** untuk `index.html`, header MIME benar untuk `.glb`.
- `.dockerignore`: `node_modules`, `dist`, `.git`, `.env`.
- `docker-compose.yml` untuk menjalankan lokal (`docker compose up`, port 8080).
- Kontainer **non-root** bila memungkinkan; sertakan `HEALTHCHECK`.
- Kegunaan: dipasang di server/lab sekolah tanpa internet dan untuk lingkungan yang konsisten.

Perintah acuan:
```bash
docker build -t <nama-proyek> .
docker run --rm -p 8080:80 <nama-proyek>
```

## 9. Deploy ke Vercel

Dilakukan **setelah proyek selesai** (akhir Fase 6).

- Hubungkan repositori GitHub ke Vercel. Cabang `main` → **Production**; cabang lain → **Preview**.
- Vercel membangun dari **kode sumber** (bukan dari Docker). Docker dipakai untuk kebutuhan lain (server sekolah/lokal).
- Pengaturan: Framework Preset **Vite**, Build Command `npm run build`, Output Directory `dist`.
- `vercel.json`: header cache aset, dan tipe konten `.glb`.
- Tidak ada variabel lingkungan rahasia (aplikasi statis tanpa backend).
- **Analitik dan pelacakan dimatikan** (privasi siswa).
- Setelah deploy, jalankan uji asap (smoke test) di URL produksi: buka `#ram`, `#abcxyz`, selesaikan satu pelajaran, uji mode 2D.

## 10. Pengujian

- File `docs/kasus_uji_platform_perangkat_komputer.xlsx` adalah **sumber kasus uji**. Ubah tiap baris menjadi tes otomatis; **tulis tes dulu, lalu implementasi.**
- Pemetaan:

| Kategori | Jenis tes |
|---|---|
| A. Navigasi, pelajaran, progres | Playwright + Vitest (progres, normalisasi URL) |
| B. Tampilan 3D dan kontrol | Sebagian Playwright, sebagian **uji manual** di perangkat nyata (HP, PC lab lama, 3G) |
| C. Konten dan perangkat | Vitest (kelengkapan data & i18n) + tinjauan Abid |
| D. Simulasi perakitan | Vitest pada mesin domain |
| E. Pemecahan masalah | Vitest pada mesin domain |
| F. Kuis, latihan, hasil | Vitest + Playwright (kasus ditambahkan, lihat [Bagian 11 — Kasus Uji yang Perlu Ditambah](#11-kasus-uji-yang-perlu-ditambah-kategori-f-masih-kosong)) |

- Nama tes memuat nomor kasus, contoh: `it("[KU-31] soket CPU tidak cocok ditolak", ...)`.
- Perintah wajib lolos sebelum commit akhir fase: `npm run lint`, `npm run test`, `npm run build`.

## 11. Kasus Uji yang Perlu Ditambah (Kategori F masih kosong)

AI wajib mengusulkan, lalu Abid menyetujui, kasus untuk:
- Kuis: soal tampil, jawaban benar/salah memberi umpan balik penjelas.
- Skor akhir: hasil + waktu + percobaan dihitung benar.
- Layar hasil tampil jelas untuk dilihat guru tatap muka.
- Hasil tersimpan lokal dan muncul lagi setelah muat ulang.
- Reset progres juga menghapus hasil tersimpan (setelah konfirmasi).
- Tidak ada permintaan jaringan yang mengirim data siswa.

## 12. Fase Pengembangan

Tiap fase **selesai hanya jika semua butir Definition of Done terpenuhi, termasuk commit + push ke GitHub ([Bagian 5 — Alur Git & GitHub](#5-alur-git--github-wajib)).**

- [x] **Fase 0 — Fondasi.** Repo GitHub, scaffold Vite+TS, ESLint/Prettier, Vitest, Playwright, struktur folder, `SPEC.md`, `Dockerfile` + `nginx.conf`, CI sederhana (lint+test+build). *DoD:* `docker build` berhasil, halaman awal tampil.
- [x] **Fase 1 — Skema data & mesin domain.** Skema JSON komponen/aturan, kompatibilitas, hitung daya, state perakitan, simulasi POST, tabel bip AMI (diverifikasi Abid), diagnosis, skor. *DoD:* semua tes kategori D dan E hijau.
- [ ] **Fase 2 — UI 2D & navigasi.** Hash router, pelajaran, panel spesifikasi, progres (localStorage), penguncian prasyarat, reset, i18n, `<noscript>`. *DoD:* tes kategori A dan C hijau; rencana desain disetujui; checklist [Bagian 15](#15-uiux-sederhana-dan-natural) lolos.
- [ ] **Fase 3 — Lapisan 3D.** Scene dengan bentuk primitif, kontrol kamera (mouse + sentuh), klik komponen, mode kualitas, cadangan 2D, padanan keyboard. *DoD:* kategori B lolos (otomatis + manual); checklist [Bagian 15](#15-uiux-sederhana-dan-natural) lolos.
- [ ] **Fase 4 — Simulasi perakitan interaktif.** Hubungkan mesin domain ke 3D, urutan pemasangan, umpan balik kegagalan, layar hasil. *DoD:* seluruh alur rakit → nyalakan → diagnosis jalan; checklist [Bagian 15](#15-uiux-sederhana-dan-natural) lolos.
- [ ] **Fase 5 — Konten & aset.** Katalog lengkap (internal, eksternal, usang), model 3D asli, terjemahan, kuis. *DoD:* konten diverifikasi Abid.
- [ ] **Fase 6 — Penyempurnaan & rilis.** PWA, optimasi kinerja, aksesibilitas, uji di perangkat 2018–2022, deploy **Vercel**, smoke test produksi, image Docker final. *DoD:* URL produksi aktif dan lolos smoke test.

## 13. Aturan Kerja untuk AI Agent

1. Baca `SPEC.md` di awal setiap sesi.
2. Kerjakan **satu fitur per sesi**, tes lulus dulu sebelum lanjut.
3. Tulis tes dari kasus uji **sebelum** implementasi.
4. Jangan mengubah keputusan produk ([Bagian 2 — Keputusan Produk](#2-keputusan-produk-final-tidak-boleh-diubah-ai-tanpa-persetujuan)) tanpa persetujuan.
5. Jangan mengarang data teknis (spesifikasi, kode bip, kebutuhan daya). Tandai `TODO-VERIFIKASI` jika ragu.
6. Jangan menambah fitur di luar SPEC (login, backend, analitik, ekspor hasil).
7. Aset 3D: mulai dengan geometri primitif dari kode; model eksternal hanya yang berlisensi jelas (CC0/CC-BY) dan sumbernya dicatat di `CREDITS.md`.
8. Komit berkala, **push ke GitHub di akhir setiap fase** ([Bagian 5 — Alur Git & GitHub](#5-alur-git--github-wajib)).
9. Jika ada ambiguitas atau konflik dengan kasus uji, **tanyakan**, jangan menebak.
10. Setelah setiap fase, perbarui centang di [Bagian 12 — Fase Pengembangan](#12-fase-pengembangan) dan ringkas perubahan di `CHANGELOG.md`.
11. Untuk setiap pekerjaan UI, ikuti [Bagian 15 — UI/UX: Sederhana dan Natural](#15-uiux-sederhana-dan-natural). Tulis rencana desain dan tunggu persetujuan sebelum membangun.

## 14. Keputusan Terbuka

| Topik | Status |
|---|---|
| Kasus 35 (ATX ke Mini-ITX): fisik (ditolak) atau logis | Usulan: fisik. **Konfirmasi Abid.** |
| Nama proyek (`<nama-proyek>`) = nama folder lokal = nama repo GitHub | **Tentukan Abid** di awal Fase 0 |
| Tangkapan layar referensi di `docs/referensi/` | Disiapkan Abid sebelum Fase 2 |
| Kasus uji kategori F | Perlu ditambah ([Bagian 11](#11-kasus-uji-yang-perlu-ditambah-kategori-f-masih-kosong)) |
| Tabel bip AMI | Perlu verifikasi dari dokumentasi resmi |
| Anggaran ukuran muat awal & per pelajaran | Tetapkan setelah pengukuran Fase 3 |
| Pembaruan kolom "Hasil yang diharapkan" untuk kasus 31–35, 48 agar selaras dengan keputusan #3 | Perlu diperbarui di file xlsx |

## 15. UI/UX: Sederhana dan Natural

Tujuan: tampilan seperti **alat belajar yang dirancang dengan sengaja**, bukan halaman template hasil generator. Tenang, jelas, dan fokus pada panggung 3D.

### 15.1 Referensi

Acuan: **https://learn-esp32.vercel.app/** (kursus 3D interaktif). Simpan tangkapan layar referensi di `docs/referensi/` agar AI bisa melihatnya.

**Yang diambil (struktur dan perilaku):**
- Panggung 3D sebagai pusat halaman; halaman awal langsung berisi scene dan daftar pelajaran, **tanpa hero/halaman promosi**.
- Menu sederhana: Beranda, Pelajaran, Komponen, Referensi (kontrol dan pintasan), Pengaturan, Bahasa.
- Panel bertab untuk satu pelajaran (Ikhtisar, Spesifikasi, dan sejenisnya).
- Penghitung progres `0/N`.
- Kontrol 3D: seret atau WASD untuk geser, Q/E untuk memutar, scroll untuk zoom; petunjuknya tertulis singkat di layar.
- Deskripsi pelajaran 1–2 kalimat, memakai **analogi keseharian**, bukan definisi kaku.

**Yang TIDAK boleh disalin:** palet warna, ilustrasi, teks, kode, dan nama menu secara persis. Itu karya orang lain; kita memakainya sebagai inspirasi struktur saja.

> Catatan: latar krem hangat dengan huruf serif dan aksen terakota justru gaya yang sering muncul pada desain buatan AI. Jangan jadikan itu palet bawaan.

### 15.2 Identitas visual (ditentukan di Fase 2, disimpan sebagai design tokens)

- **Warna:** 4–6 warna bernama (CSS variables) yang diambil dari dunia perangkat keras, misalnya hijau PCB, tembaga, abu casing, putih netral. **Satu** warna aksen saja. Dukung kontras AA.
- **Tipografi:** satu atau dua keluarga font, **di-host sendiri** (bukan CDN). Teks isi minimal 16 px. Gunakan sentence case.
- **Bentuk:** radius sudut dan ketebalan garis dipilih berdasarkan fungsi. Tidak semua elemen memakai radius yang sama.
- **Ikon:** satu set ikon yang konsisten (outline). Tidak memakai emoji sebagai ikon UI.
- **Satu hal yang menonjol:** panggung 3D. Elemen lain dibuat tenang.

### 15.3 Tanda khas buatan AI yang DILARANG

- Konten dipotong jadi kartu identik dengan bayangan lembut yang sama di mana-mana.
- Gradien dekoratif, efek glow, glassmorphism.
- Label huruf kapital ber-tracking di atas setiap judul.
- Satu kata dalam judul diberi warna atau dimiringkan sendirian.
- Penomoran `01 / 02 / 03` pada konten yang bukan urutan.
- Panah `→` ditambahkan ke setiap tautan atau tombol.
- Animasi masuk fade-and-slide pada setiap seksi dan efek hover pada setiap kartu.
- Hero berisi angka besar dan statistik.
- Teks promosi dan klise ("revolusioner", "tingkatkan potensi", dll.).

**Gerak:** hanya untuk menjawab aksi pengguna (membuka, menutup, konfirmasi, komponen terpasang). Hormati `prefers-reduced-motion`.

### 15.4 Tata letak

```
Desktop                              HP (portrait)
┌────────────────────────────┐       ┌──────────────┐
│ menu                       │       │ menu         │
├──────────────┬─────────────┤       ├──────────────┤
│              │ tab:        │       │              │
│   panggung   │ Ikhtisar    │       │  panggung 3D │
│     3D       │ Spesifikasi │       │              │
│              │ Latihan     │       ├──────────────┤
│              │             │       │ panel (tab,  │
└──────────────┴─────────────┘       │ bisa ditarik)│
 daftar pelajaran: drawer/halaman    └──────────────┘
```

- Rata kiri untuk teks. Panjang baris di bawah 80 karakter.
- Layar 320 px tetap terpakai penuh. Target sentuh minimal 44 px.

### 15.5 Penulisan teks antarmuka (bahasa Indonesia)

- Kalimat sederhana, kata kerja aktif, sesuai level siswa Fase E. Istilah teknis diberi penjelasan singkat saat pertama muncul.
- Nama tombol menyebut hasilnya ("Selesaikan pelajaran", bukan "Kirim"), dan **konsisten** di seluruh alur (tombol "Selesaikan pelajaran" → pesan "Pelajaran selesai").
- Pesan gagal menjelaskan **apa yang terjadi dan cara memperbaikinya**, tanpa meminta maaf berlebihan atau bernada dramatis.
- Layar kosong berisi ajakan bertindak, bukan hiasan.
- Setiap teks hanya punya satu tugas. Tidak ada teks pengisi.

### 15.6 Mutu minimum

- Responsif sampai 320 px.
- Fokus keyboard terlihat jelas.
- Kontras warna memenuhi WCAG AA.
- Semua teks lewat i18n.
- Jalan tanpa ketergantungan CDN.

### 15.7 Proses kerja UI untuk AI

1. **Sebelum membangun UI**, AI menulis **rencana desain singkat**: token warna (nama + hex), tipografi, wireframe ASCII, dan prinsip. AI lalu **berhenti dan menunggu persetujuan Abid**.
2. AI memeriksa rencana terhadap daftar larangan di 15.3. Bagian yang terasa seperti bawaan generik harus direvisi.
3. Setelah UI dibangun, AI menyimpan **tangkapan layar pada lebar 320, 768, dan 1280 px** di `docs/screenshots/fase-N/`.
4. AI menjalankan checklist 15.3 dan 15.6 terhadap hasilnya, dan melaporkan hasilnya.
5. Perubahan tampilan setelah itu dilakukan lewat token, bukan menimpa gaya di banyak tempat.
