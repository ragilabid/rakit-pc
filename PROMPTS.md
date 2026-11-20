# PROMPTS.md — Prompt AI per Fase

Salin satu prompt per sesi ke AI agent (Copilot agent, Claude Code, dll.). Semua prompt mengandalkan `SPEC.md` di akar repositori, jadi **pastikan `SPEC.md` ada sebelum mulai**.

Aturan pakai:
- Satu fase = satu (atau beberapa) sesi. **Jangan gabungkan fase.**
- Setelah AI selesai, **periksa laporannya** sebelum lanjut ke fase berikutnya.
- Ganti `<nama-proyek>` dengan nama folder/repo yang Anda pilih.

---

## Persiapan manual (dilakukan Abid, bukan AI)

1. Pasang: Git, Node.js (versi LTS), Docker Desktop, VS Code.
2. Buat folder kerja `<nama-proyek>` (huruf kecil, tanda hubung, tanpa spasi).
3. Taruh di dalamnya: `SPEC.md`, `PROMPTS.md`, dan `docs/kasus_uji_platform_perangkat_komputer.xlsx`.
4. Taruh tangkapan layar referensi (https://learn-esp32.vercel.app/) di `docs/referensi/`.
5. Buat repositori kosong di GitHub dengan **nama yang sama persis** dengan folder.
6. Di folder: `git init`, `git branch -M main`, `git remote add origin <url-repo>`, commit pertama berisi file di atas, lalu `git push -u origin main`.

---

## Prompt pembuka (awali SETIAP sesi)

```
Baca SPEC.md sampai habis sebelum melakukan apa pun. SPEC.md adalah
sumber kebenaran: jangan mengubah keputusan produk (Bagian 2) dan jangan
menambah fitur di luar SPEC. Jika ada konflik atau ambiguitas, tanya saya,
jangan menebak. Jangan mengarang data teknis; tandai TODO-VERIFIKASI jika
ragu. Kerjakan hanya fase yang saya sebutkan di bawah.
```

---

## Fase 0 — Fondasi

```
Kerjakan HANYA Fase 0 (SPEC.md Bagian 12).

Tugas:
1. Scaffold Vite + React + TypeScript (strict) di folder ini (jangan membuat
   subfolder baru; nama folder ini sama dengan nama repo).
2. Pasang ESLint, Prettier, Vitest, Playwright.
3. Buat struktur folder sesuai Bagian 4 (folder kosong pakai .gitkeep).
4. Buat Dockerfile multi-stage (build Node -> runtime nginx), nginx.conf,
   .dockerignore, docker-compose.yml sesuai Bagian 8. Kontainer non-root
   jika memungkinkan, ada HEALTHCHECK.
5. Buat vercel.json dasar (Bagian 9), .nvmrc, README singkat,
   CHANGELOG.md, CREDITS.md (kosong).
6. Buat CI GitHub Actions: lint, test, build.
7. Halaman awal berupa placeholder polos (tanpa desain; desain dikerjakan
   di Fase 2). Pasang <noscript> dengan pesan "aktifkan JavaScript".

Batasan: tidak ada backend, login, analitik, atau CDN eksternal saat runtime.

Selesai bila: npm run lint, npm run test, npm run build lolos DAN
docker build berhasil DAN container menyajikan halaman di localhost:8080.

Lalu ikuti Bagian 5: commit (Conventional Commits), push ke GitHub, merge ke
main, tag v0.0-fase0, centang Fase 0 di Bagian 12. Setelah itu BERHENTI dan
laporkan: apa yang dibuat, hasil tiap perintah, dan hal yang butuh keputusan
saya.
```

---

## Fase 1 — Skema data dan mesin domain

```
Kerjakan HANYA Fase 1 (SPEC.md Bagian 12). Tidak ada UI di fase ini.

Pegangan: Bagian 4 (arsitektur: src/domain tidak boleh meng-import React,
three.js, atau API browser), Bagian 6.3 (dua tingkat kegagalan), 6.4 (bip AMI),
dan docs/kasus_uji_platform_perangkat_komputer.xlsx (kategori D dan E).

Urutan kerja (TDD):
1. Rancang skema TypeScript + JSON untuk komponen (CPU, motherboard, RAM,
   PSU, casing, GPU, penyimpanan, pendingin, kabel) dan aturan kompatibilitas
   deklaratif. Tampilkan skemanya dan ringkasan keputusan desain.
2. Tulis tes Vitest DULU dari kasus uji kategori D dan E. Nama tes memuat
   nomor kasus, mis. it("[KU-31] soket CPU tidak cocok ditolak").
3. Implementasikan: kompatibilitas (tingkat FISIK ditolak, tingkat LOGIS
   dibiarkan lalu gagal saat POST), hitung daya PSU, state perakitan dan
   urutan pemasangan, simulasi POST, diagnosis dengan umpan balik penjelas
   (masalah dilaporkan satu per satu), skor (hasil + waktu + percobaan).
4. Data awal secukupnya untuk menjalankan tes saja (beberapa CPU AM5/LGA1700,
   RAM DDR4/DDR5, PSU 450/650 W, casing ATX/Mini-ITX). Katalog lengkap
   dikerjakan di Fase 5.
5. Tabel bip AMI: JANGAN mengarang. Buat src/content/beep-ami.json dengan
   penanda TODO-VERIFIKASI pada setiap entri yang tidak Anda yakini, dan
   daftar entri itu di docs/verifikasi-konten.md agar saya periksa.

Kasus 35 (ATX ke Mini-ITX): perlakukan sebagai kegagalan FISIK (ditolak),
tandai sebagai usulan di laporan.

Selesai bila: semua tes kategori D dan E hijau, lint dan build lolos,
docker build berhasil. Lalu Bagian 5 (commit, push, merge, tag
v0.1-fase1, centang Fase 1). BERHENTI dan laporkan, termasuk daftar
TODO-VERIFIKASI dan kasus uji yang menurut Anda ambigu.
```

---

## Fase 2 — UI 2D dan navigasi (dua langkah)

### 2A. Rencana desain (belum ada kode UI)

```
Kerjakan Fase 2 bagian pertama SAJA: rencana desain. JANGAN menulis kode UI.

Baca SPEC.md Bagian 15 dan lihat tangkapan layar di docs/referensi/.
Tulis rencana desain singkat (simpan di docs/desain.md dan tampilkan juga di
sini):
- Token warna: 4-6 warna bernama + hex (tema perangkat keras, satu aksen,
  kontras AA).
- Tipografi: font yang dipilih, peran masing-masing, skala ukuran.
- Wireframe ASCII untuk beranda, halaman pelajaran, dan layar hasil, untuk
  desktop dan HP.
- Prinsip desain (3-5 kalimat).

Lalu periksa sendiri rencana itu terhadap daftar larangan Bagian 15.3 dan
jelaskan bagian mana yang Anda revisi serta alasannya. Jangan menyalin palet,
ilustrasi, atau teks dari situs referensi.

BERHENTI di sini dan tunggu persetujuan saya.
```

### 2B. Membangun (setelah rencana disetujui)

```
Rencana desain di docs/desain.md sudah saya setujui. Kerjakan Fase 2
(SPEC.md Bagian 12) sesuai rencana itu.

Tugas:
1. Design tokens sebagai CSS variables sesuai docs/desain.md.
2. Hash router: slug tidak peka huruf besar/kecil, slug tidak dikenal jatuh
   ke beranda, Back/Forward berfungsi (Bagian 6.1).
3. Beranda, daftar pelajaran, halaman pelajaran dengan panel bertab,
   penghitung progres 0/N, penguncian prasyarat, reset progres dengan
   konfirmasi.
4. Store Zustand + persist (localStorage berversi), semua akses storage
   dalam try/catch dengan pemberitahuan jika storage tidak tersedia.
5. i18n (id default, fallback ke id) + skrip pemeriksa kunci terjemahan yang
   menggagalkan build jika ada yang hilang.
6. Teks UI sesuai Bagian 15.5. Gunakan konten contoh seperlunya.
7. Tes: kategori A dan sebagian C (Vitest + Playwright), nama tes memuat
   nomor kasus.

Setelah selesai: simpan tangkapan layar lebar 320, 768, 1280 px di
docs/screenshots/fase-2/, jalankan checklist Bagian 15.3 dan 15.6, dan
laporkan hasilnya jujur (termasuk yang belum lolos).

Lalu Bagian 5 (commit, push, merge, tag v0.2-fase2, centang Fase 2).
BERHENTI dan laporkan.
```

---

## Fase 3 — Lapisan 3D

```
Kerjakan HANYA Fase 3 (SPEC.md Bagian 12), mengikuti Bagian 6.2 dan 15.

Tugas:
1. Scene three.js + react-three-fiber dengan geometri PRIMITIF dari kode
   (kotak, silinder) untuk komponen. Belum memakai model GLB asli.
2. Kontrol kamera: mouse, sentuh (geser/cubit/rotasi tanpa menggulung
   halaman; touch-action hanya pada kanvas), zoom dibatasi min/max, kamera
   tidak menembus model. Pintasan keyboard tidak aktif saat fokus di input.
3. Klik komponen memunculkan label, nama, dan penjelasan fungsi.
4. Kualitas Rendah/Sedang/Tinggi + saran otomatis berdasarkan FPS.
5. Deteksi WebGL2; jika tidak ada, tampilkan pesan jelas dan mode cadangan 2D.
6. Jeda render saat tab tersembunyi; indikator muat model.
7. Padanan keyboard dan pembaca layar: daftar komponen yang bisa difokus
   sebagai alternatif klik di kanvas, aria-label lengkap.

Tes: Playwright untuk yang bisa diotomatisasi. Untuk yang tidak bisa (HP asli,
PC lab lama, jaringan 3G), buat daftar uji manual di
docs/uji-manual-fase3.md lengkap dengan langkah dan hasil yang diharapkan.

Simpan tangkapan layar di docs/screenshots/fase-3/ dan jalankan checklist
Bagian 15. Lalu Bagian 5 (commit, push, merge, tag v0.3-fase3, centang
Fase 3). BERHENTI dan laporkan.
```

---

## Fase 4 — Simulasi perakitan interaktif

```
Kerjakan HANYA Fase 4 (SPEC.md Bagian 12). Hubungkan mesin domain
(Fase 1) ke scene 3D (Fase 3). Jangan memindahkan logika ke komponen UI.

Tugas:
1. Alur: pilih komponen -> pasang di 3D -> urutan pemasangan sesuai data
   pelajaran -> nyalakan -> simulasi POST -> hasil.
2. Kegagalan FISIK ditolak langsung dengan penjelasan; kegagalan LOGIS
   dibiarkan terpasang lalu gagal saat dinyalakan dengan diagnosis yang
   mendidik (Bagian 6.3).
3. Lepas-pasang berulang tidak membuat komponen ganda.
4. Pengingat keselamatan ESD/K3 (hanya pengingat, tidak memblokir).
5. Layar hasil: skor, waktu, jumlah percobaan, umpan balik, dengan teks besar
   dan jelas untuk dilihat guru tatap muka. Tanpa fitur kirim/ekspor.
6. Mode pemecahan masalah dengan kode bip AMI dan umpan balik penjelas.
7. Tes E2E Playwright untuk satu alur rakitan benar dan beberapa alur gagal
   (soket salah, RAM salah, PSU kurang, kabel daya lupa).

Simpan tangkapan layar di docs/screenshots/fase-4/ dan jalankan checklist
Bagian 15. Lalu Bagian 5 (commit, push, merge, tag v0.4-fase4, centang
Fase 4). BERHENTI dan laporkan.
```

---

## Fase 5 — Konten dan aset

```
Kerjakan HANYA Fase 5 (SPEC.md Bagian 12).

Tugas:
1. Katalog lengkap di src/content/: komponen INTERNAL, EKSTERNAL (keyboard,
   mouse, monitor, printer, dll.), dan USANG (IDE, VGA, PS/2, sebagai materi
   sejarah), level Fase E SMK.
2. Pelajaran dengan deskripsi 1-2 kalimat berbasis analogi keseharian
   (Bagian 15.1 dan 15.5), tab Spesifikasi, dan penjelasan istilah ambigu
   (HDD/SSD/SSHD, SATA vs NVMe M.2, DDR4 vs DDR5).
3. Kuis dan latihan, plus kasus uji kategori F yang saya setujui
   (lihat Bagian 11: usulkan dulu daftar kasusnya, tunggu persetujuan).
4. Terjemahan lengkap Indonesia (default); pemeriksa i18n harus lolos.
5. Model 3D: tetap primitif kecuali saya sediakan model di public/models/.
   Model eksternal hanya yang berlisensi jelas (CC0/CC-BY) dan dicatat di
   CREDITS.md.
6. PENTING: semua data teknis (soket, standar RAM, kebutuhan daya, kode bip)
   yang Anda tulis dari pengetahuan sendiri harus bertanda TODO-VERIFIKASI
   dan dikumpulkan di docs/verifikasi-konten.md dalam tabel
   (item, nilai yang ditulis, sumber yang disarankan) agar saya periksa.

Lalu Bagian 5 (commit, push, merge, tag v0.5-fase5, centang Fase 5).
BERHENTI dan laporkan.
```

---

## Fase 6 — Penyempurnaan dan rilis

```
Kerjakan HANYA Fase 6 (SPEC.md Bagian 12).

Tugas:
1. PWA: service worker men-cache aset dan model, aplikasi tetap jalan saat
   jaringan lambat atau offline.
2. Kinerja: ukur ukuran muat awal dan per pelajaran, optimalkan model dan
   tekstur (Draco/meshopt, lazy load), laporkan angkanya.
3. Aksesibilitas: audit keyboard-only dan pembaca layar, perbaiki temuan.
4. Daftar uji manual lengkap untuk perangkat 2018-2022 (HP, laptop lab lama,
   jaringan lambat) di docs/uji-manual-rilis.md.
5. Pastikan SEMUA kasus uji di xlsx terpetakan ke tes (otomatis atau manual);
   buat tabel pemetaannya di docs/pemetaan-kasus-uji.md.
6. Docker final: build bersih, jalankan, uji health check.
7. Siapkan panduan deploy Vercel (Bagian 9) di README: pengaturan Vite,
   build command, output directory, analitik dimatikan. Anda tidak bisa
   men-deploy sendiri; saya yang menghubungkan repo ke Vercel.
8. Smoke test untuk URL produksi (skrip Playwright dengan base URL
   yang bisa diatur).

Lalu Bagian 5 (commit, push, merge, tag v1.0, centang Fase 6). BERHENTI dan
laporkan hal yang perlu saya lakukan manual (deploy Vercel, uji di perangkat).
```

---

## Prompt pendukung

### Memperbaiki bug

```
Baca SPEC.md. Ada bug: <deskripsi + langkah mengulang + yang diharapkan>.
Mulai dengan menulis tes yang gagal untuk bug ini, baru perbaiki. Jangan
mengubah perilaku lain. Jalankan lint, test, build; commit dengan pesan
"fix: ..." dan push ke GitHub. Laporkan akar masalahnya.
```

### Tinjauan UI (anti tampilan "buatan AI")

```
Baca SPEC.md Bagian 15. Tinjau UI saat ini tanpa mengubah kode dulu.
Ambil tangkapan layar di 320, 768, 1280 px, lalu periksa satu per satu
terhadap daftar larangan 15.3 dan mutu minimum 15.6. Laporkan temuan
beserta lokasi file/komponen dan usulan perbaikan lewat design tokens.
Tunggu persetujuan saya sebelum memperbaiki.
```

### Menutup sesi

```
Ringkas apa yang selesai, apa yang belum, dan apa yang perlu keputusan saya.
Pastikan semua perubahan sudah di-commit dan di-push, dan perbarui
CHANGELOG.md serta centang fase di SPEC.md Bagian 12 bila fase selesai.
```
