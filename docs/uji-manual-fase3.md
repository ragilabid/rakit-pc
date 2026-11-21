# Panduan Uji Manual Fase 3 — Lapisan 3D (Kategori B)

Sesuai `SPEC.md` Bagian 10 dan tugas Fase 3, sebagian kasus uji Kategori B (`KU-14`, `KU-17`, `KU-18`, `KU-19`, `KU-20`) telah diuji secara otomatis dengan Playwright namun **tetap membutuhkan verifikasi manual pada perangkat fisik nyata** (HP layar sentuh, PC lab sekolah keluaran 2018–2022, dan kondisi jaringan lambat 3G).

---

## 1. `[KU-14]` Layar Sentuh HP / Tablet (Geser, Cubit, Rotasi Tanpa Menggulung Halaman)

- **Perangkat uji:** Ponsel Android / iPhone dengan layar sentuh.
- **Langkah uji:**
  1. Buka URL aplikasi (`http://<ip-lokal>:8080/#ram`) di browser HP.
  2. Sentuh dan geser satu jari di **dalam area gelap panggung 3D** untuk memutar model.
  3. Cubit dua jari (*pinch*) di dalam area kanvas panggung 3D untuk memperbesar dan memperkecil (*zoom*).
  4. Geser dua jari di dalam kanvas untuk menggeser posisi kamera (*pan*).
  5. Sentuh dan gulir satu jari di **luar area kanvas** (misalnya pada panel teks pelajaran di bawah panggung).
- **Hasil yang diharapkan:**
  - Saat jari menyentuh kanvas 3D (`touch-action: none`), kamera berputar/zoom dengan mulus dan halaman browser **tidak ikut tergulung naik-turun**.
  - Saat jari menyentuh area panel materi di luar kanvas, halaman tetap bisa digulung normal untuk membaca materi.

---

## 2. `[KU-17]` Perangkat Spek Rendah (PC Lab Lama 2018–2022, FPS Rendah)

- **Perangkat uji:** PC laboratorium sekolah atau laptop tahun 2018–2022 dengan GPU terintegrasi (mis. Intel UHD 620 / HD 520).
- **Langkah uji:**
  1. Buka `#motherboard` dan ubah pemilih **Kualitas** di bilah atas panggung ke **Tinggi**.
  2. Putar kamera secara terus-menerus selama 5–10 detik.
  3. Bila FPS rata-rata turun di bawah 28 FPS, amati munculnya pita saran penurunan kualitas di bagian atas panggung.
  4. Klik tombol **Turunkan kualitas ke Rendah** (atau pilih **Rendah** / **Cadangan 2D**).
- **Hasil yang diharapkan:**
  - Aplikasi mendeteksi penurunan FPS dan menyarankan mode kualitas **Rendah**.
  - Saat berpindah ke kualitas **Rendah**, bayangan dinonaktifkan, resolusi piksel kanvas diturunkan (`DPR = 1`), dan interaksi kamera kembali responsif.
  - Bila PC lab sangat tua dan tidak mendukung WebGL2, aplikasi otomatis beralih ke **Cadangan 2D** tanpa crash.

---

## 3. `[KU-18]` Ukuran Layar Sangat Kecil (±320 px) di Perangkat Fisik

- **Perangkat uji:** HP layar sempit atau mode responsif `320 x 568 px`.
- **Langkah uji:**
  1. Buka `#beranda`, `#ram`, `#komponen`, dan `#hasil`.
  2. Periksa apakah ada tombol yang terpotong atau bilah geser horizontal yang muncul.
  3. Ketuk tombol komponen di bawah panggung dan tab `Ikhtisar` / `Spesifikasi` / `Latihan`.
- **Hasil yang diharapkan:**
  - Seluruh tombol memiliki tinggi minimal `44 px` dan nyaman diketuk jari.
  - Tidak ada teks atau tabel spesifikasi yang meluber ke luar lebar layar `320 px`.

---

## 4. `[KU-19]` Tab Browser di Latar Belakang Selama 5 Menit Lalu Kembali

- **Perangkat uji:** PC lab atau HP.
- **Langkah uji:**
  1. Buka `#cpu` dan pastikan panggung 3D tampil.
  2. Pindah ke tab browser lain (atau minimalkan browser) selama **5 menit**.
  3. Kembali ke tab aplikasi Rakit PC, lalu putar kamera dan klik salah satu komponen 3D.
- **Hasil yang diharapkan:**
  - Saat tab disembunyikan, loop render 3D dijeda otomatis sehingga tidak membebani CPU/GPU.
  - Saat kembali ke tab setelah 5 menit, kanvas 3D langsung melanjutkan render dengan normal tanpa konteks WebGL hilang (*context lost*) atau layar putih.

---

## 5. `[KU-20]` Koneksi Lambat (Jaringan 3G) Saat Memuat Model 3D

- **Perangkat uji:** Browser dengan Chrome DevTools → tab *Network* → *Throttling: Slow 3G* (atau koneksi seluler lambat di sekolah).
- **Langkah uji:**
  1. Aktifkan pembatasan jaringan **Slow 3G** di DevTools.
  2. Muat ulang halaman `/#motherboard`, lalu berpindah ke `/#ram` dan `/#psu`.
  3. Selama indikator pemuatan model tampil di panggung, coba klik tab `Spesifikasi` atau tombol navigasi.
- **Hasil yang diharapkan:**
  - Indikator muat model (`Memuat model komponen...`) tampil jelas di panggung.
  - Antarmuka pengguna (tab materi, daftar komponen keyboard, menu) **tetap responsif dan tidak macet** sembari panggung menyelesaikan pemuatan.
