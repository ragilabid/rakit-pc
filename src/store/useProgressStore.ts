import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { QuizAnswerRecord } from '../domain/quiz';
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  setAppLanguage,
  type SupportedLanguage,
} from '../i18n';

export const PROGRESS_STORAGE_KEY = 'rakit-pc-progress-v1';
export const PROGRESS_SCHEMA_VERSION = 1;

export interface LessonPrerequisiteInfo {
  id: string;
  slug: string;
  prerequisites: string[];
}

export interface SavedSimulationResult {
  isPostSuccess: boolean;
  postStatus: string;
  beepPattern: string | null;
  totalScore: number;
  resultScore: number;
  timeScore: number;
  attemptScore: number;
  warningPenalty: number;
  elapsedSeconds: number;
  attempts: number;
  feedbackItems: string[];
}

export interface ProgressState {
  schemaVersion: number;
  completedLessonIds: string[];
  currentLessonSlug: string | null;
  language: SupportedLanguage;
  qualityMode: 'low' | 'medium' | 'high';
  fallback2d: boolean;
  storageAvailable: boolean;
  lastSimulationResult: SavedSimulationResult | null;
  quizAnswers: Record<string, QuizAnswerRecord>;
  completeLesson: (lessonId: string) => void;
  setCurrentLessonSlug: (slug: string | null) => void;
  setLanguage: (lang: string) => void;
  setQualityMode: (mode: 'low' | 'medium' | 'high') => void;
  setFallback2d: (enabled: boolean) => void;
  setLastSimulationResult: (result: SavedSimulationResult | null) => void;
  recordQuizAnswer: (questionId: string, selectedOptionId: string, correct: boolean) => void;
  resetProgress: (confirmed: boolean) => void;
}

export interface StorageLike {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

function getBrowserLocalStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const probeKey = '__rakit_pc_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isLessonUnlocked(
  lesson: LessonPrerequisiteInfo,
  completedLessonIds: readonly string[],
): boolean {
  if (!lesson.prerequisites || lesson.prerequisites.length === 0) {
    return true;
  }
  const completedSet = new Set(completedLessonIds.map((id) => id.toLowerCase()));
  return lesson.prerequisites.every((req) => completedSet.has(req.toLowerCase()));
}

export function getMissingPrerequisites(
  lesson: LessonPrerequisiteInfo,
  completedLessonIds: readonly string[],
): string[] {
  const completedSet = new Set(completedLessonIds.map((id) => id.toLowerCase()));
  return lesson.prerequisites.filter((req) => !completedSet.has(req.toLowerCase()));
}

/**
 * Membuat instance Zustand store berversi dengan pembungkus `try/catch` penuh pada setiap
 * akses storage (KU-04, KU-05, KU-06, KU-09, KU-11).
 */
