import { useState } from 'react';
import { t } from '../i18n';
import { useProgressStore } from '../store/useProgressStore';

export interface StagePartItem {
  id: string;
  labelKey: string;
  nameKey: string;
  functionKey: string;
}

interface StagePreviewProps {
  lessonTitle: string;
  parts: StagePartItem[];
}

export function StagePreview({ lessonTitle, parts }: StagePreviewProps) {
  const qualityMode = useProgressStore((s) => s.qualityMode);
  const setQualityMode = useProgressStore((s) => s.setQualityMode);
  const fallback2d = useProgressStore((s) => s.fallback2d);
  const setFallback2d = useProgressStore((s) => s.setFallback2d);

  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id ?? '');

  const activePart = parts.find((p) => p.id === selectedPartId) ?? parts[0];

  return (
    <section className="stage-column" aria-label={t('stage.heading')}>
      <div>
        <div className="stage-toolbar">
          <h2 className="stage-title">
            {t('stage.heading')} — {lessonTitle}
          </h2>
          <div className="stage-controls-row">
            <label htmlFor="quality-select" style={{ fontSize: '0.875rem' }}>
              {t('stage.qualityLabel')}:
            </label>
            <select
              id="quality-select"
              className="stage-select"
              value={qualityMode}
              onChange={(e) => setQualityMode(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">{t('stage.qualityLow')}</option>
              <option value="medium">{t('stage.qualityMedium')}</option>
              <option value="high">{t('stage.qualityHigh')}</option>
            </select>
            <button
              type="button"
              className="stage-btn"
              aria-pressed={fallback2d}
              onClick={() => setFallback2d(!fallback2d)}
            >
              {fallback2d ? t('stage.mode2d') : t('stage.mode3d')}
            </button>
          </div>
        </div>

        <div className="stage-viewport">
          <svg
            className="stage-schematic-svg"
            viewBox="0 0 420 210"
            role="img"
            aria-label={`${t('stage.heading')}: ${lessonTitle}`}
          >
            <rect
              x="8"
              y="8"
              width="404"
              height="194"
              fill="#181c20"
              stroke="#0f6b4a"
              strokeWidth="2"
            />
            <line x1="28" y1="45" x2="392" y2="45" stroke="#323a42" strokeWidth="1" />
            <line x1="28" y1="165" x2="392" y2="165" stroke="#323a42" strokeWidth="1" />
            {parts.map((part, idx) => {
              const isSelected = part.id === activePart?.id;
              const boxWidth = 112;
              const boxX = 24 + idx * 126;
              const boxY = 66;
              return (
                <g
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={boxX}
                    y={boxY}
                    width={boxWidth}
                    height="78"
                    fill={isSelected ? '#0f6b4a' : '#242a30'}
                    stroke={isSelected ? '#ffffff' : '#c8d0d8'}
                    strokeWidth={isSelected ? '2' : '1'}
                  />
                  <text
                    x={boxX + boxWidth / 2}
                    y={boxY + 43}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {t(part.labelKey)}
                  </text>
                </g>
              );
            })}
          </svg>
          {fallback2d && (
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0', color: '#cfd6de' }}>
              {t('stage.fallback2dNotice')}
            </p>
          )}
        </div>

        {activePart && (
          <div className="stage-part-inspector" data-testid="selected-stage-part">
            <h3>
              {t('stage.selectedPartHeading')}: {t(activePart.nameKey)}
            </h3>
            <p>
              <strong>{t('stage.selectedPartFunctionLabel')}:</strong> {t(activePart.functionKey)}
            </p>
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {t('stage.keyboardListLabel')}:
          </div>
          <div
            className="stage-keyboard-list"
            role="group"
            aria-label={t('stage.keyboardListLabel')}
          >
            {parts.map((part) => {
              const isSelected = part.id === activePart?.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  className="stage-btn"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedPartId(part.id)}
                >
                  {t(part.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="stage-hint-bar">{t('stage.controlsHint')}</div>
    </section>
  );
}
