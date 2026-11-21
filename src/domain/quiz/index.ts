/**
 * Mesin domain kuis murni — tanpa ketergantungan pada React, three.js, atau API browser.
 */

export interface QuizOptionSpec {
  id: string;
  textKey: string;
  whyWrongKey: string;
}

export interface QuizQuestionSpec {
  id: string;
  lessonId: string;
  promptKey: string;
  correctOptionId: string;
  explanationKey: string;
  options: QuizOptionSpec[];
}

export interface QuizAnswerRecord {
  selectedOptionId: string;
  correct: boolean;
  attempts: number;
}

export interface QuizEvaluationResult {
  questionId: string;
  correct: boolean;
  selectedOptionId: string;
  correctOptionId: string;
  explanationKey: string;
  whyWrongKey: string;
}

export interface QuizSummaryScore {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  totalAttempts: number;
  percentageScore: number;
}

export function evaluateQuizChoice(
  question: QuizQuestionSpec,
  selectedOptionId: string,
): QuizEvaluationResult {
  const chosen = question.options.find((opt) => opt.id === selectedOptionId);
  const isCorrect = selectedOptionId === question.correctOptionId;

  return {
    questionId: question.id,
    correct: isCorrect,
    selectedOptionId,
    correctOptionId: question.correctOptionId,
    explanationKey: question.explanationKey,
    whyWrongKey: chosen ? chosen.whyWrongKey : question.explanationKey,
  };
}

export function calculateQuizSummary(
  questions: readonly QuizQuestionSpec[],
  answers: Readonly<Record<string, QuizAnswerRecord>>,
): QuizSummaryScore {
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let correctCount = 0;
  let totalAttempts = 0;

  for (const q of questions) {
    const rec = answers[q.id];
    if (rec) {
      answeredCount += 1;
      totalAttempts += rec.attempts;
      if (rec.correct) {
        correctCount += 1;
      }
    }
  }

  const percentageScore =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    totalAttempts,
    percentageScore,
  };
}
