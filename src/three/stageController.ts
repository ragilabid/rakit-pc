export type QualityLevel = 'low' | 'medium' | 'high';

export interface CameraOrbitState {
  distance: number;
  azimuthAngle: number;
  polarAngle: number;
  panX: number;
  panZ: number;
}

export const CAMERA_LIMITS = {
  minDistance: 2.2,
  maxDistance: 9.0,
  minPolarAngle: 0.25,
  maxPolarAngle: 1.48,
  maxPanOffset: 2.5,
  defaultDistance: 4.5,
  defaultAzimuthAngle: 0.45,
  defaultPolarAngle: 0.85,
} as const;

export interface QualityPresetConfig {
  level: QualityLevel;
  dpr: number;
  shadows: boolean;
  antialias: boolean;
  geometrySegments: number;
}

export interface FpsSuggestionResult {
  averageFps: number;
  shouldSuggestDowngrade: boolean;
  recommendedQuality: QualityLevel;
}

export interface WebGL2DetectEnv {
  forceNoWebGL2?: boolean;
  createCanvas?: () => {
    getContext: (contextId: string) => unknown;
  };
}

declare global {
  interface Window {
    __FORCE_NO_WEBGL2__?: boolean;
  }
}

export function createInitialCameraState(): CameraOrbitState {
  return {
    distance: CAMERA_LIMITS.defaultDistance,
    azimuthAngle: CAMERA_LIMITS.defaultAzimuthAngle,
    polarAngle: CAMERA_LIMITS.defaultPolarAngle,
    panX: 0,
    panZ: 0,
  };
}

function clampNumber(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Membatasi jarak zoom, sudut polar (agar tidak menembus meja/model), serta batas geser pan (KU-15).
 */
export function clampCameraState(state: CameraOrbitState): CameraOrbitState {
  return {
    distance: Number(
      clampNumber(state.distance, CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance).toFixed(2),
    ),
    azimuthAngle: Number(state.azimuthAngle.toFixed(3)),
    polarAngle: Number(
      clampNumber(
        state.polarAngle,
        CAMERA_LIMITS.minPolarAngle,
        CAMERA_LIMITS.maxPolarAngle,
      ).toFixed(3),
    ),
    panX: Number(
      clampNumber(state.panX, -CAMERA_LIMITS.maxPanOffset, CAMERA_LIMITS.maxPanOffset).toFixed(2),
    ),
    panZ: Number(
      clampNumber(state.panZ, -CAMERA_LIMITS.maxPanOffset, CAMERA_LIMITS.maxPanOffset).toFixed(2),
    ),
  };
}

export function shouldIgnoreStageKeyEvent(
  target: {
    tagName?: string;
    isContentEditable?: boolean;
  } | null,
): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = (target.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function applyKeyboardCameraStep(state: CameraOrbitState, rawKey: string): CameraOrbitState {
  const key = rawKey.toLowerCase();
  const panStep = 0.35;
  const rotateStep = 0.22;
  const zoomStep = 0.5;

  switch (key) {
    case 'w':
      return clampCameraState({ ...state, panZ: state.panZ - panStep });
    case 's':
      return clampCameraState({ ...state, panZ: state.panZ + panStep });
    case 'a':
      return clampCameraState({ ...state, panX: state.panX - panStep });
    case 'd':
      return clampCameraState({ ...state, panX: state.panX + panStep });
    case 'q':
      return clampCameraState({ ...state, azimuthAngle: state.azimuthAngle - rotateStep });
    case 'e':
      return clampCameraState({ ...state, azimuthAngle: state.azimuthAngle + rotateStep });
    case '+':
    case '=':
      return clampCameraState({ ...state, distance: state.distance - zoomStep });
    case '-':
    case '_':
      return clampCameraState({ ...state, distance: state.distance + zoomStep });
    default:
      return state;
  }
}

export function applyWheelZoomStep(state: CameraOrbitState, deltaY: number): CameraOrbitState {
  const step = deltaY > 0 ? 0.55 : -0.55;
  return clampCameraState({
    ...state,
    distance: state.distance + step,
  });
}

export function detectWebGL2Support(env?: WebGL2DetectEnv): boolean {
  try {
    if (env?.forceNoWebGL2) return false;
    if (typeof window !== 'undefined' && window.__FORCE_NO_WEBGL2__) {
      return false;
    }

    if (env?.createCanvas) {
      const ctx = env.createCanvas().getContext('webgl2');
      return Boolean(ctx);
    }

    if (typeof document === 'undefined') {
      return false;
    }

    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    return Boolean(gl2);
  } catch {
    return false;
  }
}

export function getQualityPresetConfig(level: QualityLevel): QualityPresetConfig {
  switch (level) {
    case 'low':
      return {
        level: 'low',
        dpr: 1,
        shadows: false,
        antialias: false,
        geometrySegments: 8,
      };
    case 'medium':
      return {
        level: 'medium',
        dpr: 1.25,
        shadows: false,
        antialias: true,
        geometrySegments: 16,
      };
    case 'high':
      return {
        level: 'high',
        dpr: 2,
        shadows: true,
        antialias: true,
        geometrySegments: 32,
      };
  }
}

export function evaluateFpsQualitySuggestion(
  fpsSamples: readonly number[],
  currentQuality: QualityLevel,
): FpsSuggestionResult {
  if (fpsSamples.length === 0) {
    return {
      averageFps: 60,
      shouldSuggestDowngrade: false,
      recommendedQuality: currentQuality,
    };
  }

  const sum = fpsSamples.reduce((acc, v) => acc + v, 0);
  const averageFps = Math.round(sum / fpsSamples.length);

  if (averageFps < 28 && currentQuality !== 'low') {
    return {
      averageFps,
      shouldSuggestDowngrade: true,
      recommendedQuality: 'low',
    };
  }

  return {
    averageFps,
    shouldSuggestDowngrade: false,
    recommendedQuality: currentQuality,
  };
}
