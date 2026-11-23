# Pemetaan Lengkap Kasus Uji (`KU-01` s.d. `KU-63`)

Dokumen ini memetakan seluruh **57 kasus uji asli** dari `docs/kasus_uji_platform_perangkat_komputer.xlsx` (`KU-01` s.d. `KU-57`) ditambah **6 kasus uji Kategori F** (`KU-58` s.d. `KU-63`) yang disetujui pada Fase 5 ke berkas pengujian otomatis (Vitest & Playwright) serta panduan uji manual rilis.

---

## Kategori A — Navigasi, Pelajaran, dan Progres (`KU-01` s.d. `KU-12`)

| No | Kasus Uji | Tes Unit (Vitest) | Tes E2E (Playwright) | Status |
|---|---|---|---|---|
| `KU-01` | Buka tautan langsung ke pelajaran valid (`#ram`) | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts`, `tests/e2e/smoke.spec.ts` | ✅ Otomatis |
| `KU-02` | Tautan langsung ke pelajaran tidak ada (`#abcxyz`) jatuh ke beranda | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts`, `tests/e2e/smoke.spec.ts` | ✅ Otomatis |
| `KU-03` | Tautan langsung dengan huruf besar/kecil berbeda (`#RAM` vs `#ram`) | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-04` | Selesaikan pelajaran menaikkan penghitung (`1/N`) dan tersimpan | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts`, `tests/e2e/smoke.spec.ts` | ✅ Otomatis |
| `KU-05` | Selesaikan pelajaran yang sama dua kali tidak menambah dua kali (idempoten) | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-06` | Muat ulang halaman di tengah pelajaran memulihkan progres & posisi | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-07` | Buka di perangkat/browser lain: progres lokal tidak ikut (tanpa akun) | `tests/unit/domain-kategori-a-c.test.ts` | `docs/uji-manual-rilis.md` (`UM-10`) | ✅ Otomatis + Manual |
| `KU-08` | Pelajaran dikunci sampai prasyarat selesai (`#rakit-pc` sebelum `#motherboard` dkk) | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-09` | Hapus progres di Pengaturan meminta konfirmasi lalu kembali ke `0/N` | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-10` | JavaScript dimatikan menampilkan pesan `<noscript>` "aktifkan JavaScript" | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/smoke.spec.ts` | ✅ Otomatis |
| `KU-11` | `localStorage` penuh atau diblokir (mode privat): aplikasi tetap jalan + pemberitahuan | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-12` | Tombol Back/Forward browser berfungsi antar pelajaran | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |

---

## Kategori B — Tampilan 3D dan Kontrol (`KU-13` s.d. `KU-21`)

| No | Kasus Uji | Tes Unit (Vitest) | Tes E2E (Playwright) / Uji Manual | Status |
|---|---|---|---|---|
| `KU-13` | Perangkat tanpa WebGL2 menampilkan pesan jelas & mode cadangan 2D | `tests/unit/three-kategori-b.test.ts` | `tests/e2e/kategori-b.spec.ts` + `UM-01` | ✅ Otomatis + Manual |
| `KU-14` | Layar sentuh HP/tablet: geser/cubit/rotasi tanpa menggulung halaman | — | `tests/e2e/kategori-b.spec.ts` + `UM-05` | ✅ Otomatis + Manual |
| `KU-15` | Zoom sampai batas min/max (`2,2–9,0 m`), kamera tidak menembus model | `tests/unit/three-kategori-b.test.ts` | `tests/e2e/kategori-b.spec.ts` + `UM-02` | ✅ Otomatis + Manual |
| `KU-16` | Pintasan keyboard (`w`) saat mengetik di kolom input tidak memicu pan kamera | `tests/unit/three-kategori-b.test.ts` | `tests/e2e/kategori-b.spec.ts` + `UM-02` | ✅ Otomatis + Manual |
| `KU-17` | Perangkat spek rendah: opsi kualitas Rendah/Sedang/Tinggi + saran FPS rendah | `tests/unit/three-kategori-b.test.ts` | `tests/e2e/kategori-b.spec.ts` + `UM-01` | ✅ Otomatis + Manual |
| `KU-18` | Ukuran layar sangat kecil (`±320 px`): tata letak tetap utuh tanpa terpotong | — | `tests/e2e/kategori-a-c.spec.ts`, `tests/e2e/kategori-b.spec.ts`, `tests/e2e/fase-4-perakitan.spec.ts` + `UM-06` | ✅ Otomatis + Manual |
| `KU-19` | Tab browser di latar belakang lalu kembali: jeda render & lanjut tanpa crash | — | `tests/e2e/kategori-b.spec.ts` + `UM-03` | ✅ Otomatis + Manual |
| `KU-20` | Koneksi lambat saat memuat model 3D: indikator muat tampil, UI tidak macet | — | `tests/e2e/kategori-b.spec.ts` + `UM-07`, `UM-08` | ✅ Otomatis + Manual |
| `KU-21` | Aksesibilitas: navigasi hanya dengan keyboard / pembaca layar & teks alternatif | — | `tests/e2e/kategori-b.spec.ts` + `UM-04` | ✅ Otomatis + Manual |

