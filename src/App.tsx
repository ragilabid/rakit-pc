import { useEffect, useMemo, useState } from 'react';
import lessonsData from './content/lessons.json';
import beepData from './content/beep-ami.json';
import { SUPPORTED_LANGUAGES, t } from './i18n';
import { useHashRouter } from './router';
import {
  getMissingPrerequisites,
  isLessonUnlocked,
  useProgressStore,
} from './store/useProgressStore';
import { StagePreview } from './ui/StagePreview';
import './ui/styles.css';

type LessonTab = 'overview' | 'specs' | 'practice';

export function App() {
  const lessons = lessonsData.lessons;
  const lessonSlugs = useMemo(() => lessons.map((l) => l.slug), [lessons]);
  const { route, navigate } = useHashRouter(lessonSlugs);

  const completedLessonIds = useProgressStore((s) => s.completedLessonIds);
  const currentLessonSlug = useProgressStore((s) => s.currentLessonSlug);
  const language = useProgressStore((s) => s.language);
  const storageAvailable = useProgressStore((s) => s.storageAvailable);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const setCurrentLessonSlug = useProgressStore((s) => s.setCurrentLessonSlug);
  const setLanguage = useProgressStore((s) => s.setLanguage);
  const resetProgress = useProgressStore((s) => s.resetProgress);

  const [tabState, setTabState] = useState<{ slug: string; tab: LessonTab }>({
    slug: '',
    tab: 'overview',
  });
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetDoneBanner, setResetDoneBanner] = useState(false);

  const activeLesson = useMemo(() => {
    if (route.page === 'lesson' && route.lessonSlug) {
      return lessons.find((l) => l.slug === route.lessonSlug) ?? lessons[0]!;
    }
    return lessons[0]!;
  }, [lessons, route.lessonSlug, route.page]);

  const activeTab: LessonTab = tabState.slug === activeLesson.slug ? tabState.tab : 'overview';
  const setActiveTab = (tab: LessonTab) => {
    setTabState({ slug: activeLesson.slug, tab });
  };

  useEffect(() => {
    if (route.page === 'lesson' && route.lessonSlug) {
      setCurrentLessonSlug(route.lessonSlug);
    }
  }, [route.lessonSlug, route.page, setCurrentLessonSlug]);

  const totalLessons = lessons.length;
  const completedCount = completedLessonIds.length;

  const isCompleted = (lessonId: string) =>
    completedLessonIds.some((id) => id.toLowerCase() === lessonId.toLowerCase());

  const renderLessonListPanel = () => {
    const basicLessons = lessons.filter((l) => l.group === 'basics');
    const practiceLessons = lessons.filter((l) => l.group === 'practice');

    const renderRow = (lesson: (typeof lessons)[number]) => {
      const unlocked = isLessonUnlocked(lesson, completedLessonIds);
      const done = isCompleted(lesson.id);
      const missingPrereqs = getMissingPrerequisites(lesson, completedLessonIds);

      return (
        <li key={lesson.id} className="divided-row">
          <div className="lesson-row-info">
            <p className="lesson-row-title">
              {lesson.order}. {t(lesson.titleKey)}
              {done && (
                <span className="status-tag status-tag-done">{t('home.completedBadge')}</span>
              )}
              {!unlocked && <span className="status-tag">{t('home.lockedBadge')}</span>}
            </p>
            <p className="lesson-row-meta">{t(lesson.summaryKey)}</p>
            {!unlocked && missingPrereqs.length > 0 && (
              <p className="lesson-row-meta">
                <strong>{t('home.prerequisitesRequired')}</strong>{' '}
                {missingPrereqs
                  .map((slug) => {
                    const found = lessons.find((item) => item.slug === slug);
                    return found ? t(found.titleKey) : slug;
                  })
                  .join(', ')}
              </p>
            )}
          </div>
          <div>
            <button
              type="button"
              className={unlocked ? 'btn btn-primary' : 'btn'}
              onClick={() => navigate(`#${lesson.slug}`)}
            >
              {t('home.openLessonButton')}
            </button>
          </div>
        </li>
      );
    };

    return (
      <section className="panel-column" aria-labelledby="lesson-list-heading">
        <div>
          <h1 id="lesson-list-heading" className="section-heading">
            {t('home.lessonListHeading')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
            {t('app.subtitle')}
          </p>
        </div>

        {currentLessonSlug && (
          <div>
            <button type="button" className="btn" onClick={() => navigate(`#${currentLessonSlug}`)}>
              {t('home.continueLastLesson')}: #{currentLessonSlug}
            </button>
          </div>
        )}

        <div>
          <h2 className="group-heading">{t('home.basicsGroupHeading')}</h2>
          <ul className="divided-list">{basicLessons.map(renderRow)}</ul>
        </div>

        <div>
          <h2 className="group-heading">{t('home.practiceGroupHeading')}</h2>
          <ul className="divided-list">{practiceLessons.map(renderRow)}</ul>
        </div>
      </section>
    );
  };

  const renderLessonDetailPanel = () => {
    const unlocked = isLessonUnlocked(activeLesson, completedLessonIds);
    const missingPrereqs = getMissingPrerequisites(activeLesson, completedLessonIds);
    const done = isCompleted(activeLesson.id);
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

    if (!unlocked) {
      const firstMissingSlug = missingPrereqs[0] ?? 'motherboard';
      return (
        <section className="panel-column" aria-labelledby="locked-lesson-heading">
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
            {t('lessonPage.stepCounter', { order: activeLesson.order, total: totalLessons })}
          </p>
          <h1 id="locked-lesson-heading" className="section-heading">
            {t('lessonPage.lockedHeading')}
          </h1>
          <p>{t('lessonPage.lockedDescription')}</p>
          <ul className="divided-list">
            {missingPrereqs.map((slug) => {
              const item = lessons.find((l) => l.slug === slug);
              return (
                <li key={slug} className="divided-row">
                  <span>{item ? `${item.order}. ${t(item.titleKey)}` : slug}</span>
                  <button type="button" className="btn" onClick={() => navigate(`#${slug}`)}>
                    {t('home.openLessonButton')}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="lesson-footer-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`#${firstMissingSlug}`)}
            >
              {t('lessonPage.goToPrerequisite')}
            </button>
            <button type="button" className="btn" onClick={() => navigate('#pelajaran')}>
              {t('lessonPage.backToList')}
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="panel-column" aria-labelledby="active-lesson-heading">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
            {t('lessonPage.stepCounter', { order: activeLesson.order, total: totalLessons })}
          </p>
          <h1 id="active-lesson-heading" className="section-heading">
            {t(activeLesson.titleKey)}
          </h1>
        </div>

        <div className="tab-bar" role="tablist" aria-label={t(activeLesson.titleKey)}>
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            {t('lessonPage.tabOverview')}
          </button>
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={activeTab === 'specs'}
            onClick={() => setActiveTab('specs')}
          >
            {t('lessonPage.tabSpecs')}
          </button>
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={activeTab === 'practice'}
            onClick={() => setActiveTab('practice')}
          >
            {t('lessonPage.tabPractice')}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div role="tabpanel">
            <p>
              <strong>{t(activeLesson.summaryKey)}</strong>
            </p>
            {activeLesson.overviewParagraphKeys.map((pKey) => (
              <p key={pKey}>{t(pKey)}</p>
            ))}
          </div>
        )}

        {activeTab === 'specs' && (
          <div role="tabpanel">
            <table className="spec-table">
              <thead>
                <tr>
                  <th>{t('specs.columnParameter')}</th>
                  <th>{t('specs.columnDetail')}</th>
                </tr>
              </thead>
              <tbody>
                {activeLesson.specs.map((spec) => (
                  <tr key={spec.labelKey}>
                    <td className="spec-param-cell">{t(spec.labelKey)}</td>
                    <td>{t(spec.valueKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'practice' && (
          <div role="tabpanel">
            <p>{t(activeLesson.practicePromptKey)}</p>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t(activeLesson.practiceTipKey)}</p>
          </div>
        )}

        <div className="lesson-footer-actions">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => completeLesson(activeLesson.id)}
            >
              {t('lessonPage.completeButton')}
            </button>
            {done && (
              <span className="status-tag status-tag-done" data-testid="lesson-completed-badge">
                {t('lessonPage.completedNotice')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {prevLesson && (
              <button type="button" className="btn" onClick={() => navigate(`#${prevLesson.slug}`)}>
                &lt; {t('lessonPage.prevLesson')}
              </button>
            )}
            {nextLesson && (
              <button type="button" className="btn" onClick={() => navigate(`#${nextLesson.slug}`)}>
                {t('lessonPage.nextLesson')} &gt;
              </button>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderComponentsCatalog = () => {
    const { internal, externalPeripherals, legacyHistory } = lessonsData.deviceCatalog;
    return (
      <div className="full-page-container">
        <h1 className="section-heading">{t('catalog.heading')}</h1>
        <p>{t('catalog.description')}</p>

        <h2 className="group-heading">{t('catalog.internalHeading')}</h2>
        <ul className="divided-list">
          {internal.map((item) => (
            <li key={item.id} className="divided-row">
              <div className="lesson-row-info">
                <p className="lesson-row-title">{t(item.nameKey)}</p>
                <p className="lesson-row-meta" style={{ fontFamily: 'var(--font-mono)' }}>
                  {t(item.specKey)}
                </p>
                <p style={{ margin: '0.25rem 0 0 0' }}>{t(item.descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="group-heading">{t('catalog.externalHeading')}</h2>
        <ul className="divided-list">
          {externalPeripherals.map((item) => (
            <li key={item.id} className="divided-row">
              <div className="lesson-row-info">
                <p className="lesson-row-title">{t(item.nameKey)}</p>
                <p className="lesson-row-meta" style={{ fontFamily: 'var(--font-mono)' }}>
                  {t(item.specKey)}
                </p>
                <p style={{ margin: '0.25rem 0 0 0' }}>{t(item.descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="group-heading">{t('catalog.legacyHeading')}</h2>
        <ul className="divided-list">
          {legacyHistory.map((item) => (
            <li key={item.id} className="divided-row">
              <div className="lesson-row-info">
                <p className="lesson-row-title">{t(item.nameKey)}</p>
                <p className="lesson-row-meta" style={{ fontFamily: 'var(--font-mono)' }}>
                  {t(item.specKey)}
                </p>
                <p style={{ margin: '0.25rem 0 0 0' }}>{t(item.descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderReferencePage = () => (
    <div className="full-page-container">
      <h1 className="section-heading">{t('reference.heading')}</h1>

      <h2 className="group-heading">{t('reference.controlsSection')}</h2>
      <ul className="divided-list">
        <li className="divided-row">{t('reference.controlMove')}</li>
        <li className="divided-row">{t('reference.controlRotate')}</li>
        <li className="divided-row">{t('reference.controlZoom')}</li>
        <li className="divided-row">{t('reference.controlKeyboard')}</li>
      </ul>

      <h2 className="group-heading" style={{ marginTop: '1.5rem' }}>
        {t('reference.beepSection')}
      </h2>
      <table className="spec-table">
        <thead>
          <tr>
            <th>{t('reference.beepPatternCol')}</th>
            <th>{t('reference.beepComponentCol')}</th>
            <th>{t('reference.beepMeaningCol')}</th>
          </tr>
        </thead>
        <tbody>
          {beepData.map((entry) => (
            <tr key={entry.id}>
              <td className="spec-param-cell">{t(`reference.beeps.${entry.id}.pattern`)}</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{entry.targetComponent}</td>
              <td>
                <strong>{t(`reference.beeps.${entry.id}.meaning`)}</strong>
                <div style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
                  {t(`reference.beeps.${entry.id}.hint`)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderResultsPage = () => (
    <div className="full-page-container">
      <h1 className="section-heading">{t('results.heading')}</h1>
      <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{t('results.teacherNotice')}</p>

      <div className="teacher-summary-strip">
        <div className="teacher-metric-cell">
          <p className="teacher-metric-label">{t('results.statusLabel')}</p>
          <p className="teacher-metric-status">{t('results.statusSuccess')}</p>
        </div>
        <div className="teacher-metric-cell">
          <p className="teacher-metric-label">{t('results.scoreLabel')}</p>
          <p className="teacher-metric-value">95 / 100</p>
        </div>
        <div className="teacher-metric-cell">
          <p className="teacher-metric-label">{t('results.timeLabel')}</p>
          <p className="teacher-metric-value">03:40</p>
        </div>
        <div className="teacher-metric-cell">
          <p className="teacher-metric-label">{t('results.attemptsLabel')}</p>
          <p className="teacher-metric-value">2</p>
        </div>
      </div>

      <h2 className="group-heading">{t('results.breakdownHeading')}</h2>
      <ul className="divided-list">
        <li className="divided-row">
          <span>{t('results.breakdownResult')}</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>60 / 60</strong>
        </li>
        <li className="divided-row">
          <span>{t('results.breakdownTime')}</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>20 / 20</strong>
        </li>
        <li className="divided-row">
          <span>{t('results.breakdownAttempts')}</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>15 / 20</strong>
        </li>
      </ul>

      <h2 className="group-heading" style={{ marginTop: '1.25rem' }}>
        {t('results.feedbackHeading')}
      </h2>
      <ul className="divided-list">
        <li className="divided-row">{t('results.feedbackItem1')}</li>
        <li className="divided-row">{t('results.feedbackItem2')}</li>
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('#rakit-pc')}>
          {t('results.retryButton')}
        </button>
        <button type="button" className="btn" onClick={() => navigate('#pelajaran')}>
          {t('results.backToLessonsButton')}
        </button>
      </div>
    </div>
  );

  const renderSettingsPage = () => (
    <div className="full-page-container">
      <h1 className="section-heading">{t('settings.heading')}</h1>

      <h2 className="group-heading">{t('settings.languageSection')}</h2>
      <p>{t('settings.languageDescription')}</p>
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="settings-language-select"
          style={{ marginRight: '0.5rem', fontWeight: 600 }}
        >
          {t('nav.languageLabel')}:
        </label>
        <select
          id="settings-language-select"
          className="control-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="id">Bahasa Indonesia (ID)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>

      <h2 className="group-heading">{t('settings.progressSection')}</h2>
      <p>{t('settings.progressDescription')}</p>
      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        {t('settings.currentProgressText', { completed: completedCount, total: totalLessons })}
      </p>

      {resetDoneBanner && (
        <p className="notice-banner notice-warn" style={{ marginBottom: '1rem' }}>
          {t('settings.resetSuccessNotice')}
        </p>
      )}

      <button
        type="button"
        className="btn btn-danger"
        onClick={() => {
          setResetDoneBanner(false);
          setConfirmResetOpen(true);
        }}
      >
        {t('settings.resetButton')}
      </button>

      {confirmResetOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <h2 className="group-heading" style={{ marginTop: 0 }}>
              {t('settings.confirmTitle')}
            </h2>
            <p>{t('settings.confirmDescription', { total: totalLessons })}</p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setConfirmResetOpen(false)}>
                {t('settings.confirmCancel')}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  resetProgress(true);
                  setConfirmResetOpen(false);
                  setResetDoneBanner(true);
                }}
              >
                {t('settings.confirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-group">
          <a href="#beranda" className="brand-link">
            {t('app.brand')}
          </a>
          <nav className="nav-links" aria-label={t('nav.menuToggle')}>
            <a
              href="#beranda"
              className="nav-link"
              aria-current={route.page === 'home' ? 'page' : undefined}
            >
              {t('nav.home')}
            </a>
            <a
              href="#pelajaran"
              className="nav-link"
              aria-current={
                route.page === 'lessons' || route.page === 'lesson' ? 'page' : undefined
              }
            >
              {t('nav.lessons')}
            </a>
            <a
              href="#komponen"
              className="nav-link"
              aria-current={route.page === 'components' ? 'page' : undefined}
            >
              {t('nav.components')}
            </a>
            <a
              href="#referensi"
              className="nav-link"
              aria-current={route.page === 'reference' ? 'page' : undefined}
            >
              {t('nav.reference')}
            </a>
            <a
              href="#hasil"
              className="nav-link"
              aria-current={route.page === 'results' ? 'page' : undefined}
            >
              {t('nav.results')}
            </a>
            <a
              href="#pengaturan"
              className="nav-link"
              aria-current={route.page === 'settings' ? 'page' : undefined}
            >
              {t('nav.settings')}
            </a>
          </nav>
        </div>

        <div className="top-status">
          <div className="progress-pill" data-testid="progress-counter">
            {t('app.progressLabel')}: {completedCount}/{totalLessons}
          </div>
          <div className="lang-select-wrapper">
            <label htmlFor="top-language-select">{t('nav.languageLabel')}</label>
            <select
              id="top-language-select"
              aria-label={t('nav.languageLabel')}
              className="control-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lng) => (
                <option key={lng} value={lng}>
                  {lng.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {!storageAvailable && (
        <div
          className="notice-banner notice-warn"
          role="alert"
          data-testid="storage-warning-banner"
        >
          {t('app.storageWarning')}
        </div>
      )}

      {route.redirectedFromUnknown && (
        <div className="notice-banner notice-warn" role="status">
          {t('app.unknownRouteNotice')}
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {(route.page === 'home' || route.page === 'lessons') && (
          <div className="workbench-grid">
            <StagePreview lessonTitle={t(activeLesson.titleKey)} parts={activeLesson.stageParts} />
            {renderLessonListPanel()}
          </div>
        )}

        {route.page === 'lesson' && (
          <div className="workbench-grid">
            <StagePreview lessonTitle={t(activeLesson.titleKey)} parts={activeLesson.stageParts} />
            {renderLessonDetailPanel()}
          </div>
        )}

        {route.page === 'components' && renderComponentsCatalog()}
        {route.page === 'reference' && renderReferencePage()}
        {route.page === 'results' && renderResultsPage()}
        {route.page === 'settings' && renderSettingsPage()}
      </main>
    </div>
  );
}
