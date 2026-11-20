# Daftar Konten yang Membutuhkan Verifikasi (`TODO-VERIFIKASI`)

Sesuai `SPEC.md` Bagian 6.4, 6.5, dan 13.5, berkas ini mencatat seluruh entri data teknis dan tabel kode bip AMI yang ditandai `TODO-VERIFIKASI` agar diperiksa oleh pemilik proyek (Abid) sebelum digunakan pada rilis.

## 1. Tabel Kode Bip AMI (`src/content/beep-ami.json`)

| ID Entri | Pola Bip | Makna di Simulasi | Catatan Verifikasi |
|---|---|---|---|
| `ami-normal-post` | `1 pendek` | POST berhasil normal | `TODO-VERIFIKASI`: Pada dokumentasi AMI (AMIBIOS8 & Aptio), 1 bip pendek menandakan POST normal. Mohon konfirmasi kesesuaian dengan modul ajar SMK Fase E. |
| `ami-ram-missing-or-faulty` | `3 pendek berulang` | RAM tidak terdeteksi / gagal inisialisasi memori | `TODO-VERIFIKASI`: Pada tabel standar AMIBIOS, 3 bip pendek = *Base 64K memory failure* (dan pada kasus uji KU-54 disebut "Bunyi bip berulang — RAM tidak terdeteksi"). Mohon konfirmasi apakah pola yang diinginkan di UI/audio nanti adalah **3 bip pendek (berulang per siklus)** atau pola lain. |
| `ami-no-video-card` | `1 panjang, 3 pendek` | GPU tidak terdeteksi / gagal inisialisasi video | `TODO-VERIFIKASI`: Pada AMI Aptio modern umumnya `1 panjang, 3 pendek` (atau `8 pendek` pada AMIBIOS klasik). Mohon konfirmasi versi tabel AMI mana yang dipakai di sekolah. |
| `ami-cpu-failure` | `5 pendek` | Kesalahan prosesor (CPU error) | `TODO-VERIFIKASI`: Pada tabel standar AMIBIOS, 5 bip pendek = *Processor error*. Mohon konfirmasi. |

## 2. Spesifikasi Daya Komponen Awal (`src/content/components.json`)

| ID Komponen | Nama | Nilai Saat Ini | Catatan Verifikasi |
|---|---|---|---|
| `cpu-ryzen5-7600` | AMD Ryzen 5 7600 (AM5) | TDP `65 W` | `TODO-VERIFIKASI`: TDP resmi AMD 65W. |
| `cpu-i5-13400f` | Intel Core i5-13400F (LGA1700) | TDP `148 W` | `TODO-VERIFIKASI`: Processor Base Power 65W, Maximum Turbo Power 148W. |
| `cpu-i9-13900k` | Intel Core i9-13900K (LGA1700) | TDP `250 W` | `TODO-VERIFIKASI`: MTP resmi 253W, dibulatkan ke 250W agar kombinasi pengujian KU-36 menghasilkan total kebutuhan tepat 650W. |
| `gpu-rtx-4060` | GeForce RTX 4060 8 GB | TDP `115 W` | `TODO-VERIFIKASI`: TGP resmi NVIDIA 115W. |
| `gpu-high-power-320w` | GPU Kelas Atas 320 W | TDP `320 W` | `TODO-VERIFIKASI`: Komponen uji untuk menyimulasikan beban total 650W pada KU-36. |
