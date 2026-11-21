import { describe, expect, it } from 'vitest';
import {
  CAMERA_LIMITS,
  applyKeyboardCameraStep,
  clampCameraState,
  createInitialCameraState,
  detectWebGL2Support,
  evaluateFpsQualitySuggestion,
  getQualityPresetConfig,
  shouldIgnoreStageKeyEvent,
} from '../../src/three/stageController';

describe('Kategori B — Lapisan 3D, Kontrol Kamera, Kualitas, dan Aksesibilitas (KU-13 s.d. KU-21)', () => {
  it('[KU-13] deteksi WebGL2 mengembalikan false dan mengaktifkan cadangan 2D bila WebGL2 tidak tersedia', () => {
    const noWebGlEnv = {
      forceNoWebGL2: true,
      createCanvas: () => ({
        getContext: () => null,
      }),
    };
    expect(detectWebGL2Support(noWebGlEnv)).toBe(false);

    const validWebGl2Env = {
      forceNoWebGL2: false,
      createCanvas: () => ({
        getContext: (type: string) => (type === 'webgl2' ? { version: 2 } : null),
      }),
    };
    expect(detectWebGL2Support(validWebGl2Env)).toBe(true);
  });

  it('[KU-15] zoom kamera dibatasi min/max dan target kamera tidak pernah menembus model komponen', () => {
    const initial = createInitialCameraState();

    // Scroll zoom terlalu dekat (coba menembus model di distance = 0.2 dan y negatif)
    const clampedClose = clampCameraState({
      ...initial,
      distance: 0.2,
      polarAngle: 3.1,
      panX: 99,
      panZ: -99,
    });

    expect(clampedClose.distance).toBe(CAMERA_LIMITS.minDistance);
    expect(clampedClose.polarAngle).toBeLessThanOrEqual(CAMERA_LIMITS.maxPolarAngle);
    expect(clampedClose.panX).toBe(CAMERA_LIMITS.maxPanOffset);
    expect(clampedClose.panZ).toBe(-CAMERA_LIMITS.maxPanOffset);

    // Scroll zoom terlalu jauh
    const clampedFar = clampCameraState({
      ...initial,
      distance: 50,
      polarAngle: 0,
    });
    expect(clampedFar.distance).toBe(CAMERA_LIMITS.maxDistance);
    expect(clampedFar.polarAngle).toBeGreaterThanOrEqual(CAMERA_LIMITS.minPolarAngle);
  });

  it('[KU-16] pintasan keyboard (WASD/QE) diabaikan saat fokus berada di input, textarea, atau select', () => {
    expect(shouldIgnoreStageKeyEvent({ tagName: 'INPUT', isContentEditable: false })).toBe(true);
    expect(shouldIgnoreStageKeyEvent({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(true);
    expect(shouldIgnoreStageKeyEvent({ tagName: 'SELECT', isContentEditable: false })).toBe(true);
    expect(shouldIgnoreStageKeyEvent({ tagName: 'DIV', isContentEditable: true })).toBe(true);

    // Fokus di luar input (mis. tombol atau body): pintasan aktif
    expect(shouldIgnoreStageKeyEvent({ tagName: 'BUTTON', isContentEditable: false })).toBe(false);
    expect(shouldIgnoreStageKeyEvent({ tagName: 'BODY', isContentEditable: false })).toBe(false);

    const before = createInitialCameraState();
    const afterW = applyKeyboardCameraStep(before, 'w');
    expect(afterW.panZ).toBeLessThan(before.panZ);

    const afterQ = applyKeyboardCameraStep(before, 'q');
    expect(afterQ.azimuthAngle).not.toBe(before.azimuthAngle);
  });

  it('[KU-17] opsi kualitas Rendah/Sedang/Tinggi memiliki konfigurasi berbeda dan FPS rendah menyarankan turun kualitas', () => {
    const low = getQualityPresetConfig('low');
    const medium = getQualityPresetConfig('medium');
    const high = getQualityPresetConfig('high');

    expect(low.dpr).toBeLessThan(medium.dpr);
    expect(low.shadows).toBe(false);
    expect(high.shadows).toBe(true);
    expect(low.geometrySegments).toBeLessThan(high.geometrySegments);

    // Jika FPS rata-rata rendah (< 28 FPS) pada kualitas Tinggi atau Sedang -> sarankan turun ke Rendah
    const suggestionFromHigh = evaluateFpsQualitySuggestion([20, 22, 19, 24], 'high');
    expect(suggestionFromHigh.shouldSuggestDowngrade).toBe(true);
    expect(suggestionFromHigh.recommendedQuality).toBe('low');

    // Jika sudah di kualitas Rendah -> tidak perlu menyarankan turun lagi
    const suggestionAtLow = evaluateFpsQualitySuggestion([18, 20, 21], 'low');
    expect(suggestionAtLow.shouldSuggestDowngrade).toBe(false);

    // Jika FPS lancar (60 FPS) -> tidak ada saran turun kualitas
    const smoothFps = evaluateFpsQualitySuggestion([58, 60, 59, 60], 'high');
    expect(smoothFps.shouldSuggestDowngrade).toBe(false);
  });
});
