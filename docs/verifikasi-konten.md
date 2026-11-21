# Daftar Konten yang Membutuhkan Verifikasi (`TODO-VERIFIKASI`)

Sesuai `SPEC.md` Bagian 6.4, 6.5, 13.5, dan instruksi Fase 5, berkas ini mengumpulkan seluruh data teknis (soket, standar RAM, kecepatan penyimpanan, kebutuhan daya, antarmuka sejarah, dan kode bip AMI) yang ditandai `TODO-VERIFIKASI` agar diperiksa oleh pemilik proyek (Abid) sebelum rilis.

---

## 1. Tabel Kode Bunyi Bip BIOS AMI (`src/content/beep-ami.json`)

| Item | Nilai yang Ditulis | Sumber yang Disarankan | Status |
|---|---|---|---|
| `ami-normal-post` (POST normal) | `1 pendek` — POST berhasil normal tanpa kesalahan perangkat keras | AMI Aptio V / AMIBIOS8 *Checkpoints and Beep Codes Reference* (bagian *Standard Beep Codes*) | `TODO-VERIFIKASI` |
| `ami-ram-missing-or-faulty` (Kegagalan memori RAM / `KU-54`) | `3 pendek berulang` — Kegagalan memori utama (*Base 64K memory failure* / RAM tidak terdeteksi atau rusak) | AMIBIOS8 & Aptio V *Beep Code Table* (`3 short beeps = Base 64K memory failure`) & Modul Ajar Dasar TJKT SMK Fase E | `TODO-VERIFIKASI` |
| `ami-no-video-card` (Kegagalan kartu grafis / `KU-39`) | `1 panjang, 3 pendek` — Kartu grafis (VGA/GPU) tidak terdeteksi atau gagal diinisialisasi | Dokumentasi AMI Aptio (*1 long, 3 short beeps = Video card not detected*; catatan: AMIBIOS klasik memakai *8 short beeps*) | `TODO-VERIFIKASI` |
| `ami-cpu-failure` (Kegagalan prosesor / `KU-40`) | `5 pendek` — Kesalahan prosesor (*Processor error*) | AMIBIOS8 *Beep Code Table* (`5 short beeps = Processor Error`) | `TODO-VERIFIKASI` |

---

## 2. Spesifikasi Komponen & Kebutuhan Daya (`src/content/components.json`)

| Item | Nilai yang Ditulis | Sumber yang Disarankan | Status |
|---|---|---|---|
| `cpu-ryzen5-7600` (AMD Ryzen 5 7600) | Soket `AM5`, TDP `65 W`, `hasIntegratedGraphics: true` | Lembar spesifikasi resmi AMD Ryzen 5 7600 (*amd.com — Default TDP 65W, Socket AM5, Radeon Graphics*) | `TODO-VERIFIKASI` |
| `cpu-i5-13400f` (Intel Core i5-13400F) | Soket `LGA1700`, TDP/MTP `148 W`, `hasIntegratedGraphics: false` | Lembar spesifikasi resmi Intel ARK Core i5-13400F (*ark.intel.com — Processor Base Power 65W, Maximum Turbo Power 148W, Discrete Graphics Required*) | `TODO-VERIFIKASI` |
| `cpu-i9-13900k` (Intel Core i9-13900K) | Soket `LGA1700`, TDP/MTP `250 W` (dibulatkan dari 253 W untuk uji beban `650 W` pada `KU-36`), `hasIntegratedGraphics: true` | Intel ARK Core i9-13900K (*ark.intel.com — Maximum Turbo Power 253W, Socket FCLGA1700*) | `TODO-VERIFIKASI` |
| `mb-b650-atx` (Motherboard B650 ATX) | Soket `AM5`, Slot `DDR5` (4 slot: `A1, A2, B1, B2`), pasangan dual-channel `A2+B2` / `A1+B1`, Maks `128 GB`, Form Factor `ATX`, konsumsi daya papan `50 W` | Manual Motherboard AMD B650 ATX standar (MSI / ASUS / Gigabyte B650 ATX Manual — bagian *Memory Population & Specifications*) | `TODO-VERIFIKASI` |
| `mb-b760-atx-ddr5` (Motherboard B760 ATX DDR5) | Soket `LGA1700`, Slot `DDR5` (4 slot), Maks `128 GB`, Form Factor `ATX`, konsumsi daya papan `50 W` | Manual Motherboard Intel B760 ATX DDR5 standar | `TODO-VERIFIKASI` |
| `mb-b760-itx-ddr4` (Motherboard B760 Mini-ITX DDR4) | Soket `LGA1700`, Slot `DDR4` (2 slot: `A1, B1`), Maks `64 GB`, Form Factor `Mini-ITX`, konsumsi daya papan `40 W` | Manual Motherboard Intel B760I Mini-ITX DDR4 standar | `TODO-VERIFIKASI` |
| `gpu-rtx-4060` (GeForce RTX 4060 8 GB) | `requiresPciePower: true`, TGP `115 W` | Spesifikasi resmi NVIDIA GeForce RTX 4060 (*nvidia.com — Total Graphics Power 115W, 1x PCIe 8-pin*) | `TODO-VERIFIKASI` |
| `gpu-high-power-320w` (GPU Kelas Atas 320 W) | `requiresPciePower: true`, TGP `320 W` (komponen uji untuk menghasilkan total beban `650 W` pada `KU-36` dan `KU-37`) | Spesifikasi referensi kartu grafis kelas RTX 4080 (`320W TGP`) | `TODO-VERIFIKASI` |
| `ram-ddr4-16gb` & `ram-ddr5-16gb` | Konsumsi daya modul `5 W` (`8 W` untuk `64 GB`) | Estimasi daya modul JEDEC DDR4 (`1.2V`) & DDR5 (`1.1V`) | `TODO-VERIFIKASI` |

