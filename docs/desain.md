# Rencana Desain UI/UX — Rakit PC (Fase 2A)

Dokumen ini merupakan rencana desain antarmuka 2D dan tata letak panggung 3D sesuai `SPEC.md` Bagian 15. Tidak ada kode UI yang ditulis sebelum dokumen ini disetujui.

> **Catatan pemeriksaan `docs/referensi/`:** Saat rencana ini disusun, folder `docs/referensi/` masih kosong (hanya berisi `.gitkeep`). Struktur dan perilaku mengacu pada rincian acuan di `SPEC.md` Bagian 15.1–15.6 tanpa menyalin palet, ilustrasi, atau teks situs referensi.

---

## 1. Token Warna (Tema Perangkat Keras & Meja Rakit)

Palet diambil dari material fisik perangkat keras komputer: baja casing matte, lapisan pelindung PCB (*solder mask*), jalur tembaga, dan kertas manual teknis. Hanya ada **satu warna aksen utama** untuk tindakan aktif. Seluruh pasangan teks dan latar memenuhi kontras **WCAG AA** (minimal `4.5:1` untuk teks normal dan `3:1` untuk komponen antarmuka).

| Token CSS | Nama Warna | Hex | Penggunaan & Kontras |
|---|---|---|---|
| `--color-surface-canvas` | Abu Sasis Gelap | `#181C20` | Latar panggung 3D saja agar objek komponen 3D menjadi pusat perhatian utama. |
| `--color-surface-page` | Putih Manual | `#F6F7F8` | Latar utama panel bacaan, daftar pelajaran, dan layar hasil (tenang, tidak silau di layar PC lab). |
| `--color-surface-panel` | Abu Aluminium | `#EAECEF` | Latar bilah menu atas, tab tidak aktif, kotak spesifikasi teknis, dan tombol sekunder. |
| `--color-border-line` | Garis Stensil PCB | `#C8D0D8` | Garis pemisah panel (`1px solid`), bingkai tabel spesifikasi, dan batas kontainer. |
| `--color-text-primary` | Hitam Silikon | `#14181D` | Teks utama, judul pelajaran, dan angka skor (kontras `15.8:1` di atas `#F6F7F8` — lolos AAA/AA). |
| `--color-text-secondary` | Abu Heatsink | `#47525E` | Teks keterangan tambahan, label satuan, dan petunjuk kontrol (kontras `7.1:1` di atas `#F6F7F8` — lolos AA). |
| `--color-accent-pcb` | Hijau Solder PCB *(Satu-satunya Aksen)* | `#0F6B4A` | Tombol aksi utama ("Selesaikan pelajaran"), indikator tab aktif, fokus keyboard (`outline 2px`), dan penanda progres (kontras `6.4:1` dengan teks putih `#FFFFFF` — lolos AA). |

**Warna Semantik Status (khusus umpan balik simulasi & peringatan, bukan hiasan):**
- `--color-status-error`: `#B42318` (Merah Korsleting — untuk penolakan fisik & kegagalan POST, latar `#FEF3F2`).
- `--color-status-warn`: `#8F4B00` (Tembaga Panas — untuk peringatan pengingat ESD, suhu pasta termal, atau cadangan daya tipis, latar `#FFFAEB`).

---

## 2. Tipografi (Self-Hosted, Tanpa CDN)

Semua berkas font (`.woff2`) disimpan langsung di `public/fonts/` agar aplikasi berjalan lancar di laboratorium sekolah tanpa internet.

1. **Font Antarmuka & Materi (`--font-sans`): `IBM Plex Sans`** (Bobot: `400` Regular, `500` Medium, `600` SemiBold)
   - **Peran:** Judul halaman, menu navigasi, isi penjelasan materi pelajaran, tombol, dan umpan balik diagnosis.
   - **Alasan:** Dirancang untuk dokumentasi rekayasa/teknis; bentuk huruf sangat jelas pada layar resolusi rendah PC lab tahun 2018–2022, membedakan huruf `I`, `l`, dan `1` dengan tegas.
2. **Font Data Teknis (`--font-mono`): `IBM Plex Mono`** (Bobot: `400` Regular, `600` SemiBold)
   - **Peran:** Tabel nilai spesifikasi (`DDR5`, `LGA1700`, `650 W`), penghitung progres (`3/12`), pola kode bip AMI (`3 pendek berulang`), waktu (`03:42`), dan label tombol pintasan (`WASD`, `Q`, `E`).