---

## Kategori C — Konten Pelajaran dan Perangkat (`KU-22` s.d. `KU-29`)

| No | Kasus Uji | Tes Unit (Vitest) | Tes E2E (Playwright) | Status |
|---|---|---|---|---|
| `KU-22` | Tab Spesifikasi perangkat memuat data sesuai (DDR4 vs DDR5, soket CPU) | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-23` | Klik komponen di panggung memunculkan label, nama, dan penjelasan fungsi | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-24` | Perangkat dengan standar ganda (SATA vs NVMe M.2) dijelaskan & dibedakan | `tests/unit/domain-kategori-a-c.test.ts` | — | ✅ Otomatis |
| `KU-25` | Istilah teknis ambigu (HDD vs SSD vs SSHD) dijelaskan sesuai level Fase E | `tests/unit/domain-kategori-a-c.test.ts` | — | ✅ Otomatis |
| `KU-26` | Perangkat usang (IDE, VGA, PS/2) dimasukkan sebagai materi sejarah | `tests/unit/domain-kategori-a-c.test.ts` | — | ✅ Otomatis |
| `KU-27` | Perangkat peripheral eksternal (keyboard, mouse, monitor, printer) dicakup | `tests/unit/domain-kategori-a-c.test.ts` | — | ✅ Otomatis |
| `KU-28` | Mengganti bahasa mengubah semua teks pada UI dan panggung 3D | `tests/unit/domain-kategori-a-c.test.ts` | `tests/e2e/kategori-a-c.spec.ts` | ✅ Otomatis |
| `KU-29` | Bahasa tidak didukung jatuh ke bahasa default (Indonesia) | `tests/unit/domain-kategori-a-c.test.ts` | — | ✅ Otomatis |

---

## Kategori D — Simulasi Perakitan (`KU-30` s.d. `KU-52`)

| No | Kasus Uji | Tes Unit (Vitest) | Tes E2E (Playwright) | Status |
|---|---|---|---|---|
| `KU-30` | Rakitan benar sesuai urutan dinyatakan berhasil & simulasi POST sukses | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-31` | Soket CPU tidak cocok (AM5 ke LGA1700) ditolak fisik dengan alasan jelas | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-32` | Tipe RAM tidak cocok (DDR4 ke slot DDR5) ditolak fisik (notch berbeda) | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-33` | Orientasi CPU salah (segitiga penanda tidak sejajar) ditolak fisik | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-34` | RAM dipasang terbalik (notch tidak searah) ditolak fisik + petunjuk | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-35` | Form factor tidak muat (ATX ke Mini-ITX) ditolak fisik dengan alasan ukuran | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-36` | Daya PSU kurang (kebutuhan 650 W, PSU 450 W) gagal menyala saat POST | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-37` | Daya PSU sangat tipis di atas kebutuhan memberi peringatan "tanpa cadangan" | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-38` | Konektor daya tidak terpasang (24-pin atau CPU 8-pin lupa) gagal menyala | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-39` | Kabel daya GPU PCIe tidak terpasang menyebabkan gagal tampil + petunjuk | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-40` | Tanpa CPU atau tanpa RAM gagal POST sesuai bagian yang hilang | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-41` | Tanpa pendingin CPU memicu peringatan suhu kritis & mati otomatis | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-42` | Pasta termal terlupa memicu peringatan suhu tinggi | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-43` | Kabel front panel salah (pin Power SW tertukar) membuat tombol power mati | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-44` | Penyimpanan tanpa OS menampilkan pesan "no bootable device" | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-45` | Lubang standoff tidak sesuai memicu peringatan/kegagalan korsleting | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-46` | Urutan pemasangan dipaksa mengikuti urutan (motherboard ke casing sebelum CPU/RAM ditolak) | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-47` | Komponen dilepas lalu dipasang ulang konsisten tanpa komponen ganda | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-48` | Memasang dua komponen di satu slot (dua RAM di slot sama) ditolak | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-49` | Konfigurasi dual-channel di slot tidak berpasangan jalan dengan catatan performa | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-50` | Total RAM melebihi batas motherboard (4 x 64 GB di board max 128 GB) memberi peringatan | `tests/unit/domain-kategori-d.test.ts` | — | ✅ Otomatis |
| `KU-51` | Cek keselamatan (ESD, K3) hanya berupa pengingat dan tidak memblokir | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-52` | Penilaian siswa menghitung skor dari hasil + waktu + jumlah percobaan | `tests/unit/domain-kategori-d.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |

---

## Kategori E — Pemecahan Masalah dan Kode Bunyi (`KU-53` s.d. `KU-57`)

| No | Kasus Uji | Tes Unit (Vitest) | Tes E2E (Playwright) | Status |
|---|---|---|---|---|
| `KU-53` | Satu bunyi bip pendek pada simulasi POST normal dinyatakan boot normal | `tests/unit/domain-kategori-e.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-54` | Bunyi bip berulang saat RAM tidak terdeteksi mengarahkan diagnosis ke RAM (AMI) | `tests/unit/domain-kategori-e.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-55` | Tidak ada tampilan karena kabel monitor ke port motherboard memberi petunjuk colok ke GPU | `tests/unit/domain-kategori-e.test.ts` | — | ✅ Otomatis |
| `KU-56` | Jawaban diagnosis salah memberi umpan balik yang menjelaskan mengapa keliru + petunjuk | `tests/unit/domain-kategori-e.test.ts` | `tests/e2e/fase-4-perakitan.spec.ts` | ✅ Otomatis |
| `KU-57` | Beberapa penyebab sekaligus (RAM rusak & kabel daya lepas) dilaporkan satu per satu | `tests/unit/domain-kategori-e.test.ts` | — | ✅ Otomatis |

---

## Kategori F — Kuis, Latihan, dan Penyimpanan Hasil (`KU-58` s.d. `KU-63`)

| No | Kasus Uji | Tes Unit (Vitest) | Tes E2E (Playwright) | Status |
|---|---|---|---|---|
| `KU-58` | Kuis menampilkan soal & jawaban benar/salah memberi umpan balik penjelas | `tests/unit/domain-kategori-f.test.ts` | `tests/e2e/kategori-f.spec.ts` | ✅ Otomatis |
| `KU-59` | Skor akhir menghitung hasil + waktu + percobaan secara akurat | `tests/unit/domain-kategori-f.test.ts` | `tests/e2e/kategori-f.spec.ts` | ✅ Otomatis |
| `KU-60` | Layar hasil tampil jelas untuk dilihat guru secara tatap muka | — | `tests/e2e/kategori-f.spec.ts`, `tests/e2e/fase-4-perakitan.spec.ts` + `UM-09` | ✅ Otomatis + Manual |
| `KU-61` | Hasil tersimpan lokal dan muncul kembali setelah muat ulang halaman | `tests/unit/domain-kategori-f.test.ts` | `tests/e2e/kategori-f.spec.ts` | ✅ Otomatis |
| `KU-62` | Reset progres juga menghapus seluruh hasil tersimpan setelah konfirmasi | `tests/unit/domain-kategori-f.test.ts` | `tests/e2e/kategori-f.spec.ts` | ✅ Otomatis |
| `KU-63` | Tidak ada permintaan jaringan yang mengirim data siswa | — | `tests/e2e/kategori-f.spec.ts` + `UM-10` | ✅ Otomatis + Manual |
