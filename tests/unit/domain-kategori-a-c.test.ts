import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import lessonsData from '../../src/content/lessons.json';
import {
  idTranslations,
  enTranslations,
  normalizeLanguage,
  setAppLanguage,
  getAppLanguage,
  t,
} from '../../src/i18n';
import { resolveHashRoute } from '../../src/router';
import {
  createProgressStoreInstance,
  isLessonUnlocked,
  getMissingPrerequisites,
  PROGRESS_STORAGE_KEY,
  PROGRESS_SCHEMA_VERSION,
} from '../../src/store/useProgressStore';

const lessonSlugs = lessonsData.lessons.map((l) => l.slug);

describe('Kategori A — Navigasi, Pelajaran, dan Progres (KU-01 s.d. KU-12)', () => {
  it('[KU-01] tautan langsung ke pelajaran valid (#ram) membuka pelajaran RAM', () => {
    const route = resolveHashRoute('#ram', lessonSlugs);
    expect(route.page).toBe('lesson');
    expect(route.lessonSlug).toBe('ram');
    expect(route.redirectedFromUnknown).toBe(false);
  });

  it('[KU-02] tautan langsung ke pelajaran tidak ada (#abcxyz) jatuh ke beranda tanpa error', () => {
    const route = resolveHashRoute('#abcxyz', lessonSlugs);
    expect(route.page).toBe('home');
    expect(route.lessonSlug).toBeNull();
    expect(route.redirectedFromUnknown).toBe(true);
  });

  it('[KU-03] tautan langsung dengan huruf besar/kecil berbeda (#RAM vs #ram) membuka pelajaran yang sama', () => {
    const upper = resolveHashRoute('#RAM', lessonSlugs);
    const lower = resolveHashRoute('#ram', lessonSlugs);
    const mixed = resolveHashRoute('#RaM', lessonSlugs);

    expect(upper.page).toBe('lesson');
    expect(upper.lessonSlug).toBe('ram');
    expect(upper.lessonSlug).toBe(lower.lessonSlug);
    expect(mixed.lessonSlug).toBe(lower.lessonSlug);
  });

  it('[KU-04] menyelesaikan pelajaran menaikkan penghitung progres (1/N) dan menyimpannya', () => {
    const memoryBacking = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => memoryBacking.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryBacking.set(key, value);
      },
      removeItem: (key: string) => {
        memoryBacking.delete(key);
      },
    };

    const store = createProgressStoreInstance(mockStorage);
    expect(store.getState().completedLessonIds).toHaveLength(0);

    store.getState().completeLesson('motherboard');
    expect(store.getState().completedLessonIds).toEqual(['motherboard']);
    expect(store.getState().storageAvailable).toBe(true);

    const rawSaved = memoryBacking.get(PROGRESS_STORAGE_KEY);
    expect(rawSaved).toBeDefined();
    expect(rawSaved).toContain('"motherboard"');
    expect(rawSaved).toContain(`"version":${PROGRESS_SCHEMA_VERSION}`);
  });

  it('[KU-05] menyelesaikan pelajaran yang sama dua kali bersifat idempoten (tidak bertambah dua kali)', () => {
    const store = createProgressStoreInstance();
    store.getState().completeLesson('ram');
    store.getState().completeLesson('ram');
    store.getState().completeLesson('RAM');

    expect(store.getState().completedLessonIds).toEqual(['ram']);
    expect(store.getState().completedLessonIds).toHaveLength(1);
  });

  it('[KU-06] muat ulang halaman di tengah pelajaran memulihkan progres dan posisi pelajaran terakhir', () => {
    const memoryBacking = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => memoryBacking.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryBacking.set(key, value);
      },
      removeItem: (key: string) => {
        memoryBacking.delete(key);
      },
    };

    const firstSession = createProgressStoreInstance(mockStorage);
    firstSession.getState().completeLesson('motherboard');
    firstSession.getState().setCurrentLessonSlug('cpu');

    // Simulasikan muat ulang halaman dengan membuat instance store baru di atas storage yang sama
    const reloadedSession = createProgressStoreInstance(mockStorage);
    expect(reloadedSession.getState().completedLessonIds).toEqual(['motherboard']);
    expect(reloadedSession.getState().currentLessonSlug).toBe('cpu');
  });

  it('[KU-07] buka di perangkat atau browser lain: progres tidak ikut karena penyimpanan murni lokal tanpa akun', () => {
    const deviceAStorage = new Map<string, string>();
    const deviceBStorage = new Map<string, string>();

    const storeDeviceA = createProgressStoreInstance({
      getItem: (k) => deviceAStorage.get(k) ?? null,
      setItem: (k, v) => deviceAStorage.set(k, v),
      removeItem: (k) => deviceAStorage.delete(k),
    });

    const storeDeviceB = createProgressStoreInstance({
      getItem: (k) => deviceBStorage.get(k) ?? null,
      setItem: (k, v) => deviceBStorage.set(k, v),
      removeItem: (k) => deviceBStorage.delete(k),
    });

    storeDeviceA.getState().completeLesson('motherboard');
    expect(storeDeviceA.getState().completedLessonIds).toEqual(['motherboard']);
    expect(storeDeviceB.getState().completedLessonIds).toEqual([]);
  });

  it('[KU-08] pelajaran dikunci sampai seluruh prasyarat selesai (buka Rakit PC sebelum Motherboard dkk)', () => {
    const rakitLesson = lessonsData.lessons.find((l) => l.slug === 'rakit-pc')!;
    expect(isLessonUnlocked(rakitLesson, [])).toBe(false);
    expect(isLessonUnlocked(rakitLesson, ['motherboard', 'cpu'])).toBe(false);

    const missing = getMissingPrerequisites(rakitLesson, ['motherboard', 'cpu']);
    expect(missing).toEqual(['ram', 'storage', 'psu']);

    const allPrereqs = ['motherboard', 'cpu', 'ram', 'storage', 'psu'];
    expect(isLessonUnlocked(rakitLesson, allPrereqs)).toBe(true);
  });

  it('[KU-09] hapus progres hanya berjalan setelah konfirmasi dan mengembalikan progres ke 0/N', () => {
    const store = createProgressStoreInstance();
    store.getState().completeLesson('motherboard');
    store.getState().completeLesson('cpu');
    expect(store.getState().completedLessonIds).toHaveLength(2);

    // Tanpa konfirmasi: tidak terhapus
    store.getState().resetProgress(false);
    expect(store.getState().completedLessonIds).toHaveLength(2);

    // Setelah dikonfirmasi: kembali ke 0
    store.getState().resetProgress(true);
    expect(store.getState().completedLessonIds).toHaveLength(0);
    expect(store.getState().currentLessonSlug).toBeNull();
  });

  it('[KU-10] index.html memiliki elemen <noscript> dengan pesan jelas "aktifkan JavaScript"', () => {
    const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(indexHtml).toMatch(/<noscript>[\s\S]*aktifkan JavaScript[\s\S]*<\/noscript>/i);
  });

  it('[KU-11] localStorage penuh atau diblokir (mode privat): aplikasi tetap jalan dan memberi pemberitahuan', () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error('SecurityError: localStorage disabled');
      },
      setItem: () => {
        throw new Error('QuotaExceededError: storage full');
      },
      removeItem: () => {
        throw new Error('SecurityError: localStorage disabled');
      },
    };

    const store = createProgressStoreInstance(throwingStorage);
    expect(() => store.getState().completeLesson('motherboard')).not.toThrow();
    expect(store.getState().completedLessonIds).toEqual(['motherboard']);
    expect(store.getState().storageAvailable).toBe(false);
  });

  it('[KU-12] navigasi berurutan antar pelajaran mengembalikan rute yang konsisten untuk riwayat Back/Forward', () => {
    const first = resolveHashRoute('#motherboard', lessonSlugs);
    const second = resolveHashRoute('#ram', lessonSlugs);
    expect(first.canonicalHash).toBe('#motherboard');
    expect(second.canonicalHash).toBe('#ram');
  });
});