### Skala Ukuran & Aturan Baris
- **Teks isi utama (`--text-base`):** `16 px` (`1rem`), tinggi baris `1.6`, panjang baris dibatasi maks `68ch` (di bawah batas 80 karakter), rata kiri.
- **Label & petunjuk kontrol (`--text-sm`):** `14 px` (`0.875rem`), tinggi baris `1.45` — hanya untuk keterangan pintasan kamera dan metadata tabel.
- **Judul bagian / tab (`--text-lg`):** `18 px` (`1.125rem`), bobot `600`, *sentence case*.
- **Judul pelajaran (`--text-xl`):** `22 px` (`1.375rem`), bobot `600`, *sentence case*.
- **Angka skor layar hasil guru (`--text-display`):** `40 px` (`2.5rem`), `--font-mono`, bobot `600` — agar guru dapat membaca hasil dari jarak tatap muka dengan cepat.

---

## 3. Bentuk & Elemen Antarmuka Berdasarkan Fungsi

Radius sudut dan garis tidak disamaratakan, melainkan mengikuti fungsi elemen:
- **Panggung 3D & bilah tata letak utama:** `0 px` (persegi penuh, menempel langsung pada garis pembagi `1px solid var(--color-border-line)` seperti panel perangkat lunak CAD/teknik).
- **Tombol tindakan & kotak input:** `4 px` (tegas dan mudah dikenali sebagai kontrol interaktif, tinggi target sentuh minimal `44 px`).
- **Keycap pintasan keyboard (`W`, `A`, `S`, `D`):** `3 px` dengan garis batas bawah `2px` menyerupai tombol papan ketik fisik.
- **Dialog modal (Konfirmasi Reset Progres) & Drawer:** `8 px`.
- **Ikon:** Menggunakan SVG garis (*outline* `1.75px`) buatan sendiri yang konsisten; **tidak menggunakan emoji** sebagai ikon UI.

---

## 4. Wireframe ASCII

### 4.1 Beranda (Langsung Panggung 3D + Daftar Pelajaran, Tanpa Hero)

```
DESKTOP (1280 px)
+----------------------------------------------------------------------------------+
| Rakit PC   [Beranda] [Pelajaran] [Komponen] [Referensi]   Progres: 2/8  [ID] [⚙] |
+-------------------------------------------------+--------------------------------+
|                                                 | Daftar pelajaran               |
|                                                 | ------------------------------ |
|                                                 | Pengenalan komponen            |
|                 PANGGUNG 3D                     | [x] 1. Motherboard       Buka  |
|             (Latar #181C20 gelap)               | [x] 2. Prosesor (CPU)    Buka  |
|                                                 | [ ] 3. Memori (RAM)      Buka  |
|         [Unit PC Utuh — Klik bagian             | [ ] 4. Penyimpanan       Buka  |
|          untuk melihat nama komponen]           | [ ] 5. Catu daya (PSU)   Buka  |
|                                                 |                                |
|                                                 | Praktik & pemecahan masalah    |
|  +-------------------------------------------+  | [Terkunci] 6. Rakit PC         |
|  | Daftar komponen di panggung (Aksesibilitas|  |   Selesaikan pelajaran 1-5     |
|  | Keyboard): [Motherboard] [CPU] [RAM] [PSU]|  | [Terkunci] 7. Diagnosis bip    |
|  +-------------------------------------------+  |                                |
|  Geser: Seret / WASD | Putar: Q/E | Zoom: Roda  | Kualitas 3D: [Sedang v] [2D]   |
+-------------------------------------------------+--------------------------------+

HP PORTRAIT (320 px – 768 px)
+----------------------------------+
| Rakit PC        2/8   [Menu ≡]   |
+----------------------------------+
|                                  |
|           PANGGUNG 3D            |
|      (Tinggi ~45% viewport,      |
|       touch-action: none)        |
|                                  |
|  Komponen: [MB] [CPU] [RAM] ...  |
|  Cubit: Zoom | Geser: Putar      |
+----------------------------------+
| ==== Daftar pelajaran ========== |
| [x] 1. Motherboard         Buka  |
| [x] 2. Prosesor (CPU)      Buka  |
| [ ] 3. Memori (RAM)        Buka  |
| [Terkunci] 6. Rakit PC           |
|   Prasyarat: pelajaran 1-5       |
+----------------------------------+
```

### 4.2 Halaman Pelajaran (`#ram`, `#motherboard`, dll.)

