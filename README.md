# Rakit PC — Platform Belajar Perangkat Komputer 3D & Simulasi Perakitan PC

**Rakit PC** adalah aplikasi web pembelajaran interaktif berbasis 3D yang dirancang khusus untuk siswa **Fase E SMK** (program keahlian **TJKT**, **DPIB**, dan **KKA**). Aplikasi ini membantu siswa mengenali bentuk fisik, tata letak, dan spesifikasi perangkat keras komputer secara visual dalam ruang tiga dimensi (3D), mempelajari alur perakitan komputer langkah demi langkah secara virtual, serta melatih kemampuan pemecahan masalah (*troubleshooting*) perangkat keras berdasarkan kode bunyi (*beep codes*) standar **AMI BIOS**.

Aplikasi ini dibangun dengan prinsip **ramah laboratorium sekolah**: berjalan sepenuhnya di sisi peramban (*client-side*) tanpa memerlukan pembuatan akun atau login, tidak mengumpulkan maupun mengirimkan data pribadi siswa ke server mana pun, menyimpan progres belajar secara lokal di perangkat (`localStorage`), serta dilengkapi dukungan **Progressive Web App (PWA)** dan aset mandiri (*self-hosted*) sehingga tetap dapat digunakan di laboratorium komputer sekolah atau ponsel siswa dengan koneksi internet lambat maupun kondisi *offline*.

Spesifikasi teknis dan aturan domain lengkap proyek ini terdokumentasi di [SPEC.md](./SPEC.md).

---

## Fitur Utama

1. **Panggung Eksplorasi Komponen 3D Interaktif**
   - Visualisasi 3D perangkat keras komputer yang dapat diputar, digeser, dan diperbesar menggunakan tetikus (*mouse*), layar sentuh (*touch gesture*), maupun pintasan papan ketik (`WASD`, `Q/E`, `+`, `-`).
   - Klik pada bagian komponen di panggung 3D atau melalui daftar tombol aksesibilitas untuk melihat label nama komponen beserta penjelasan fungsinya secara langsung.
   - Pengaturan kualitas grafis (**Rendah**, **Sedang**, **Tinggi**) dengan pemantau FPS otomatis untuk perangkat tahun 2018–2022, serta **Mode Cadangan 2D** apabila perangkat tidak mendukung WebGL2.
2. **Materi Pelajaran Terstruktur & Sistem Prasyarat**
   - Tujuh modul pelajaran berurutan mulai dari pengenalan *Motherboard*, Prosesor (*CPU*) & Pendingin, Memori (*RAM*), Penyimpanan (*HDD, SSD SATA, NVMe M.2*), Catu Daya (*PSU*) & Perhitungan Daya, Simulasi Perakitan PC, hingga Pemecahan Masalah & Kode Bip AMI.
   - Setiap pelajaran dilengkapi tab **Ikhtisar** (menggunakan analogi keseharian yang mudah dipahami siswa), **Spesifikasi** (perbandingan teknis seperti DDR4 vs DDR5, SATA vs NVMe M.2), dan **Latihan / Kuis** interaktif.
   - Sistem penguncian prasyarat memastikan siswa menyelesaikan materi dasar secara berurutan sebelum memasuki tahap perakitan penuh.
3. **Katalog Komponen Lengkap (Internal, Eksternal, & Usang)**
   - Mencakup komponen **Internal** inti, perangkat **Eksternal / Periferal** (*keyboard*, *mouse*, monitor, *printer*, *scanner*), serta komponen **Usang / Sejarah** (*kabel pita IDE/PATA*, *port VGA D-Sub*, *konektor PS/2*) sebagai bahan pembelajaran perkembangan teknologi perangkat keras.
4. **Simulasi Perakitan PC dengan Dua Tingkat Kegagalan**
   - **Kegagalan Tingkat 1 — Fisik (Ditolak Langsung):** sistem menolak pemasangan komponen yang mustahil secara fisik (misalnya memasang prosesor soket AM5 ke motherboard LGA1700, memasang RAM DDR4 ke slot DDR5, orientasi segitiga CPU/celah *notch* RAM terbalik, atau motherboard ATX ke casing Mini-ITX) disertai penjelasan teknis mengapa komponen tersebut tidak cocok.
   - **Kegagalan Tingkat 2 — Logis (Terpasang, Didiagnosis saat POST):** komponen yang cocok secara fisik tetapi keliru secara konfigurasi (misalnya lupa mengoleskan pasta termal, kapasitas daya PSU kurang, kabel daya ATX 24-pin/CPU 8-pin/PCIe belum terhubung, baut *standoff* tidak sesuai, atau kabel monitor dicolok ke port motherboard saat memakai GPU diskrit) tetap diizinkan terpasang, lalu didiagnosis secara mendidik saat siswa menekan tombol **Nyalakan PC (Simulasi POST)**.