describe('Kategori C — Konten Pelajaran, Perangkat, dan i18n (KU-22 s.d. KU-29)', () => {
  it('[KU-22] tab Spesifikasi memuat data akurat slot DDR4 vs DDR5 dan soket CPU AM5 vs LGA1700', () => {
    setAppLanguage('id');
    const mbLesson = lessonsData.lessons.find((l) => l.slug === 'motherboard')!;
    const ramLesson = lessonsData.lessons.find((l) => l.slug === 'ram')!;

    const mbSpecsText = mbLesson.specs.map((s) => t(s.valueKey)).join(' ');
    const ramSpecsText = ramLesson.specs.map((s) => t(s.valueKey)).join(' ');

    expect(mbSpecsText).toContain('AM5');
    expect(mbSpecsText).toContain('LGA1700');
    expect(ramSpecsText).toContain('DDR4');
    expect(ramSpecsText).toContain('DDR5');
  });

  it('[KU-23] setiap komponen panggung memiliki label, nama lengkap, dan penjelasan fungsi', () => {
    setAppLanguage('id');
    for (const lesson of lessonsData.lessons) {
      expect(lesson.stageParts.length).toBeGreaterThan(0);
      for (const part of lesson.stageParts) {
        expect(t(part.labelKey).length).toBeGreaterThan(2);
        expect(t(part.nameKey).length).toBeGreaterThan(5);
        expect(t(part.functionKey).length).toBeGreaterThan(15);
      }
    }
  });

  it('[KU-24] perangkat dengan standar ganda (SATA vs NVMe M.2) keduanya dijelaskan dan dibedakan', () => {
    setAppLanguage('id');
    const storageSpec = t('lessons.storage.specSataVsNvme');
    expect(storageSpec).toContain('SATA');
    expect(storageSpec).toContain('NVMe M.2');
    expect(storageSpec).toContain('PCIe');
  });

  it('[KU-25] istilah teknis ambigu (HDD vs SSD vs SSHD) dijelaskan sesuai level siswa Fase E', () => {
    setAppLanguage('id');
    const explanation = t('lessons.storage.overview2') + ' ' + t('lessons.storage.specHddSsdSshd');
    expect(explanation).toContain('HDD');
    expect(explanation).toContain('SSD');
    expect(explanation).toContain('SSHD');
    expect(explanation.toLowerCase()).toContain('piringan');
    expect(explanation.toLowerCase()).toContain('flash');
  });

  it('[KU-26] perangkat usang (IDE, VGA, PS/2) dimasukkan sebagai materi sejarah', () => {
    setAppLanguage('id');
    const legacyNames = lessonsData.deviceCatalog.legacyHistory
      .map((item) => t(item.nameKey) + ' ' + t(item.descriptionKey))
      .join(' ');
    expect(legacyNames).toContain('IDE');
    expect(legacyNames).toContain('VGA');
    expect(legacyNames).toContain('PS/2');
  });

  it('[KU-27] perangkat peripheral eksternal (keyboard, mouse, monitor, printer) dicakup di platform', () => {
    setAppLanguage('id');
    const externalNames = lessonsData.deviceCatalog.externalPeripherals
      .map((item) => t(item.nameKey).toLowerCase())
      .join(' ');
    expect(externalNames).toContain('keyboard');
    expect(externalNames).toContain('mouse');
    expect(externalNames).toContain('monitor');
    expect(externalNames).toContain('printer');
  });

  it('[KU-28] mengganti bahasa mengubah seluruh teks UI dan label panggung tanpa kunci yang tertinggal', () => {
    setAppLanguage('id');
    const idTitle = t('lessons.ram.title');
    const idPart = t('stageParts.ramNotch.label');

    setAppLanguage('en');
    const enTitle = t('lessons.ram.title');
    const enPart = t('stageParts.ramNotch.label');

    expect(idTitle).not.toBe(enTitle);
    expect(idPart).not.toBe(enPart);
    expect(Object.keys(idTranslations)).toEqual(Object.keys(enTranslations));

    setAppLanguage('id');
  });

  it('[KU-29] memilih bahasa yang belum didukung jatuh ke bahasa default (Indonesia)', () => {
    expect(normalizeLanguage('fr')).toBe('id');
    expect(normalizeLanguage('ja-JP')).toBe('id');
    expect(normalizeLanguage('')).toBe('id');

    const resolved = setAppLanguage('de');
    expect(resolved).toBe('id');
    expect(getAppLanguage()).toBe('id');
    expect(t('nav.home')).toBe('Beranda');
  });
});