```
DESKTOP (1280 px)
+----------------------------------------------------------------------------------+
| Rakit PC   [Beranda] [Pelajaran] [Komponen] [Referensi]   Progres: 2/8  [ID] [⚙] |
+-------------------------------------------------+--------------------------------+
| Pelajaran 3 dari 8: Memori (RAM)                | [Ikhtisar] [Spesifikasi]       |
|-------------------------------------------------| [Latihan]                      |
|                                                 | ------------------------------ |
|                                                 | Memori akses acak (RAM)        |
|                                                 |                                |
|                 PANGGUNG 3D                     | RAM bekerja seperti meja kerja |
|          (Modul DDR4 vs DDR5 & Slot)            | tempat prosesor menaruh data   |
|                                                 | yang sedang dipakai saat ini.  |
|      +-----------------------------------+      |                                |
|      | Bagian terpilih: Alur kunci/notch |      | Perhatikan celah kecil (notch) |
|      | Celah penanda agar RAM tidak      |      | di bagian bawah keping RAM     |
|      | terpasang terbalik atau salah slot|      | pada panggung 3D di samping.   |
|      +-----------------------------------+      |                                |
|                                                 | ------------------------------ |
|  Fokus keyboard: [Keping DDR5] [Notch] [Pengunci| [ < Sebelumnya ]               |
|  Geser: WASD | Putar: Q/E | Kualitas: [Sedang]  | [   Selesaikan pelajaran   ]   |
+-------------------------------------------------+--------------------------------+

HP PORTRAIT (320 px)
+----------------------------------+
| < Pelajaran   3. RAM       2/8   |
+----------------------------------+
|                                  |
|           PANGGUNG 3D            |
|     (Keping RAM & Slot DIMM)     |
|                                  |
|  Bagian: [DDR5] [Notch] [Slot]   |
+----------------------------------+
| [Ikhtisar] [Spesifikasi] [Latih] |
| -------------------------------- |
| RAM bekerja seperti meja kerja   |
| tempat prosesor menaruh data     |
| yang sedang dipakai saat ini.    |
|                                  |
| [     Selesaikan pelajaran     ] |
| [ < Sebelumnya ]  [ Berikutnya >]|
+----------------------------------+
```

### 4.3 Layar Hasil Siswa (Dirancang untuk Dilihat Guru Secara Tatap Muka)

```
DESKTOP (1280 px)
+----------------------------------------------------------------------------------+
| Rakit PC   [Beranda] [Pelajaran] [Komponen] [Referensi]   Progres: 6/8  [ID] [⚙] |
+----------------------------------------------------------------------------------+
| HASIL SIMULASI PERAKITAN & POST                                                  |
| Tunjukkan layar ini kepada guru untuk pemeriksaan tatap muka.                    |
|----------------------------------------------------------------------------------|
|  STATUS RAKITAN              SKOR AKHIR         WAKTU SELESAI    PERCOBAAN       |
|  POST berhasil (1 bip)       92 / 100           04:15            2 kali          |
|----------------------------------------------------------------------------------|
|  Rincian penilaian                                                               |
|  - Kelengkapan & kecocokan komponen : 60 / 60 (Semua komponen cocok & menyala)   |
|  - Ketepatan waktu perakitan        : 20 / 20 (Di bawah target 05:00)            |
|  - Efisiensi percobaan              : 15 / 20 (1 kesalahan fisik sempat ditolak) |
|  - Catatan peringatan               : -3 poin (RAM dipasang belum dual-channel)  |
|                                                                                  |
|  Umpan balik teknis untuk dipelajari:                                            |
|  1. Percobaan ke-1 sempat memasang RAM DDR5 secara terbalik (notch tidak sejajar)|
|  2. Dua keping RAM terpasang di slot A1 dan A2; pindahkan ke A2 dan B2 agar      |
|     berjalan pada mode kanal ganda (dual-channel).                               |
|                                                                                  |
|  [ Ulangi simulasi perakitan ]                     [ Kembali ke daftar pelajaran]|
+----------------------------------------------------------------------------------+

HP PORTRAIT (320 px)
+----------------------------------+
| Rakit PC — Hasil Simulasi   6/8  |
+----------------------------------+
| Tunjukkan layar ini kepada guru. |
|----------------------------------|
| STATUS   : POST berhasil (1 bip) |
| SKOR     : 92 / 100              |
| WAKTU    : 04:15                 |
| PERCOBAAN: 2 kali                |
|----------------------------------|
| Rincian:                         |
| - Hasil rakitan : 60 / 60        |
| - Waktu         : 20 / 20        |
| - Percobaan     : 15 / 20        |
| - Catatan       : -3 poin        |
|----------------------------------|
| Umpan balik:                     |
| - RAM di slot A1+A2 belum        |
|   dual-channel (gunakan A2+B2).  |
|                                  |
| [   Ulangi simulasi perakitan  ] |
| [  Kembali ke daftar pelajaran ] |
+----------------------------------+
```

---

## 5. Prinsip Desain (4 Kalimat)