export function createProgressStoreInstance(customStorage?: StorageLike | null) {
  let isStorageHealthy = true;
  const fallbackMemory = new Map<string, string>();

  const resolveUnderlying = (): StorageLike | null => {
    if (customStorage !== undefined) {
      return customStorage;
    }
    return getBrowserLocalStorage();
  };

  // Probe kesehatan awal bila customStorage atau browser storage diberikan
  const initialTarget = resolveUnderlying();
  if (!initialTarget) {
    isStorageHealthy = false;
  } else {
    try {
      const probeKey = '__rakit_pc_init_probe__';
      initialTarget.setItem(probeKey, 'ok');
      initialTarget.removeItem(probeKey);
    } catch {
      isStorageHealthy = false;
    }
  }

  const safeStateStorage: StateStorage = {
    getItem: (name: string): string | null => {
      const target = resolveUnderlying();
      if (!target) {
        isStorageHealthy = false;
        return fallbackMemory.get(name) ?? null;
      }
      try {
        return target.getItem(name);
      } catch {
        isStorageHealthy = false;
        return fallbackMemory.get(name) ?? null;
      }
    },
    setItem: (name: string, value: string): void => {
      fallbackMemory.set(name, value);
      const target = resolveUnderlying();
      if (!target) {
        isStorageHealthy = false;
        return;
      }
      try {
        target.setItem(name, value);
      } catch {
        isStorageHealthy = false;
      }
    },
    removeItem: (name: string): void => {
      fallbackMemory.delete(name);
      const target = resolveUnderlying();
      if (!target) {
        isStorageHealthy = false;
        return;
      }
      try {
        target.removeItem(name);
      } catch {
        isStorageHealthy = false;
      }
    },
  };

  const store = createStore<ProgressState>()(
    persist(
      (set, get) => ({
        schemaVersion: PROGRESS_SCHEMA_VERSION,
        completedLessonIds: [],
        currentLessonSlug: null,
        language: DEFAULT_LANGUAGE,
        qualityMode: 'medium',
        fallback2d: false,
        storageAvailable: isStorageHealthy,
        lastSimulationResult: null,
        quizAnswers: {},

        completeLesson: (lessonId: string) => {
          const normalized = lessonId.trim().toLowerCase();
          if (!normalized) return;
          const existing = get().completedLessonIds;
          const alreadyCompleted = existing.some((id) => id.toLowerCase() === normalized);
          const nextCompleted = alreadyCompleted ? existing : [...existing, normalized];

          set({
            completedLessonIds: nextCompleted,
            storageAvailable: isStorageHealthy,
          });
        },

        setCurrentLessonSlug: (slug: string | null) => {
          set({
            currentLessonSlug: slug ? slug.toLowerCase() : null,
            storageAvailable: isStorageHealthy,
          });
        },

        setLanguage: (lang: string) => {
          const normalized = normalizeLanguage(lang);
          setAppLanguage(normalized);
          set({
            language: normalized,
            storageAvailable: isStorageHealthy,
          });
        },

        setQualityMode: (mode: 'low' | 'medium' | 'high') => {
          set({
            qualityMode: mode,
            storageAvailable: isStorageHealthy,
          });
        },

        setFallback2d: (enabled: boolean) => {
          set({
            fallback2d: enabled,
            storageAvailable: isStorageHealthy,
          });
        },

        setLastSimulationResult: (result: SavedSimulationResult | null) => {
          set({
            lastSimulationResult: result,
            storageAvailable: isStorageHealthy,
          });
        },

        recordQuizAnswer: (questionId: string, selectedOptionId: string, correct: boolean) => {
          const prev = get().quizAnswers[questionId];
          const nextAttempts = (prev?.attempts ?? 0) + 1;
          set({
            quizAnswers: {
              ...get().quizAnswers,
              [questionId]: {
                selectedOptionId,
                correct,
                attempts: nextAttempts,
              },
            },
            storageAvailable: isStorageHealthy,
          });
        },

        resetProgress: (confirmed: boolean) => {
          if (!confirmed) return;
          set({
            completedLessonIds: [],
            currentLessonSlug: null,
            lastSimulationResult: null,
            quizAnswers: {},
            storageAvailable: isStorageHealthy,
          });
        },
      }),
      {
        name: PROGRESS_STORAGE_KEY,
        version: PROGRESS_SCHEMA_VERSION,
        storage: createJSONStorage(() => safeStateStorage),
        partialize: (state) => ({
          schemaVersion: state.schemaVersion,
          completedLessonIds: state.completedLessonIds,
          currentLessonSlug: state.currentLessonSlug,
          language: state.language,
          qualityMode: state.qualityMode,
          fallback2d: state.fallback2d,
          lastSimulationResult: state.lastSimulationResult,
          quizAnswers: state.quizAnswers,
        }),
        migrate: (persistedState: unknown) => {
          if (!persistedState || typeof persistedState !== 'object') {
            return {
              schemaVersion: PROGRESS_SCHEMA_VERSION,
              completedLessonIds: [],
              currentLessonSlug: null,
              language: DEFAULT_LANGUAGE,
              qualityMode: 'medium',
              fallback2d: false,
            };
          }
          return persistedState as ProgressState;
        },
        onRehydrateStorage: () => (state) => {
          if (state?.language) {
            setAppLanguage(state.language);
          }
        },
      },
    ),
  );

  if (!isStorageHealthy && store.getState().storageAvailable) {
    store.setState({ storageAvailable: false });
  }

  return store;
}

export const progressStore = createProgressStoreInstance();

export function useProgressStore<T>(selector: (state: ProgressState) => T): T {
  return useStore(progressStore, selector);
}
