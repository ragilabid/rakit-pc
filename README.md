# Rakit PC

Platform belajar perangkat komputer dan simulasi perakitan PC interaktif untuk siswa Fase E SMK (TJKT, DPIB, KKA).

Spesifikasi lengkap proyek ada di [SPEC.md](./SPEC.md).

## Prasyarat

- Node.js sesuai versi di `.nvmrc` (Node 24)
- npm
- Docker (opsional, untuk build dan menjalankan kontainer lokal)

## Perintah Pengembangan

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Menjalankan dengan Docker

```bash
docker build -t rakit-pc .
docker run --rm -p 8080:80 rakit-pc
```

Atau dengan Docker Compose:

```bash
docker compose up --build
```

Aplikasi akan tersedia di `http://localhost:8080`.
