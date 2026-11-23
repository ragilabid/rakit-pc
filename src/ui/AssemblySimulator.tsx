import { useEffect, useRef, useState } from 'react';
import beepData from '../content/beep-ami.json';
import componentsData from '../content/components.json';
import rulesData from '../content/rules.json';
import {
  acknowledgeEsdReminder,
  applyThermalPaste,
  buildCompleteValidAssembly,
  configureStandoffs,
  connectFrontPanel,
  connectMonitorCable,
  connectPowerCable,
  createAssemblyState,
  installCase,
  installCooler,
  installCpu,
  installGpu,
  installMotherboard,
  installPsu,
  installRam,
  installStorage,
  mountMotherboardToCase,
  removeRam,
  type AssemblyState,
} from '../domain/assembly';
import type { RuleViolation } from '../domain/compat';
import { evaluateDiagnosisAnswer, type DiagnosisFeedback } from '../domain/diagnosis';
import { simulatePost, type PostSimulationResult } from '../domain/post';
import { calculatePowerRequirement } from '../domain/power';
import { calculateAssemblyScore } from '../domain/scoring';
import type {
  AmiBeepEntry,
  CompatibilityRule,
  ComponentCatalog,
  MonitorTargetPort,
  RamSlotId,
} from '../domain/types';
import { t } from '../i18n';
import { useProgressStore } from '../store/useProgressStore';

const catalog = componentsData as unknown as ComponentCatalog;
const rules = rulesData as unknown as CompatibilityRule[];
const beepTable = beepData as unknown as AmiBeepEntry[];

const DIAGNOSIS_CODES = [
  'FRONT_PANEL_MISWIRED',
  'MISSING_ATX_24PIN',
  'STANDOFF_SHORT_CIRCUIT',
  'MISSING_CPU_8PIN',
  'PSU_WATTAGE_INSUFFICIENT',
  'MISSING_CPU',
  'MISSING_CPU_COOLER',
  'MISSING_RAM',
  'FAULTY_RAM',
  'MISSING_GPU_PCIE_POWER',
  'MONITOR_WRONG_PORT_MOTHERBOARD',
  'NO_BOOTABLE_DEVICE',
] as const;

interface AssemblySimulatorProps {
  assemblyState: AssemblyState;
  onChangeAssemblyState: (next: AssemblyState) => void;
  onPostStatusChange: (postSuccess: boolean | null) => void;
  onNavigate: (hash: string) => void;
}

