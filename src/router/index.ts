import { useEffect, useState } from 'react';

export type PageType =
  'home' | 'lessons' | 'lesson' | 'components' | 'reference' | 'results' | 'settings';

export interface ResolvedRoute {
  page: PageType;
  lessonSlug: string | null;
  canonicalHash: string;
  redirectedFromUnknown: boolean;
}

const STATIC_ROUTES: Record<string, PageType> = {
  '': 'home',
  beranda: 'home',
  home: 'home',
  pelajaran: 'lessons',
  lessons: 'lessons',
  komponen: 'components',
  components: 'components',
  referensi: 'reference',
  reference: 'reference',
  hasil: 'results',
  results: 'results',
  pengaturan: 'settings',
  settings: 'settings',
};

/**
 * Menormalisasi hash URL secara tidak peka huruf besar/kecil (KU-01, KU-02, KU-03).
 * Slug yang tidak dikenal selalu jatuh ke beranda (`page: 'home'`) dengan `redirectedFromUnknown: true`.
 */
export function resolveHashRoute(
  rawHash: string,
  validLessonSlugs: readonly string[],
): ResolvedRoute {
  const cleaned = rawHash.replace(/^#\/?/, '').trim().toLowerCase();

  if (cleaned in STATIC_ROUTES) {
    const page = STATIC_ROUTES[cleaned]!;
    return {
      page,
      lessonSlug: null,
      canonicalHash: page === 'home' ? '#beranda' : `#${cleaned}`,
      redirectedFromUnknown: false,
    };
  }

  const matchedLesson = validLessonSlugs.find((slug) => slug.toLowerCase() === cleaned);
  if (matchedLesson) {
    return {
      page: 'lesson',
      lessonSlug: matchedLesson,
      canonicalHash: `#${matchedLesson}`,
      redirectedFromUnknown: false,
    };
  }

  return {
    page: 'home',
    lessonSlug: null,
    canonicalHash: '#beranda',
    redirectedFromUnknown: cleaned.length > 0,
  };
}

export function useHashRouter(validLessonSlugs: readonly string[]) {
  const [route, setRoute] = useState<ResolvedRoute>(() =>
    resolveHashRoute(typeof window !== 'undefined' ? window.location.hash : '', validLessonSlugs),
  );

  useEffect(() => {
    const syncFromLocation = () => {
      setRoute(resolveHashRoute(window.location.hash, validLessonSlugs));
    };

    syncFromLocation();
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [validLessonSlugs]);

  const navigate = (targetHash: string) => {
    const formatted = targetHash.startsWith('#') ? targetHash : `#${targetHash}`;
    if (window.location.hash !== formatted) {
      window.location.hash = formatted;
    } else {
      setRoute(resolveHashRoute(formatted, validLessonSlugs));
    }
  };

  return { route, navigate };
}
