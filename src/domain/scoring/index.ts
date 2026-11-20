export interface ScoreInput {
  isPostSuccess: boolean;
  elapsedSeconds: number;
  targetSeconds: number;
  attempts: number;
  warningCount?: number;
}

export interface ScoreBreakdown {
  resultScore: number;
  timeScore: number;
  attemptScore: number;
  warningPenalty: number;
  totalScore: number;
}

/**
 * Menghitung skor simulasi perakitan berdasarkan:
 * - Hasil rakitan / POST (maks 60 poin)
 * - Waktu penyelesaian (maks 20 poin; penuh jika <= targetSeconds, turun bertahap jika lebih lama)
 * - Jumlah percobaan (maks 20 poin; penuh pada percobaan ke-1, dikurangi 5 poin per percobaan tambahan)
 * - Penalti peringatan logis non-fatal (2 poin per peringatan, maks 10 poin)
 */
export function calculateAssemblyScore(input: ScoreInput): ScoreBreakdown {
  const resultScore = input.isPostSuccess ? 60 : 0;

  let timeScore = 0;
  if (input.isPostSuccess) {
    if (input.elapsedSeconds <= input.targetSeconds) {
      timeScore = 20;
    } else {
      const overtimeRatio =
        (input.elapsedSeconds - input.targetSeconds) / Math.max(input.targetSeconds, 1);
      const deduction = Math.min(15, Math.ceil(overtimeRatio * 10));
      timeScore = Math.max(5, 20 - deduction);
    }
  }

  const extraAttempts = Math.max(0, input.attempts - 1);
  const attemptScore = input.isPostSuccess ? Math.max(4, 20 - extraAttempts * 5) : 0;

  const warningPenalty = input.isPostSuccess
    ? Math.min(10, Math.max(0, (input.warningCount ?? 0) * 2))
    : 0;

  const totalScore = Math.max(0, resultScore + timeScore + attemptScore - warningPenalty);

  return {
    resultScore,
    timeScore,
    attemptScore,
    warningPenalty,
    totalScore,
  };
}