export function AssemblySimulator({
  assemblyState,
  onChangeAssemblyState,
  onPostStatusChange,
  onNavigate,
}: AssemblySimulatorProps) {
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const setLastSimulationResult = useProgressStore((s) => s.setLastSimulationResult);

  const startTimeRef = useRef<number | null>(null);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setLiveElapsedSeconds(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [selectedMbId, setSelectedMbId] = useState<string>(catalog.motherboards[0]!.id);
  const [selectedCpuId, setSelectedCpuId] = useState<string>(catalog.cpus[0]!.id);
  const [cpuTriangleAligned, setCpuTriangleAligned] = useState<boolean>(true);
  const [selectedCoolerId, setSelectedCoolerId] = useState<string>(catalog.coolers[0]!.id);
  const [selectedRamId, setSelectedRamId] = useState<string>(catalog.rams[0]!.id);
  const [selectedRamSlot, setSelectedRamSlot] = useState<RamSlotId>('A2');
  const [ramNotchAligned, setRamNotchAligned] = useState<boolean>(true);
  const [selectedStorageId, setSelectedStorageId] = useState<string>(catalog.storages[0]!.id);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(catalog.cases[0]!.id);
  const [selectedPsuId, setSelectedPsuId] = useState<string>(catalog.psus[1]!.id);
  const [selectedGpuId, setSelectedGpuId] = useState<string>(catalog.gpus[0]!.id);

  const [latestRejection, setLatestRejection] = useState<RuleViolation | null>(null);
  const [postResult, setPostResult] = useState<PostSimulationResult | null>(null);
  const [selectedDiagnosisCode, setSelectedDiagnosisCode] = useState<string>('MISSING_RAM');
  const [diagnosisFeedback, setDiagnosisFeedback] = useState<DiagnosisFeedback | null>(null);

  const powerSummary = calculatePowerRequirement(assemblyState);

  const countCompletedSteps = (st: AssemblyState): number => {
    let count = 0;
    if (st.motherboard) count += 1;
    if (st.cpu) count += 1;
    if (st.thermalPasteApplied) count += 1;
    if (st.cooler) count += 1;
    if (Object.keys(st.ramModules).length > 0) count += 1;
    if (st.storage) count += 1;
    if (st.pcCase) count += 1;
    if (st.isMountedInCase) count += 1;
    if (st.psu) count += 1;
    if (st.powerCables.ATX_24PIN && st.powerCables.CPU_8PIN && st.frontPanel.connected) count += 1;
    return count;
  };

  const syncLiveResultToStore = (
    nextState: AssemblyState,
    latestRej: RuleViolation | null,
    simResult: PostSimulationResult | null,
  ) => {
    const startMs = startTimeRef.current ?? Date.now();
    const elapsedSeconds = Math.max(15, Math.round((Date.now() - startMs) / 1000));

    if (simResult) {
      const score = calculateAssemblyScore({
        isPostSuccess: simResult.success,
        elapsedSeconds,
        targetSeconds: 300,
        attempts: nextState.attempts,
        warningCount: simResult.warnings.length,
      });

      const feedbackItems: string[] = [];
      if (simResult.primaryIssue) {
        feedbackItems.push(
          `${simResult.primaryIssue.reason} (${simResult.primaryIssue.remediation})`,
        );
      }
      for (const w of simResult.warnings) {
        feedbackItems.push(`${w.reason} (${w.remediation})`);
      }
      for (const rej of nextState.physicalRejections.slice(-3)) {
        feedbackItems.push(`[Fisik] ${rej.reason}`);
      }
      if (feedbackItems.length === 0) {
        feedbackItems.push(t('results.feedbackItem1'));
        feedbackItems.push(t('results.feedbackItem2'));
      }

      setLastSimulationResult({
        isPostSuccess: simResult.success,
        postStatus: simResult.status,
        beepPattern: simResult.beep ? simResult.beep.pattern : null,
        totalScore: score.totalScore,
        resultScore: score.resultScore,
        timeScore: score.timeScore,
        attemptScore: score.attemptScore,
        warningPenalty: score.warningPenalty,
        elapsedSeconds,
        attempts: nextState.attempts,
        feedbackItems,
      });
      return;
    }

    // Jika sedang merakit (belum menekan tombol POST), hitung progres komponen secara dinamis
    const stepsDone = countCompletedSteps(nextState);
    const partialResultScore = Math.round((stepsDone / 10) * 30);
    const extraAttempts = Math.max(0, nextState.attempts - 1);
    const partialAttemptScore = stepsDone > 0 ? Math.max(4, 20 - extraAttempts * 5) : 0;
    const partialFeedback: string[] = [];

    if (latestRej) {
      partialFeedback.push(
        `[Fisik - ${latestRej.code}] ${latestRej.reason} (${latestRej.remediation})`,
      );
    }
    for (const rej of nextState.physicalRejections.slice(-3)) {
      const msg = `[Fisik] ${rej.reason}`;
      if (!partialFeedback.includes(msg)) {
        partialFeedback.push(msg);
      }
    }
    partialFeedback.push(
      `Progres perakitan komponen: ${stepsDone}/10 tahap selesai. Klik "Nyalakan PC (Simulasi POST)" pada langkah 9 untuk menguji POST dan memperoleh skor penuh.`,
    );

    setLastSimulationResult({
      isPostSuccess: false,
      postStatus: `MERAKIT (${stepsDone}/10)`,
      beepPattern: null,
      totalScore: partialResultScore + partialAttemptScore,
      resultScore: partialResultScore,
      timeScore: 0,
      attemptScore: partialAttemptScore,
      warningPenalty: 0,
      elapsedSeconds,
      attempts: nextState.attempts,
      feedbackItems: partialFeedback,
    });
  };

  const applyAction = (result: {
    ok: boolean;
    state: AssemblyState;
    rejection?: RuleViolation;
  }) => {
    onChangeAssemblyState(result.state);
    const nextRej = !result.ok && result.rejection ? result.rejection : null;
    setLatestRejection(nextRej);
    setPostResult(null);
    setDiagnosisFeedback(null);
    onPostStatusChange(null);
    syncLiveResultToStore(result.state, nextRej, null);
  };

  const handleResetBench = () => {
    startTimeRef.current = Date.now();
    setLiveElapsedSeconds(0);
    onChangeAssemblyState(createAssemblyState());
    setLatestRejection(null);
    setPostResult(null);
    setDiagnosisFeedback(null);
    onPostStatusChange(null);
    setLastSimulationResult(null);
  };

  const handleAutoAssembleValid = () => {
    const validState = buildCompleteValidAssembly(catalog, rules);
    onChangeAssemblyState(validState);
    setLatestRejection(null);
    setPostResult(null);
    setDiagnosisFeedback(null);
    onPostStatusChange(null);
    syncLiveResultToStore(validState, null, null);
  };

  const handlePowerOnPost = () => {
    // Seluruh logika POST & skor dihitung oleh mesin domain murni (src/domain/post & src/domain/scoring)
    const simResult = simulatePost(assemblyState, rules, beepTable);
    setPostResult(simResult);
    setDiagnosisFeedback(null);
    onPostStatusChange(simResult.success);

    syncLiveResultToStore(assemblyState, latestRejection, simResult);

    if (simResult.success) {
      completeLesson('rakit-pc');
    } else if (simResult.primaryIssue) {
      setSelectedDiagnosisCode(simResult.primaryIssue.code);
    }
  };

  const handleCheckDiagnosis = () => {
    if (!postResult) return;
    const fb = evaluateDiagnosisAnswer(postResult, selectedDiagnosisCode);
    setDiagnosisFeedback(fb);
    if (fb.correct) {
      completeLesson('diagnosis-bip');
    }
  };

  const installedRamSlots = Object.entries(assemblyState.ramModules) as [
    RamSlotId,
    NonNullable<AssemblyState['ramModules'][RamSlotId]>,
  ][];

  return (
    <div className="simulator-workbench" data-testid="assembly-simulator">
      {/* Pengingat Keselamatan ESD / K3 (Tidak Memblokir) */}
      <div className="notice-banner notice-warn" data-testid="esd-reminder-box">
        <p style={{ margin: '0 0 0.5rem 0' }}>{assemblyState.esdReminderText}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={() => onChangeAssemblyState(acknowledgeEsdReminder(assemblyState))}
          >
            {t('simulator.esdAcknowledgeButton')}
          </button>
          {assemblyState.esdAcknowledged && (
            <span className="status-tag status-tag-done" data-testid="esd-acknowledged-badge">
              {t('simulator.esdAcknowledgedBadge')}
            </span>
          )}
        </div>
      </div>

      {/* Ringkasan Daya, Waktu, & Percobaan */}
      <div className="simulator-status-strip">
        <span data-testid="power-meter-readout">
          {t('simulator.powerMeterLabel', {
            required: powerSummary.requiredWatts,
            psu: powerSummary.psuWattage,
          })}
        </span>
        <span data-testid="attempts-counter">
          {t('simulator.attemptsCounterLabel', { attempts: assemblyState.attempts })}
        </span>
        <span data-testid="elapsed-timer-readout">
          {t('simulator.elapsedTimerLabel', {
            time: `${String(Math.floor(liveElapsedSeconds / 60)).padStart(2, '0')}:${String(
              liveElapsedSeconds % 60,
            ).padStart(2, '0')}`,
          })}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn"
            data-testid="auto-assemble-valid-btn"
            onClick={handleAutoAssembleValid}
          >
            {t('simulator.autoAssembleValidButton')}
          </button>
          <button
            type="button"
            className="btn"
            data-testid="reset-bench-btn"
            onClick={handleResetBench}
          >
            {t('simulator.resetBenchButton')}
          </button>
        </div>
      </div>

      {/* Kotak Umpan Balik Penolakan FISIK (Tingkat 1 — Ditolak Langsung) */}
      {latestRejection && (
        <div
          className="notice-banner notice-error"
          role="alert"
          data-testid="physical-rejection-alert"
          data-rejection-code={latestRejection.code}
        >
          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>
            {t('simulator.physicalRejectionHeading')} [{latestRejection.code}]
          </p>
          <p style={{ margin: '0 0 0.25rem 0' }}>{latestRejection.reason}</p>
          <p style={{ margin: 0 }}>
            <strong>{t('simulator.remediationLabel')}:</strong> {latestRejection.remediation}
          </p>
        </div>
      )}

      {/* Langkah 1: Motherboard */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step1Heading')}
        </h3>
        <div className="simulator-controls-row">
          <label htmlFor="sim-mb-select">{t('simulator.selectMotherboardLabel')}:</label>
          <select
            id="sim-mb-select"
            className="control-select"
            value={selectedMbId}
            onChange={(e) => setSelectedMbId(e.target.value)}
          >
            {catalog.motherboards.map((mb) => (
              <option key={mb.id} value={mb.id}>
                {mb.name} ({mb.socket}, {mb.ramType}, {mb.formFactor})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-motherboard-btn"
            onClick={() => {
              const mb = catalog.motherboards.find((m) => m.id === selectedMbId)!;
              applyAction(installMotherboard(assemblyState, mb));
            }}
          >
            {t('simulator.installMotherboardButton')}
          </button>
          {assemblyState.motherboard && (
            <span className="status-tag status-tag-done" data-testid="installed-mb-badge">
              {assemblyState.motherboard.name}
            </span>
          )}
        </div>
      </div>

      {/* Langkah 2: CPU */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step2Heading')}
        </h3>
        <div className="simulator-controls-row">
          <label htmlFor="sim-cpu-select">{t('simulator.selectCpuLabel')}:</label>
          <select
            id="sim-cpu-select"
            className="control-select"
            value={selectedCpuId}
            onChange={(e) => setSelectedCpuId(e.target.value)}
          >
            {catalog.cpus.map((cpu) => (
              <option key={cpu.id} value={cpu.id}>
                {cpu.name} ({cpu.socket}, {cpu.tdpWatts} W)
              </option>
            ))}
          </select>

          <label htmlFor="sim-cpu-orientation">{t('simulator.cpuOrientationLabel')}:</label>
          <select
            id="sim-cpu-orientation"
            className="control-select"
            value={cpuTriangleAligned ? 'aligned' : 'misaligned'}
            onChange={(e) => setCpuTriangleAligned(e.target.value === 'aligned')}
          >
            <option value="aligned">{t('simulator.orientationAligned')}</option>
            <option value="misaligned">{t('simulator.orientationMisaligned')}</option>
          </select>

          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-cpu-btn"
            onClick={() => {
              const cpu = catalog.cpus.find((c) => c.id === selectedCpuId)!;
              applyAction(
                installCpu(assemblyState, cpu, { triangleAligned: cpuTriangleAligned }, rules),
              );
            }}
          >
            {t('simulator.installCpuButton')}
          </button>
          {assemblyState.cpu && (
            <span className="status-tag status-tag-done" data-testid="installed-cpu-badge">
              {assemblyState.cpu.name}
            </span>
          )}
        </div>
      </div>

      {/* Langkah 3: Pasta Termal & Pendingin CPU */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step3Heading')}
        </h3>
        <div className="simulator-controls-row">
          <button
            type="button"
            className="btn"
            data-testid="apply-paste-btn"
            onClick={() => applyAction(applyThermalPaste(assemblyState))}
          >
            {t('simulator.applyPasteButton')}
          </button>
          {assemblyState.thermalPasteApplied && (
            <span className="status-tag status-tag-done" data-testid="paste-applied-badge">
              {t('simulator.pasteAppliedBadge')}
            </span>
          )}

          <label htmlFor="sim-cooler-select">{t('simulator.selectCoolerLabel')}:</label>
          <select
            id="sim-cooler-select"
            className="control-select"
            value={selectedCoolerId}
            onChange={(e) => setSelectedCoolerId(e.target.value)}
          >
            {catalog.coolers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-cooler-btn"
            onClick={() => {
              const cooler = catalog.coolers.find((c) => c.id === selectedCoolerId)!;
              applyAction(installCooler(assemblyState, cooler));
            }}
          >
            {t('simulator.installCoolerButton')}
          </button>
          {assemblyState.cooler && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                applyAction({
                  ok: true,
                  state: { ...assemblyState, cooler: null },
                })
              }
            >
              {t('simulator.removeCoolerButton')}
            </button>
          )}
        </div>
      </div>

      {/* Langkah 4: RAM (Pasang & Lepas Berulang Tanpa Komponen Ganda) */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step4Heading')}
        </h3>
        <div className="simulator-controls-row">
          <label htmlFor="sim-ram-select">{t('simulator.selectRamLabel')}:</label>
          <select
            id="sim-ram-select"
            className="control-select"
            value={selectedRamId}
            onChange={(e) => setSelectedRamId(e.target.value)}
          >
            {catalog.rams.map((ram) => (
              <option key={ram.id} value={ram.id}>
                {ram.name} ({ram.ramType}, {ram.capacityGb} GB)
              </option>
            ))}
          </select>

          <label htmlFor="sim-ram-slot">{t('simulator.selectRamSlotLabel')}:</label>
          <select
            id="sim-ram-slot"
            className="control-select"
            value={selectedRamSlot}
            onChange={(e) => setSelectedRamSlot(e.target.value as RamSlotId)}
          >
            {(['A1', 'A2', 'B1', 'B2'] as RamSlotId[]).map((slot) => (
              <option key={slot} value={slot}>
                Slot {slot}
              </option>
            ))}
          </select>

          <label htmlFor="sim-ram-orientation">{t('simulator.ramOrientationLabel')}:</label>
          <select
            id="sim-ram-orientation"
            className="control-select"
            value={ramNotchAligned ? 'aligned' : 'reversed'}
            onChange={(e) => setRamNotchAligned(e.target.value === 'aligned')}
          >
            <option value="aligned">{t('simulator.ramNotchAligned')}</option>
            <option value="reversed">{t('simulator.ramNotchReversed')}</option>
          </select>

          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-ram-btn"
            onClick={() => {
              const ram = catalog.rams.find((r) => r.id === selectedRamId)!;
              applyAction(
                installRam(
                  assemblyState,
                  ram,
                  selectedRamSlot,
                  { notchAligned: ramNotchAligned },
                  rules,
                ),
              );
            }}
          >
            {t('simulator.installRamButton')}
          </button>
        </div>

        <div style={{ marginTop: '0.5rem' }} data-testid="installed-ram-list">
          <strong>{t('simulator.installedRamHeading')}</strong>{' '}
          {installedRamSlots.length === 0 ? (
            <span>{t('simulator.emptyRamNotice')}</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
              {installedRamSlots.map(([slot, ram]) => (
                <span
                  key={slot}
                  className="status-tag status-tag-done"
                  data-testid={`ram-slot-chip-${slot}`}
                >
                  {slot}: {ram.name}{' '}
                  <button
                    type="button"
                    data-testid={`remove-ram-${slot}`}
                    style={{
                      marginLeft: '0.35rem',
                      background: '#ffffff',
                      color: '#14181d',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => applyAction(removeRam(assemblyState, slot))}
                  >
                    {t('simulator.removeRamButton')} {slot}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Langkah 5: Penyimpanan */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step5Heading')}
        </h3>
        <div className="simulator-controls-row">
          <label htmlFor="sim-storage-select">{t('simulator.selectStorageLabel')}:</label>
          <select
            id="sim-storage-select"
            className="control-select"
            value={selectedStorageId}
            onChange={(e) => setSelectedStorageId(e.target.value)}
          >
            {catalog.storages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-storage-btn"
            onClick={() => {
              const ssd = catalog.storages.find((s) => s.id === selectedStorageId)!;
              applyAction(installStorage(assemblyState, ssd));
            }}
          >
            {t('simulator.installStorageButton')}
          </button>
          {assemblyState.storage && (
            <span className="status-tag status-tag-done">{assemblyState.storage.name}</span>
          )}
        </div>
      </div>

      {/* Langkah 6: Casing, Standoff, & Pasang Motherboard ke Casing */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step6Heading')}
        </h3>
        <div className="simulator-controls-row">
          <label htmlFor="sim-case-select">{t('simulator.selectCaseLabel')}:</label>
          <select
            id="sim-case-select"
            className="control-select"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
          >
            {catalog.cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.supportedFormFactors.join(', ')})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn"
            data-testid="install-case-btn"
            onClick={() => {
              const pcCase = catalog.cases.find((c) => c.id === selectedCaseId)!;
              applyAction(installCase(assemblyState, pcCase));
            }}
          >
            {t('simulator.installCaseButton')}
          </button>

          <label htmlFor="sim-standoff-select">{t('simulator.standoffAlignmentLabel')}:</label>
          <select
            id="sim-standoff-select"
            className="control-select"
            value={assemblyState.standoffsAligned ? 'aligned' : 'misaligned'}
            onChange={(e) =>
              applyAction(configureStandoffs(assemblyState, e.target.value === 'aligned'))
            }
          >
            <option value="aligned">{t('simulator.standoffAligned')}</option>
            <option value="misaligned">{t('simulator.standoffMisaligned')}</option>
          </select>

          <button
            type="button"
            className="btn btn-primary"
            data-testid="mount-board-btn"
            onClick={() => applyAction(mountMotherboardToCase(assemblyState, rules))}
          >
            {t('simulator.mountBoardButton')}
          </button>
          {assemblyState.isMountedInCase && (
            <span className="status-tag status-tag-done" data-testid="mounted-in-case-badge">
              {t('simulator.mountedBadge')}
            </span>
          )}
        </div>
      </div>

      {/* Langkah 7: PSU & GPU */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step7Heading')}
        </h3>
        <div className="simulator-controls-row">
          <label htmlFor="sim-psu-select">{t('simulator.selectPsuLabel')}:</label>
          <select
            id="sim-psu-select"
            className="control-select"
            value={selectedPsuId}
            onChange={(e) => setSelectedPsuId(e.target.value)}
          >
            {catalog.psus.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.wattage} W)
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-psu-btn"
            onClick={() => {
              const psu = catalog.psus.find((p) => p.id === selectedPsuId)!;
              applyAction(installPsu(assemblyState, psu));
            }}
          >
            {t('simulator.installPsuButton')}
          </button>

          <label htmlFor="sim-gpu-select">{t('simulator.selectGpuLabel')}:</label>
          <select
            id="sim-gpu-select"
            className="control-select"
            value={selectedGpuId}
            onChange={(e) => setSelectedGpuId(e.target.value)}
          >
            {catalog.gpus.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.tdpWatts} W)
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="install-gpu-btn"
            onClick={() => {
              const gpu = catalog.gpus.find((g) => g.id === selectedGpuId)!;
              applyAction(installGpu(assemblyState, gpu));
            }}
          >
            {t('simulator.installGpuButton')}
          </button>
        </div>
      </div>

      {/* Langkah 8: Kabel Daya, Front Panel, & Monitor */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step8Heading')}
        </h3>
        <div className="simulator-cables-grid">
          <label className="cable-checkbox-label">
            <input
              type="checkbox"
              data-testid="cable-atx24-checkbox"
              checked={assemblyState.powerCables.ATX_24PIN}
              onChange={(e) =>
                applyAction(connectPowerCable(assemblyState, 'ATX_24PIN', e.target.checked))
              }
            />
            {t('simulator.cableAtx24')}
          </label>

          <label className="cable-checkbox-label">
            <input
              type="checkbox"
              data-testid="cable-cpu8-checkbox"
              checked={assemblyState.powerCables.CPU_8PIN}
              onChange={(e) =>
                applyAction(connectPowerCable(assemblyState, 'CPU_8PIN', e.target.checked))
              }
            />
            {t('simulator.cableCpu8')}
          </label>

          <label className="cable-checkbox-label">
            <input
              type="checkbox"
              data-testid="cable-pcie8-checkbox"
              checked={assemblyState.powerCables.PCIE_8PIN}
              onChange={(e) =>
                applyAction(connectPowerCable(assemblyState, 'PCIE_8PIN', e.target.checked))
              }
            />
            {t('simulator.cablePcie8')}
          </label>

          <label className="cable-checkbox-label">
            <input
              type="checkbox"
              data-testid="cable-frontpanel-checkbox"
              checked={
                assemblyState.frontPanel.connected && assemblyState.frontPanel.pinAlignedCorrectly
              }
              onChange={(e) =>
                applyAction(
                  connectFrontPanel(assemblyState, {
                    connected: e.target.checked,
                    pinAlignedCorrectly: true,
                  }),
                )
              }
            />
            {t('simulator.cableFrontPanel')}
          </label>
        </div>

        <div className="simulator-controls-row" style={{ marginTop: '0.5rem' }}>
          <label htmlFor="sim-monitor-port">{t('simulator.monitorPortLabel')}</label>
          <select
            id="sim-monitor-port"
            className="control-select"
            value={assemblyState.monitorConnectedTo ?? 'GPU'}
            onChange={(e) =>
              applyAction(connectMonitorCable(assemblyState, e.target.value as MonitorTargetPort))
            }
          >
            <option value="GPU">{t('simulator.monitorPortGpu')}</option>
            <option value="MOTHERBOARD">{t('simulator.monitorPortMotherboard')}</option>
          </select>
        </div>
      </div>

      {/* Langkah 9: Nyalakan PC (Simulasi POST & Diagnosis Kode Bip AMI) */}
      <div className="simulator-step-box">
        <h3 className="group-heading" style={{ marginTop: 0 }}>
          {t('simulator.step9Heading')}
        </h3>
        <div className="simulator-controls-row">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="power-on-post-btn"
            onClick={handlePowerOnPost}
          >
            {t('simulator.powerOnButton')}
          </button>
          {postResult && (
            <button
              type="button"
              className="btn"
              data-testid="open-teacher-results-btn"
              onClick={() => onNavigate('#hasil')}
            >
              {t('simulator.viewTeacherResultButton')}
            </button>
          )}
        </div>

        {postResult && postResult.success && (
          <div
            className="notice-banner"
            style={{
              marginTop: '0.75rem',
              border: '1px solid var(--color-accent-pcb)',
              backgroundColor: '#e6f4ee',
              color: '#0b4f36',
            }}
            data-testid="post-success-banner"
          >
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>
              {t('simulator.logicalPostSuccessHeading')}
            </p>
            {postResult.beep && (
              <p style={{ margin: '0 0 0.25rem 0', fontFamily: 'var(--font-mono)' }}>
                {t('simulator.amiBeepLabel')}: {postResult.beep.pattern} — {postResult.beep.meaning}
              </p>
            )}
            {postResult.warnings.length > 0 && (
              <div style={{ marginTop: '0.5rem' }} data-testid="post-warnings-list">
                <strong>{t('simulator.warningsHeading')}</strong>
                <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                  {postResult.warnings.map((w) => (
                    <li key={w.code}>
                      [{w.code}] {w.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {postResult && !postResult.success && postResult.primaryIssue && (
          <div
            className="notice-banner notice-error"
            style={{ marginTop: '0.75rem' }}
            role="alert"
            data-testid="post-failure-banner"
            data-issue-code={postResult.primaryIssue.code}
          >
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>
              {t('simulator.logicalPostFailureHeading')} [{postResult.primaryIssue.code}]
            </p>
            <p style={{ margin: '0 0 0.25rem 0', fontFamily: 'var(--font-mono)' }}>
              {t('simulator.amiBeepLabel')}:{' '}
              {postResult.beep
                ? `${postResult.beep.pattern} (${postResult.beep.meaning})`
                : t('simulator.noBeepLabel')}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>{postResult.primaryIssue.reason}</p>
            <p style={{ margin: 0 }}>
              <strong>{t('simulator.remediationLabel')}:</strong>{' '}
              {postResult.primaryIssue.remediation}
            </p>

            {/* Panel Latihan Diagnosis Siswa dengan Umpan Balik Penjelas */}
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border-line)',
              }}
              data-testid="diagnosis-practice-panel"
            >
              <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600 }}>
                {t('simulator.diagnosisSectionHeading')}
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{t('simulator.diagnosisPrompt')}</p>
              <div className="simulator-controls-row">
                <label htmlFor="sim-diagnosis-select">{t('simulator.diagnosisSelectLabel')}:</label>
                <select
                  id="sim-diagnosis-select"
                  className="control-select"
                  value={selectedDiagnosisCode}
                  onChange={(e) => setSelectedDiagnosisCode(e.target.value)}
                >
                  {DIAGNOSIS_CODES.map((code) => (
                    <option key={code} value={code}>
                      {t(`simulator.diagnosisOptions.${code}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  data-testid="check-diagnosis-btn"
                  onClick={handleCheckDiagnosis}
                >
                  {t('simulator.diagnosisCheckButton')}
                </button>
              </div>

              {diagnosisFeedback && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: diagnosisFeedback.correct ? '#e6f4ee' : '#fff3d6',
                    color: '#14181d',
                    border: '1px solid var(--color-border-line)',
                  }}
                  data-testid="diagnosis-feedback-box"
                  data-correct={String(diagnosisFeedback.correct)}
                >
                  <p style={{ margin: 0 }}>{diagnosisFeedback.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