5. **Layar Hasil Penilaian Dinamis untuk Pemeriksaan Tatap Muka Guru**
   - Menghitung skor akhir secara otomatis dan *real-time* berdasarkan tiga komponen penilaian: **Kelengkapan & Kecocokan Komponen (maks. 60 poin)**, **Ketepatan Waktu Perakitan (maks. 20 poin)**, dan **Efisiensi Percobaan (maks. 20 poin)**, ditambah ringkasan skor kuis teori.
   - Dirancang dengan tipografi besar dan kontras tinggi agar mudah diperiksa langsung oleh guru secara tatap muka di kelas tanpa memerlukan server penilaian atau fitur ekspor data.

---

## Arsitektur & Teknologi

Aplikasi menggunakan arsitektur empat lapisan dengan arah ketergantungan satu arah dari atas ke bawah:

1. **Lapisan Antarmuka Pengguna (`src/ui/`, `src/router/`, `src/store/`, `src/i18n/`)** — Dibangun dengan **React 19**, **TypeScript** (*strict mode*), **Zustand** (penyimpanan lokal berversi dengan penanganan `try/catch`), *hash router* khusus (`#slug`), serta **i18next** (Bahasa Indonesia sebagai bahasa utama dan Bahasa Inggris sebagai bahasa opsional).
2. **Lapisan Visualisasi 3D (`src/three/`)** — Dibangun di atas **Three.js**, `@react-three/fiber`, dan `@react-three/drei` dengan pemuatan terpisah (*lazy loading* / *code-splitting*) agar muat awal halaman 2D tetap ringan.
3. **Lapisan Mesin Domain Murni (`src/domain/`)** — Ditulis dalam TypeScript murni tanpa ketergantungan pada React, Three.js, maupun API peramban. Mencakup aturan kompatibilitas (`compat`), kalkulator daya (`power`), negara bagian perakitan (`assembly`), simulator POST & kode bip AMI (`post`), mesin diagnosis (`diagnosis`), dan kalkulator penilaian (`scoring`).
4. **Lapisan Data & Konten Deklaratif (`src/content/`)** — Seluruh katalog komponen, materi pelajaran, soal kuis, aturan kompatibilitas, dan tabel kode bip AMI disimpan dalam format JSON terstruktur.

---

## Prasyarat Sistem

Sebelum menginstal dan menjalankan proyek ini di komputer lokal atau server laboratorium, pastikan perangkat Anda telah memasang perangkat lunak berikut:

- **Node.js** versi **24.x** (sesuai dengan konfigurasi di file [.nvmrc](./.nvmrc)) — diperlukan untuk pengembangan lokal dan proses *build* menggunakan `npm`.
- **npm** (Node Package Manager, otomatis terpasang bersama Node.js).
- **Git** — diperlukan untuk mengkloning repositori dan mengelola versi kode.
- **Docker Desktop** (Windows/macOS) atau **Docker Engine + Docker Compose** (Linux) — diperlukan apabila Anda ingin membangun dan menjalankan aplikasi di dalam kontainer server mandiri.

---

## Panduan Instalasi & Penggunaan dengan npm (Pengembangan Lokal)

Gunakan panduan ini apabila Anda ingin menjalankan aplikasi secara langsung di komputer pengembangan, memodifikasi kode sumber, atau menjalankan pengujian otomatis.

### 1. Mengkloning Repositori

Buka terminal (PowerShell, Command Prompt, atau Bash), lalu kloning repositori ini dan masuk ke direktori proyek:

```bash
git clone https://github.com/ragilabid/rakit-pc.git
cd rakit-pc
```

### 2. Menginstal Dependensi Paket

Instal seluruh pustaka dan dependensi yang tercatat di `package.json` dan `package-lock.json`:

```bash
npm install
```

> **Catatan:** Jika Anda menginginkan instalasi bersih yang persis mengikuti versi terkunci di `package-lock.json` (seperti pada lingkungan pengujian atau server build), gunakan perintah:
> ```bash
> npm ci
> ```

### 3. Menjalankan Server Pengembangan Lokal (*Development Server*)

Untuk menjalankan aplikasi dalam mode pengembangan dengan fitur *Hot Module Replacement* (pembaruan halaman otomatis saat kode diubah):

```bash
npm run dev
```

Setelah server aktif, buka peramban (*browser*) dan kunjungi alamat yang ditampilkan di terminal (umumnya **`http://localhost:5173`**).

### 4. Membangun Bundel Produksi (*Production Build*) & Pratinjau Lokal

Untuk memeriksa kelengkapan kamus bahasa, mengompilasi TypeScript, dan membundel aset aplikasi siap pakai ke dalam direktori `dist/`:

```bash
npm run build
```

Setelah proses `npm run build` selesai, Anda dapat menguji hasil bundel produksi tersebut secara lokal menggunakan server pratinjau Vite:

```bash
npm run preview
```

Server pratinjau akan menyajikan isi folder `dist/` di **`http://localhost:4173`**.

### 5. Menjalankan Pemeriksaan Kualitas Kode & Pengujian Otomatis

Proyek ini dilengkapi dengan skrip validasi terjemahan, pemeriksa kode statis (*linter*), pengujian unit mesin domain, serta pengujian antarmuka menyeluruh (*End-to-End*). Jalankan perintah-perintah berikut sesuai kebutuhan:

| Perintah | Penjelasan Fungsi |
|---|---|
| `npm run check:i18n` | Memverifikasi keselarasan seluruh kunci terjemahan antara `src/i18n/id.json`, `src/i18n/en.json`, `src/content/lessons.json`, dan `src/content/quiz.json`. Menggagalkan proses *build* jika ada kunci yang hilang. |
| `npm run lint` | Menjalankan **ESLint** untuk memeriksa kualitas kode TypeScript/React serta memastikan aturan arsitektur (seperti larangan impor React/Three.js di dalam `src/domain/`) dipatuhi. |
| `npm run format:check` | Memeriksa konsistensi pemformatan kode sumber menggunakan **Prettier**. (Gunakan `npm run format` untuk merapikan format secara otomatis). |
| `npm run test` | Menjalankan seluruh pengujian unit mesin domain dan integritas data konten menggunakan **Vitest** (`tests/unit/`). |
| `npm run test:e2e` | Menjalankan seluruh pengujian *End-to-End* antarmuka pengguna dan simulasi perakitan 3D menggunakan **Playwright** (`tests/e2e/`). |
| `npm run test:smoke` | Menjalankan pengujian cepat (*smoke test*) menggunakan **Playwright** untuk memverifikasi navigasi utama, penyelesaian pelajaran, mode cadangan 2D, layar hasil penilaian dinamis, dan kesiapan PWA. |

---

## Panduan Instalasi & Penayangan dengan Docker (Server Sekolah / Offline)

Proyek ini menyediakan konfigurasi kontainer mandiri menggunakan [Dockerfile](./Dockerfile) *multi-stage*, [nginx.conf](./nginx.conf), dan [docker-compose.yml](./docker-compose.yml). Pendekatan ini sangat direkomendasikan untuk pemasangan di **server laboratorium sekolah** atau komputer lokal tanpa perlu menginstal Node.js di mesin target.

### Cara Kerja Kontainer Docker Rakit PC

1. **Tahap 1 (`builder` — `node:24-alpine`):** Menginstal dependensi dengan `npm ci`, memvalidasi kamus bahasa (`check:i18n`), memeriksa tipe TypeScript (`tsc -b`), dan membangun bundel produksi statis ke folder `/app/dist`.
2. **Tahap 2 (`runtime` — `nginx:1.27-alpine`):** Menyalin hasil build statis dari tahap pertama ke peladen web **Nginx** ringan yang telah dikonfigurasi dengan:
   - Kompresi `gzip` untuk mempercepat pemuatan aset di jaringan lokal.
   - *Header* cache jangka panjang untuk aset ber-hash (`/assets/`) dan `no-cache` untuk `index.html` serta `sw.js` (Service Worker PWA).
   - Tipe MIME standar untuk model 3D (`.glb` / `.gltf`) dan manifes aplikasi web (`.webmanifest`).
   - Eksekusi proses sebagai pengguna **non-root** (`uid=101(nginx)`) demi keamanan kontainer.
   - Pemeriksaan kesehatan otomatis (`HEALTHCHECK`) berkala ke `http://127.0.0.1:80/`.

---

### Metode A — Menggunakan Docker Compose (Direkomendasikan)

Metode ini paling praktis karena seluruh pengaturan pemetaan *port* (`8080:80`) dan kebijakan *restart* telah didefinisikan di dalam [docker-compose.yml](./docker-compose.yml).

1. **Pastikan Docker sudah berjalan** di komputer atau server Anda.
2. **Bangun dan jalankan layanan kontainer di latar belakang (*detached mode*):**
   ```bash
   docker compose up --build -d
   ```
3. **Verifikasi bahwa kontainer telah berjalan dan berstatus `healthy`:**
   ```bash
   docker compose ps
   ```
4. **Akses aplikasi di peramban:**
   Buka peramban dan kunjungi **`http://localhost:8080`** (atau `http://<alamat-IP-server-lab>:8080` jika diakses dari komputer siswa di jaringan lokal laboratorium).