---

## 3. Data Teknis pada Materi Pelajaran, Katalog, & Kuis (`src/i18n/id.json` & `src/content/quiz.json`)

| Item | Nilai yang Ditulis | Sumber yang Disarankan | Status |
|---|---|---|---|
| Soket AMD AM5 vs Intel LGA1700 (`lessons.motherboard.specSocket`) | AM5 = `1718 pin LGA`; LGA1700 = `1700 pin LGA` | Dokumentasi spesifikasi mekanis soket AMD AM5 (LGA1718) & Intel LGA1700 | `TODO-VERIFIKASI` |
| Dimensi Form Factor Motherboard (`lessons.motherboard.specFormFactor` & `quiz-mb-1`) | ATX = `305 x 244 mm`; Micro-ATX = `244 x 244 mm`; Mini-ITX = `170 x 170 mm` | Spesifikasi ATX Version 2.2 / VIA Mini-ITX Form Factor Reference | `TODO-VERIFIKASI` |
| Standar Memori DDR4 vs DDR5 (`lessons.ram.specDdr4VsDdr5` & `quiz-ram-1`) | DDR4 = `288 pin, 1,2 V`; DDR5 = `288 pin, 1,1 V` dengan posisi celah *notch* berbeda | Standar JEDEC JESD79-4 (DDR4) & JESD79-5 (DDR5) DIMM Mechanical Specification | `TODO-VERIFIKASI` |
| Kecepatan SATA III vs NVMe M.2 (`lessons.storage.specSataVsNvme`) | SATA III = sekitar `600 MB/s` (`6 Gbps`); NVMe M.2 PCIe = `3.500 hingga 7.000+ MB/s` (PCIe 3.0/4.0 x4) | Spesifikasi Serial ATA Revision 3.0 & NVM Express Base Specification | `TODO-VERIFIKASI` |
| Spesifikasi Antarmuka Usang (`catalog.legacy.*`) | IDE/PATA = kabel pita `40-pin`; VGA D-Sub = analog `15-pin`; PS/2 = Mini-DIN `6-pin` (ungu keyboard, hijau mouse); Floppy 3,5" = `1,44 MB` kabel `34-pin`; LPT1 = paralel `DB-25` | Buku Teks Dasar-Dasar Teknik Jaringan Komputer dan Telekomunikasi (TJKT) Kelas X SMK Kemendikbudristek | `TODO-VERIFIKASI` |
