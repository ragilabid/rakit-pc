import { useState } from 'react';
import quizData from '../content/quiz.json';
import { evaluateQuizChoice, type QuizQuestionSpec } from '../domain/quiz';
import { t } from '../i18n';
import { useProgressStore } from '../store/useProgressStore';

const allQuestions = quizData.questions as unknown as QuizQuestionSpec[];

interface QuizPanelProps {
  lessonId: string;
}

export function QuizPanel({ lessonId }: QuizPanelProps) {
  const lessonQuestions = allQuestions.filter((q) => q.lessonId === lessonId);
  const quizAnswers = useProgressStore((s) => s.quizAnswers);
  const recordQuizAnswer = useProgressStore((s) => s.recordQuizAnswer);

  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, string>>({});

  if (lessonQuestions.length === 0) {
    return null;
  }

  return (
    <section
      className="quiz-section"
      aria-labelledby="quiz-section-heading"
      data-testid="lesson-quiz-panel"
    >
      <h2 id="quiz-section-heading" className="group-heading">
        {t('quiz.sectionHeading')}
      </h2>

      {lessonQuestions.map((q) => {
        const saved = quizAnswers[q.id];
        const currentSelected =
          selectedByQuestion[q.id] ?? saved?.selectedOptionId ?? q.options[0]?.id ?? 'a';
        const evaluation = saved ? evaluateQuizChoice(q, saved.selectedOptionId) : null;

        return (
          <div key={q.id} className="simulator-step-box" data-testid={`quiz-card-${q.id}`}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{t(q.promptKey)}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {q.options.map((opt) => (
                <label key={opt.id} className="cable-checkbox-label">
                  <input
                    type="radio"
                    name={`quiz-${q.id}`}
                    value={opt.id}
                    data-testid={`quiz-opt-${q.id}-${opt.id}`}
                    checked={currentSelected === opt.id}
                    onChange={() =>
                      setSelectedByQuestion((prev) => ({
                        ...prev,
                        [q.id]: opt.id,
                      }))
                    }
                  />
                  <span>{t(opt.textKey)}</span>
                </label>
              ))}
            </div>

            <div className="simulator-controls-row" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                data-testid={`quiz-submit-${q.id}`}
                onClick={() => {
                  const res = evaluateQuizChoice(q, currentSelected);
                  recordQuizAnswer(q.id, currentSelected, res.correct);
                }}
              >
                {t('quiz.checkAnswerButton')}
              </button>
              {saved && (
                <span className="status-tag" data-testid={`quiz-attempts-${q.id}`}>
                  {t('quiz.attemptsCount', { count: saved.attempts })}
                </span>
              )}
            </div>

            {evaluation && (
              <div
                className="notice-banner"
                style={{
                  marginTop: '0.75rem',
                  border: '1px solid var(--color-border-line)',
                  backgroundColor: evaluation.correct ? '#e6f4ee' : 'var(--color-status-error-bg)',
                  color: evaluation.correct ? '#0b4f36' : 'var(--color-status-error)',
                }}
                role="status"
                data-testid={`quiz-feedback-${q.id}`}
                data-correct={String(evaluation.correct)}
              >
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>
                  {evaluation.correct ? t('quiz.correctHeading') : t('quiz.wrongHeading')}
                </p>
                {!evaluation.correct && (
                  <p style={{ margin: '0 0 0.25rem 0' }}>{t(evaluation.whyWrongKey)}</p>
                )}
                <p style={{ margin: 0 }}>{t(evaluation.explanationKey)}</p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