5. **Melihat log akses atau menghentikan layanan:**
   - Untuk melihat log server Nginx:
     ```bash
     docker compose logs -f
     ```
   - Untuk menghentikan dan menghapus kontainer layanan:
     ```bash
     docker compose down
     ```

---

### Metode B — Menggunakan Perintah Docker CLI Standar

Jika Anda ingin membangun *image* dan mengelola kontainer secara manual menggunakan perintah `docker` standar tanpa Docker Compose:

1. **Bangun *image* Docker dari direktori akar proyek:**
   ```bash
   docker build -t rakit-pc:latest .
   ```
2. **Jalankan kontainer pada *port* `8080`:**
   - Menjalankan secara interaktif (kontainer otomatis dihapus saat dihentikan dengan `Ctrl+C`):
     ```bash
     docker run --rm -p 8080:80 rakit-pc:latest
     ```
   - Atau menjalankan di latar belakang (*background daemon*) dengan nama `rakit-pc-app`:
     ```bash
     docker run -d --name rakit-pc-app -p 8080:80 rakit-pc:latest
     ```
3. **Periksa status kesehatan (`HEALTHCHECK`) kontainer:**
   ```bash
   docker inspect --format="{{.State.Health.Status}}" rakit-pc-app
   ```
   Output `healthy` menandakan server Nginx di dalam kontainer siap melayani permintaan pengguna di **`http://localhost:8080`**.
4. **Menghentikan dan menghapus kontainer latar belakang:**
   ```bash
   docker stop rakit-pc-app
   docker rm rakit-pc-app
   ```

---

## Struktur Direktori Proyek

```text
rakit-pc/
├─ SPEC.md                    # Dokumen spesifikasi utama proyek
├─ README.md                  # Panduan deskripsi, instalasi npm, dan Docker
├─ CHANGELOG.md               # Riwayat perubahan setiap fase pengembangan
├─ CREDITS.md                 # Catatan lisensi font, pustaka, dan aset 3D
├─ Dockerfile                 # Konfigurasi build multi-stage Docker (Node 24 -> Nginx)
├─ docker-compose.yml         # Konfigurasi orkestrasi kontainer lokal (port 8080)
├─ nginx.conf                 # Konfigurasi server Nginx (non-root, gzip, cache, MIME)
├─ public/
│  ├─ manifest.webmanifest    # Manifes Progressive Web App (PWA)
│  ├─ sw.js                   # Service Worker untuk caching aset & mode offline
│  └─ models/                 # Direktori model 3D eksternal (opsional)
├─ scripts/
│  └─ check-i18n.mjs          # Skrip pemeriksa kelengkapan kunci terjemahan i18n
├─ src/
│  ├─ domain/                 # Mesin logika domain murni (assembly, compat, power, post, diagnosis, scoring)
│  ├─ content/                # Data JSON deklaratif (components, lessons, rules, beep-ami, quiz)
│  ├─ three/                  # Panggung & perakitan komponen 3D (React Three Fiber)
│  ├─ ui/                     # Komponen antarmuka pengguna React & token gaya CSS
│  ├─ store/                  # State management Zustand (progres belajar & pengaturan)
│  ├─ i18n/                   # Kamus bahasa Indonesia (id.json) & Inggris (en.json)
│  └─ router/                 # Hash router (#beranda, #pelajaran, #komponen, #hasil, dll.)
├─ docs/                      # Dokumentasi desain, pemetaan kasus uji, & panduan uji manual
└─ tests/
   ├─ unit/                   # Pengujian unit Vitest untuk mesin domain & konten
   └─ e2e/                    # Pengujian End-to-End & smoke test Playwright
```

---

## Dokumentasi Terkait

- [SPEC.md](./SPEC.md) — Spesifikasi utama, keputusan produk, dan aturan arsitektur proyek
- [CHANGELOG.md](./CHANGELOG.md) — Catatan rilis dari Fase 0 hingga Rilis `v1.0`
- [CREDITS.md](./CREDITS.md) — Daftar atribusi dan lisensi aset/pustaka
- [docs/desain.md](./docs/desain.md) — Rencana desain antarmuka, token warna, tipografi, dan wireframe
- [docs/verifikasi-konten.md](./docs/verifikasi-konten.md) — Tabel verifikasi data teknis perangkat keras (`TODO-VERIFIKASI`)
- [docs/pemetaan-kasus-uji.md](./docs/pemetaan-kasus-uji.md) — Tabel pemetaan lengkap 63 kasus uji (`KU-01` s.d. `KU-63`)
- [docs/uji-manual-rilis.md](./docs/uji-manual-rilis.md) — Daftar periksa pengujian manual untuk perangkat tahun 2018–2022, HP, dan jaringan lambat/offline
