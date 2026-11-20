# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.

## [v0.0-fase0] - 2026-11-19

### Ditambahkan

- Scaffold Vite + React + TypeScript (strict mode).
- Konfigurasi ESLint, Prettier, Vitest, dan Playwright.
- Struktur folder sesuai arsitektur di `SPEC.md` Bagian 4.
- Konfigurasi Docker multi-stage (`Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`) non-root dengan `HEALTHCHECK`.
- Konfigurasi dasar `vercel.json`, `.nvmrc`, `README.md`, `CHANGELOG.md`, dan `CREDITS.md`.
- Workflow CI GitHub Actions untuk `lint`, `test`, dan `build`.
- Halaman awal placeholder polos dengan pesan `<noscript>`.
