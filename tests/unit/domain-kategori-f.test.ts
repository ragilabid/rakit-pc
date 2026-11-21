import { describe, expect, it } from 'vitest';
import quizData from '../../src/content/quiz.json';
import {
  calculateQuizSummary,
  evaluateQuizChoice,
  type QuizQuestionSpec,
} from '../../src/domain/quiz';
import { calculateAssemblyScore } from '../../src/domain/scoring';
import { t, setAppLanguage } from '../../src/i18n';
import { createProgressStoreInstance } from '../../src/store/useProgressStore';

const questions = quizData.questions as unknown as QuizQuestionSpec[];

describe('Kategori F — Kuis, Latihan, dan Penyimpanan Hasil (KU-58 s.d. KU-63)', () => {
  it('[KU-58] kuis mengevaluasi jawaban benar/salah dan memberikan umpan balik penjelas mengapa salah', () => {
    setAppLanguage('id');
    const ramQuestion = questions.find((q) => q.id === 'quiz-ram-1')!;

    // Jawaban salah (opsi a)
    const wrongEval = evaluateQuizChoice(ramQuestion, 'a');
    expect(wrongEval.correct).toBe(false);
    expect(t(wrongEval.whyWrongKey).toLowerCase()).toContain('kurang tepat');
    expect(t(wrongEval.explanationKey).toLowerCase()).toContain('notch');

    // Jawaban benar (opsi c)
    const rightEval = evaluateQuizChoice(ramQuestion, 'c');
    expect(rightEval.correct).toBe(true);
    expect(t(rightEval.explanationKey).toLowerCase()).toContain('ddr');
  });

  it('[KU-59] skor akhir (simulasi + ringkasan kuis) menghitung hasil, waktu, dan percobaan secara akurat', () => {
    const simScore = calculateAssemblyScore({
      isPostSuccess: true,
      elapsedSeconds: 210,
      targetSeconds: 300,
      attempts: 2,
      warningCount: 0,
    });
    expect(simScore.resultScore).toBe(60);
    expect(simScore.timeScore).toBe(20);
    expect(simScore.attemptScore).toBe(15);
    expect(simScore.totalScore).toBe(95);

    const quizSummary = calculateQuizSummary(questions, {
      'quiz-mb-1': { selectedOptionId: 'b', correct: true, attempts: 1 },
      'quiz-cpu-1': { selectedOptionId: 'a', correct: true, attempts: 2 },
      'quiz-ram-1': { selectedOptionId: 'a', correct: false, attempts: 1 },
    });

    expect(quizSummary.totalQuestions).toBe(7);
    expect(quizSummary.answeredCount).toBe(3);
    expect(quizSummary.correctCount).toBe(2);
    expect(quizSummary.totalAttempts).toBe(4);
    expect(quizSummary.percentageScore).toBe(Math.round((2 / 7) * 100));
  });

  it('[KU-61] hasil simulasi dan jawaban kuis tersimpan lokal dan muncul kembali setelah muat ulang', () => {
    const backing = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => {
        backing.set(k, v);
      },
      removeItem: (k: string) => {
        backing.delete(k);
      },
    };

    const session1 = createProgressStoreInstance(mockStorage);
    session1.getState().recordQuizAnswer('quiz-mb-1', 'b', true);
    session1.getState().setLastSimulationResult({
      isPostSuccess: true,
      postStatus: 'BOOT_SUCCESS',
      beepPattern: '1 pendek',
      totalScore: 95,
      resultScore: 60,
      timeScore: 20,
      attemptScore: 15,
      warningPenalty: 0,
      elapsedSeconds: 195,
      attempts: 2,
      feedbackItems: ['POST berhasil normal.'],
    });

    const session2 = createProgressStoreInstance(mockStorage);
    expect(session2.getState().quizAnswers['quiz-mb-1']?.correct).toBe(true);
    expect(session2.getState().lastSimulationResult?.totalScore).toBe(95);
    expect(session2.getState().lastSimulationResult?.attempts).toBe(2);
  });

  it('[KU-62] reset progres juga menghapus hasil simulasi dan kuis tersimpan setelah konfirmasi', () => {
    const store = createProgressStoreInstance();
    store.getState().recordQuizAnswer('quiz-ram-1', 'c', true);
    store.getState().setLastSimulationResult({
      isPostSuccess: true,
      postStatus: 'BOOT_SUCCESS',
      beepPattern: '1 pendek',
      totalScore: 100,
      resultScore: 60,
      timeScore: 20,
      attemptScore: 20,
      warningPenalty: 0,
      elapsedSeconds: 120,
      attempts: 1,
      feedbackItems: ['Sempurna.'],
    });

    // Tanpa konfirmasi: tidak dihapus
    store.getState().resetProgress(false);
    expect(store.getState().lastSimulationResult).not.toBeNull();
    expect(Object.keys(store.getState().quizAnswers)).toHaveLength(1);

    // Dengan konfirmasi: terhapus bersih
    store.getState().resetProgress(true);
    expect(store.getState().lastSimulationResult).toBeNull();
    expect(Object.keys(store.getState().quizAnswers)).toHaveLength(0);
  });
});