1. **Panggung 3D adalah satu-satunya pusat visual:** halaman langsung membuka ruang kerja 3D berdampingan dengan panel materi tanpa halaman promosi atau hero, menggunakan latar kanvas gelap (`#181C20`) dan panel bacaan terang (`#F6F7F8`) yang tenang seperti lembar manual bengkel.
2. **Struktur pembagian bidang tegas tanpa kartu dekoratif:** batas antar-area menggunakan garis pembagi tipis `1px` (`#C8D0D8`) bergaya meja kerja teknis, bukan tumpukan kartu mengambang dengan bayangan seragam.
3. **Bahasa ruang kelas SMK yang jujur dan membimbing:** setiap teks memakai kalimat aktif sederhana dengan analogi keseharian, tombol menyebutkan hasil tindakannya ("Selesaikan pelajaran"), dan pesan kegagalan selalu menjelaskan penyebab fisik/logis beserta langkah perbaikannya.
4. **Inklusif untuk perangkat lab lama dan layar sempit:** seluruh komponen 3D memiliki tombol padanan di daftar fokus keyboard, mendukung mode cadangan gambar 2D, menggunakan font lokal tanpa CDN, dan tetap terbaca utuh hingga lebar layar `320 px`.

---

## 6. Pemeriksaan Mandiri terhadap Daftar Larangan (`SPEC.md` Bagian 15.3) & Revisi yang Dilakukan

Sebelum menetapkan rencana di atas, saya meninjau ulang konsep awal terhadap seluruh butir larangan Bagian 15.3 dan melakukan revisi berikut:

| Butir Larangan Bagian 15.3 | Temuan pada Konsep Awal | Revisi yang Diterapkan pada Rencana Ini |
|---|---|---|
| **Kartu identik dengan bayangan lembut di mana-mana** | Pada draf awal, daftar pelajaran dan ringkasan skor di layar hasil sempat dirancang sebagai kotak-kotak kartu (`border-radius: 12px`, `box-shadow`) dalam grid 4 kolom. | **Direvisi:** Seluruh daftar pelajaran dan ringkasan skor diubah menjadi **baris daftar berbatas garis `1px` datar** (*flat divided rows* dan tabel spesifikasi). Tidak ada `box-shadow` pada daftar konten; bayangan hanya boleh dipakai pada dialog konfirmasi modal yang melayang di atas halaman. |
| **Label huruf kapital ber-tracking di atas setiap judul** | Pada draf awal panel pelajaran dan layar hasil, sempat ada label kecil seperti `PELAJARAN 03 • MEMORI` atau `RINGKASAN SKOR` dengan `text-transform: uppercase; letter-spacing: 0.08em`. | **Direvisi:** Dihapus seluruhnya. Diganti dengan teks *sentence case* biasa (`Pelajaran 3 dari 8: Memori (RAM)`), dan satu-satunya huruf kapital penuh pada layar hasil hanyalah label kolom tabel ringkas untuk guru, tanpa efek *tracking* dekoratif. |
| **Penomoran `01 / 02 / 03` pada konten yang bukan urutan** | Pada draf awal daftar komponen referensi, komponen sempat diberi nomor `01`, `02`, `03`. | **Direvisi:** Penomoran dengan nol di depan (`01/02`) dihapus. Angka biasa (`1, 2, 3`) hanya dipakai pada **urutan pelajaran dan langkah perakitan** yang memang wajib berurutan sesuai prasyarat. |
| **Panah `→` ditambahkan ke setiap tautan atau tombol** | Tombol aksi di wireframe awal sempat memakai teks `[ Buka → ]` dan `[ Selesaikan pelajaran → ]`. | **Direvisi:** Semua panah dekoratif `→` pada tombol aksi utama dan daftar dihapus (`[ Buka ]`, `[ Selesaikan pelajaran ]`). Penanda arah `<` dan `>` hanya dipakai pada pasangan navigasi berurutan `Sebelumnya` / `Berikutnya`. |
| **Gradien dekoratif, efek glow, glassmorphism, & animasi masuk** | Panel keterangan komponen di atas panggung 3D sempat terpikir memakai latar semi-transparan (*backdrop-filter: blur*). | **Direvisi:** Diganti menjadi kotak latar padat `#181C20` dengan garis tepi `#C8D0D8` tanpa blur/glassmorphism dan tanpa animasi *fade-and-slide* saat halaman dimuat. |
| **Palet krem hangat + serif + terakota / menyalin situs referensi** | Situs referensi dan gaya bawaan generator sering memakai krem hangat dengan aksen oranye/terakota. | **Direvisi:** Memakai palet dingin industri perangkat keras (`#181C20` sasis, `#F6F7F8` kertas manual, `#EAECEF` aluminium, dan satu aksen `#0F6B4A` hijau PCB). |
