# Daftar Uji Manual Rilis v1.0 (Perangkat 2018–2022, HP, & Jaringan Lambat/Offline)

Dokumen ini berisi daftar periksa uji manual untuk memverifikasi rilis `v1.0` pada perangkat nyata yang digunakan oleh siswa dan guru SMK Fase E (PC laboratorium sekolah tahun 2018–2022, ponsel siswa, dan jaringan sekolah yang lambat atau terputus).

---

## A. Uji pada PC / Laptop Laboratorium Sekolah (Keluaran 2018–2022)

**Spesifikasi acuan:** Prosesor dual/quad-core generasi 2018–2022 (mis. Intel Core i3-8100 / Ryzen 3 3200G / Celeron N4020), RAM 4–8 GB, GPU terintegrasi (Intel UHD 620/630), resolusi layar `1366 x 768` atau `1920 x 1080`.

| ID Uji | Kasus Uji Terkait | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| `UM-01` | `KU-13`, `KU-17` | Buka aplikasi di Chrome/Edge PC lab. Amati apakah panggung 3D menyala. Ubah kualitas dari **Sedang** ke **Rendah**. | Panggung 3D tampil tanpa galat WebGL2. Pada mode **Rendah**, beban GPU turun (DPR 1, tanpa bayangan) dan rotasi kamera lancar. Bila WebGL2 dimatikan di komputer lab, otomatis tampil pesan jelas dan mode **Cadangan 2D**. | `[ ]` |
| `UM-02` | `KU-15`, `KU-16` | Putar kamera dengan mouse, scroll roda mouse sampai batas terdekat dan terjauh. Ketik huruf `w` di kotak **Cari bagian di panggung**, lalu klik di luar kotak dan tekan `W`, `A`, `S`, `D`, `Q`, `E`. | Zoom berhenti pada jarak `2,2 m` (tidak menembus model) dan `9,0 m`. Saat mengetik di kotak pencarian, kamera tidak bergerak; saat fokus di luar input, `WASD` menggeser dan `Q/E` memutar kamera. | `[ ]` |
| `UM-03` | `KU-19` | Buka pelajaran `#motherboard`, pindah ke tab browser lain atau minimalkan jendela selama **5 menit**, lalu kembali ke tab aplikasi. | Saat tab di latar belakang, render 3D dijeda otomatis. Saat kembali setelah 5 menit, panggung 3D lanjut merender normal tanpa *WebGL context lost* atau crash. | `[ ]` |
| `UM-04` | `KU-21` | Lepas mouse, gunakan hanya tombol `Tab`, `Shift+Tab`, `Enter`, dan `Spasi` untuk berpindah menu, membuka pelajaran, memilih komponen di bawah panggung, dan menjawab kuis. | Garis fokus hijau (`2px solid #0F6B4A`) selalu terlihat jelas, tautan **Lewati ke konten utama** muncul di awal `Tab`, dan seluruh komponen 3D bisa dipilih melalui daftar tombol keyboard. | `[ ]` |

---

## B. Uji pada Ponsel Siswa (Layar Sentuh Android / iOS, Lebar Sempit ±320–412 px)

| ID Uji | Kasus Uji Terkait | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| `UM-05` | `KU-14` | Buka `#ram` di ponsel. Sentuh dan geser 1 jari di dalam kanvas 3D untuk memutar, cubit 2 jari untuk zoom. Lalu geser 1 jari pada panel teks materi di paruh bawah layar. | Gerakan jari di dalam kanvas 3D (`touch-action: none`) hanya menggerakkan kamera 3D tanpa menggulung halaman. Gerakan jari di panel materi bawah menggulung teks materi secara terpisah sementara panggung 3D tetap terlihat di atas. | `[ ]` |
| `UM-06` | `KU-18` | Uji tampilan potret (*portrait*) pada ponsel layar kecil (atau mode responsif `320 px`). Buka `#beranda`, `#rakit-pc`, dan `#hasil`. | Tidak ada teks atau tombol yang terpotong ke samping (tidak ada *horizontal scrollbar*). Semua tombol memiliki tinggi minimal `44 px` dan mudah diketuk jari. | `[ ]` |

---

## C. Uji Jaringan Lambat (3G) & Mode Offline (PWA Service Worker)

| ID Uji | Kasus Uji Terkait | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| `UM-07` | `KU-20` | Di Chrome DevTools → tab *Network*, aktifkan *Throttling: Slow 3G*. Muat ulang halaman `/#beranda` lalu buka `/#cpu`. | Indikator pemuatan model tampil di panggung, sementara teks pelajaran, tab `Spesifikasi`, dan tombol navigasi tetap responsif tanpa macet. | `[ ]` |
| `UM-08` | PWA Offline | Setelah membuka aplikasi minimal sekali, matikan koneksi Wi-Fi/data (atau pilih *Offline* di DevTools *Network*), lalu *refresh* halaman dan berpindah dari `#motherboard` ke `#ram` serta `#rakit-pc`. | Service worker (`sw.js`) menyajikan aplikasi, font lokal, dan bundel 3D dari cache. Aplikasi tetap berjalan penuh secara offline termasuk simulasi perakitan dan kuis. | `[ ]` |

---

## D. Uji Pemeriksaan Tatap Muka oleh Guru & Privasi Siswa

| ID Uji | Kasus Uji Terkait | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| `UM-09` | `KU-52`, `KU-60`, `KU-61` | Selesaikan kuis di tab `Latihan` dan jalankan simulasi perakitan hingga POST di `#rakit-pc`, lalu klik **Lihat layar hasil untuk guru** (`#hasil`). Muat ulang halaman. | Layar `#hasil` menampilkan status POST, skor akhir (`0–100`), waktu rakit (`mm:ss`), jumlah percobaan, skor kuis teori (`%`), rincian poin, dan umpan balik teknis dengan ukuran huruf besar yang mudah dibaca guru dari jarak tatap muka, serta tetap tersimpan setelah *reload*. | `[ ]` |
| `UM-10` | `KU-07`, `KU-11`, `KU-63` | Buka aplikasi di jendela penyamaran (*Incognito/Private*) atau perangkat lain. Periksa tab *Network* di DevTools selama pemakaian. | Progres bersifat lokal di browser tersebut (tidak ikut ke perangkat lain), tidak memerlukan login, dan tidak ada permintaan jaringan yang mengirim data siswa ke server mana pun. | `[ ]` |
