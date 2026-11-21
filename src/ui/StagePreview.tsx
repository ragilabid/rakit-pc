import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n';
import { useProgressStore } from '../store/useProgressStore';
import { PrimitiveHardwareScene } from '../three/PrimitiveHardwareScene';
import {
  CAMERA_LIMITS,
  applyKeyboardCameraStep,
  applyWheelZoomStep,
  clampCameraState,
  createInitialCameraState,
  detectWebGL2Support,
  evaluateFpsQualitySuggestion,
  shouldIgnoreStageKeyEvent,
  type CameraOrbitState,
} from '../three/stageController';

export interface StagePartItem {
  id: string;
  labelKey: string;
  nameKey: string;
  functionKey: string;
}

interface StagePreviewProps {
  lessonId?: string;
  lessonTitle: string;
  parts: StagePartItem[];
}

export function StagePreview({ lessonId, lessonTitle, parts }: StagePreviewProps) {
  const qualityMode = useProgressStore((s) => s.qualityMode);
  const setQualityMode = useProgressStore((s) => s.setQualityMode);
  const fallback2d = useProgressStore((s) => s.fallback2d);
  const setFallback2d = useProgressStore((s) => s.setFallback2d);

  const [webgl2Available] = useState<boolean>(() => detectWebGL2Support());
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id ?? '');
  const [cameraState, setCameraState] = useState<CameraOrbitState>(() =>
    createInitialCameraState(),
  );
  const [partFilterQuery, setPartFilterQuery] = useState<string>('');
  const [isRenderPaused, setIsRenderPaused] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(100);
  const [lowFpsDetected, setLowFpsDetected] = useState<boolean>(false);

  const fpsSamplesRef = useRef<number[]>([]);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);

  const filteredParts = useMemo(() => {
    const query = partFilterQuery.trim().toLowerCase();
    if (!query) return parts;
    const matches = parts.filter(
      (p) =>
        t(p.labelKey).toLowerCase().includes(query) || t(p.nameKey).toLowerCase().includes(query),
    );
    return matches.length > 0 ? matches : parts;
  }, [partFilterQuery, parts]);

  const activePart = parts.find((p) => p.id === selectedPartId) ?? parts[0];

  // Indikator muat model saat pelajaran berganti (KU-20)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startTimer = setTimeout(() => {
      setLoadingProgress(45);
      timer = setTimeout(() => {
        setLoadingProgress(100);
      }, 120);
    }, 0);

    return () => {
      clearTimeout(startTimer);
      if (timer) clearTimeout(timer);
    };
  }, [lessonTitle]);

  // Jeda render saat tab tersembunyi di latar belakang & lanjut saat kembali (KU-19)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsRenderPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Pintasan keyboard WASD / QE — tidak aktif bila fokus di dalam input/textarea/select (KU-16)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (shouldIgnoreStageKeyEvent(target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', '+', '=', '-', '_'].includes(key)) {
        setCameraState((prev) => applyKeyboardCameraStep(prev, key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dukungan pengujian deterministik saran FPS rendah (KU-17)
  const handleFpsSample = useCallback(
    (fps: number) => {
      const next = [...fpsSamplesRef.current.slice(-3), fps];
      fpsSamplesRef.current = next;
      const result = evaluateFpsQualitySuggestion(next, qualityMode);
      setLowFpsDetected(result.shouldSuggestDowngrade);
    },
    [qualityMode],
  );

  useEffect(() => {
    const handleSimulatedFps = (event: Event) => {
      const custom = event as CustomEvent<{ fps?: number }>;
      const sample = custom.detail?.fps ?? 18;
      fpsSamplesRef.current = [sample, sample, sample];
      const evaluation = evaluateFpsQualitySuggestion(fpsSamplesRef.current, qualityMode);
      setLowFpsDetected(evaluation.shouldSuggestDowngrade);
    };

    window.addEventListener('rakit-pc:simulate-fps', handleSimulatedFps);
    return () => {
      window.removeEventListener('rakit-pc:simulate-fps', handleSimulatedFps);
    };
  }, [qualityMode]);

  const effectiveFallback2d = !webgl2Available || fallback2d;

  const primitiveParts = useMemo(
    () =>
      parts.map((p) => ({
        id: p.id,
        label: t(p.labelKey),
      })),
    [parts],
  );

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
              onChange={(e) => {
                const nextMode = e.target.value as 'low' | 'medium' | 'high';
                setQualityMode(nextMode);
                if (nextMode === 'low') {
                  setLowFpsDetected(false);
                }
              }}
            >
              <option value="low">{t('stage.qualityLow')}</option>
              <option value="medium">{t('stage.qualityMedium')}</option>
              <option value="high">{t('stage.qualityHigh')}</option>
            </select>
            <button
              type="button"
              className="stage-btn"
              aria-pressed={effectiveFallback2d}
              onClick={() => setFallback2d(!fallback2d)}
            >
              {effectiveFallback2d ? t('stage.mode2d') : t('stage.mode3d')}
            </button>
          </div>
        </div>

        {!webgl2Available && (
          <div className="stage-alert-box" role="alert" data-testid="webgl2-unavailable-banner">
            {t('stage.webgl2UnavailableNotice')}
          </div>
        )}

        {lowFpsDetected && qualityMode !== 'low' && (
          <div className="stage-alert-box" role="status" data-testid="fps-downgrade-suggestion">
            <span>{t('stage.fpsLowSuggestion')}</span>
            <button
              type="button"
              className="stage-btn"
              onClick={() => {
                setQualityMode('low');
                setLowFpsDetected(false);
              }}
            >
              {t('stage.fpsDowngradeButton')}
            </button>
          </div>
        )}

        {loadingProgress < 100 && (
          <div className="stage-status-bar" role="status" data-testid="stage-loading-indicator">
            {t('stage.loadingModelText', { progress: loadingProgress })}
          </div>
        )}

        {isRenderPaused && (
          <div
            className="stage-status-bar"
            role="status"
            data-testid="stage-render-paused-indicator"
          >
            {t('stage.renderPausedText')}
          </div>
        )}

        <div
          className="stage-viewport"
          data-testid="stage-canvas-container"
          onWheel={(e) => {
            setCameraState((prev) => applyWheelZoomStep(prev, e.deltaY));
          }}
          onPointerDown={(e) => {
            dragStartRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!dragStartRef.current) return;
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            setCameraState((prev) =>
              clampCameraState({
                ...prev,
                azimuthAngle: prev.azimuthAngle - dx * 0.008,
                polarAngle: prev.polarAngle - dy * 0.006,
              }),
            );
          }}
          onPointerUp={() => {
            dragStartRef.current = null;
          }}
          onPointerCancel={() => {
            dragStartRef.current = null;
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
              const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
              pinchDistanceRef.current = Math.hypot(dx, dy);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && pinchDistanceRef.current !== null) {
              const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
              const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
              const nextDist = Math.hypot(dx, dy);
              const delta = pinchDistanceRef.current - nextDist;
              pinchDistanceRef.current = nextDist;
              setCameraState((prev) =>
                clampCameraState({
                  ...prev,
                  distance: prev.distance + delta * 0.02,
                }),
              );
            }
          }}
          onTouchEnd={() => {
            pinchDistanceRef.current = null;
          }}
        >
          {!effectiveFallback2d ? (
            <PrimitiveHardwareScene
              lessonId={lessonId}
              lessonTitle={lessonTitle}
              parts={primitiveParts}
              selectedPartId={activePart?.id ?? ''}
              onSelectPart={setSelectedPartId}
              cameraState={cameraState}
              qualityMode={qualityMode}
              isRenderPaused={isRenderPaused}
              onFpsSample={handleFpsSample}
            />
          ) : (
            <svg
              className="stage-schematic-svg"
              viewBox="0 0 450 210"
              role="img"
              aria-label={`${t('stage.heading')}: ${lessonTitle}`}
            >
              <rect
                x="8"
                y="8"
                width="434"
                height="194"
                fill="#181c20"
                stroke="#0f6b4a"
                strokeWidth="2"
              />
              <line x1="24" y1="45" x2="426" y2="45" stroke="#323a42" strokeWidth="1" />
              <line x1="24" y1="165" x2="426" y2="165" stroke="#323a42" strokeWidth="1" />
              {parts.map((part, idx) => {
                const isSelected = part.id === activePart?.id;
                const boxWidth = 128;
                const boxX = 20 + idx * 138;
                const boxY = 66;
                const rawLabel = t(part.labelKey);
                const shortLabel = rawLabel.length > 18 ? `${rawLabel.slice(0, 17)}…` : rawLabel;
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
                      fontSize="10.5"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {effectiveFallback2d && (
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0', color: '#cfd6de' }}>
              {t('stage.fallback2dNotice')}
            </p>
          )}
        </div>

        <div className="stage-camera-bar">
          <span
            data-testid="camera-status-readout"
            data-distance={cameraState.distance}
            data-pan-x={cameraState.panX}
            data-pan-z={cameraState.panZ}
            data-azimuth={cameraState.azimuthAngle}
          >
            {t('stage.cameraStatusLabel', {
              distance: cameraState.distance,
              min: CAMERA_LIMITS.minDistance,
              max: CAMERA_LIMITS.maxDistance,
            })}
          </span>
          <div className="stage-controls-row">
            <button
              type="button"
              className="stage-btn"
              aria-label={t('stage.cameraZoomIn')}
              onClick={() => setCameraState((prev) => applyKeyboardCameraStep(prev, '+'))}
            >
              +
            </button>
            <button
              type="button"
              className="stage-btn"
              aria-label={t('stage.cameraZoomOut')}
              onClick={() => setCameraState((prev) => applyKeyboardCameraStep(prev, '-'))}
            >
              -
            </button>
            <button
              type="button"
              className="stage-btn"
              onClick={() => setCameraState(createInitialCameraState())}
            >
              {t('stage.cameraReset')}
            </button>
          </div>
        </div>

        {activePart && (
          <div
            className="stage-part-inspector"
            data-testid="selected-stage-part"
            aria-live="polite"
          >
            <h3>
              {t('stage.selectedPartHeading')}: {t(activePart.nameKey)}
            </h3>
            <p>
              <strong>{t('stage.selectedPartFunctionLabel')}:</strong> {t(activePart.functionKey)}
            </p>
          </div>
        )}

        <div className="stage-filter-row">
          <label htmlFor="stage-part-search" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {t('stage.quickSearchLabel')}:
          </label>
          <input
            id="stage-part-search"
            type="text"
            className="stage-search-input"
            value={partFilterQuery}
            placeholder={t('stage.quickSearchPlaceholder')}
            onChange={(e) => setPartFilterQuery(e.target.value)}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {t('stage.keyboardListLabel')}:
          </div>
          <div
            className="stage-keyboard-list"
            role="group"
            aria-label={t('stage.keyboardListLabel')}
          >
            {filteredParts.map((part) => {
              const isSelected = part.id === activePart?.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  className="stage-btn"
                  aria-pressed={isSelected}
                  aria-label={`${t(part.labelKey)} — ${t(part.nameKey)}`}
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
