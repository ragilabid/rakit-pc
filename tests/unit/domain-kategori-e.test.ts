import { describe, expect, it } from 'vitest';
import componentsData from '../../src/content/components.json';
import rulesData from '../../src/content/rules.json';
import beepData from '../../src/content/beep-ami.json';
import type { AmiBeepEntry, CompatibilityRule, ComponentCatalog } from '../../src/domain/types';
import {
  buildCompleteValidAssembly,
  connectMonitorCable,
  connectPowerCable,
} from '../../src/domain/assembly';
import { simulatePost } from '../../src/domain/post';
import { evaluateDiagnosisAnswer, getActiveDiagnosisIssue } from '../../src/domain/diagnosis';

const catalog = componentsData as unknown as ComponentCatalog;
const rules = rulesData as unknown as CompatibilityRule[];
const beepTable = beepData as unknown as AmiBeepEntry[];

describe('Kategori E — Pemecahan Masalah dan Kode Bunyi AMI (KU-53 s.d. KU-57)', () => {
  it('[KU-53] satu bunyi bip pendek pada simulasi POST normal dinyatakan boot normal', () => {
    const state = buildCompleteValidAssembly(catalog, rules);
    const postResult = simulatePost(state, rules, beepTable);

    expect(postResult.success).toBe(true);
    expect(postResult.status).toBe('BOOT_SUCCESS');
    expect(postResult.beep?.beepCount).toBe(1);
    expect(postResult.beep?.toneType).toBe('SHORT');
    expect(postResult.beep?.targetComponent).toBe('NORMAL');
  });

  it('[KU-54] bunyi bip berulang saat RAM tidak terdeteksi mengarahkan diagnosis ke RAM (standar AMI)', () => {
    const base = buildCompleteValidAssembly(catalog, rules);
    const withoutRam = { ...base, ramModules: {} };

    const postResult = simulatePost(withoutRam, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.beep?.id).toBe('ami-ram-missing-or-faulty');
    expect(postResult.beep?.targetComponent).toBe('RAM');

    const activeIssue = getActiveDiagnosisIssue(postResult);
    expect(activeIssue?.relatedComponent).toBe('RAM');
  });

  it('[KU-55] tidak ada tampilan karena kabel monitor ke port motherboard memberi petunjuk colok ke GPU', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    // CPU i5-13400F (tanpa iGPU) + GPU дискрит RTX 4060 terpasang, tapi monitor dicolok ke port motherboard
    const cpuNoIgpu = catalog.cpus.find((c) => c.id === 'cpu-i5-13400f')!;
    const mbLga = catalog.motherboards.find((m) => m.id === 'mb-b760-atx-ddr5')!;
    state = {
      ...state,
      motherboard: mbLga,
      cpu: cpuNoIgpu,
    };
    state = connectMonitorCable(state, 'MOTHERBOARD').state;

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.status).toBe('NO_DISPLAY');
    expect(postResult.primaryIssue?.code).toBe('MONITOR_WRONG_PORT_MOTHERBOARD');
    expect(postResult.primaryIssue?.remediation.toLowerCase()).toContain('gpu');
    expect(postResult.primaryIssue?.remediation.toLowerCase()).toContain('motherboard');
  });

  it('[KU-56] jawaban diagnosis salah memberikan umpan balik yang menjelaskan mengapa keliru dan petunjuk yang benar', () => {
    const base = buildCompleteValidAssembly(catalog, rules);
    const withoutRam = { ...base, ramModules: {} };
    const postResult = simulatePost(withoutRam, rules, beepTable);

    // Siswa salah menebak penyebabnya adalah PSU, padahal masalahnya RAM
    const feedback = evaluateDiagnosisAnswer(postResult, 'PSU_WATTAGE_INSUFFICIENT');
    expect(feedback.correct).toBe(false);
    expect(feedback.explanation).not.toBe('Salah');
    expect(feedback.explanation.length).toBeGreaterThan(25);
    expect(feedback.whyWrong.toLowerCase()).toContain('daya');
    expect(feedback.hint.toLowerCase()).toContain('ram');

    // Siswa memilih jawaban yang benar
    const rightFeedback = evaluateDiagnosisAnswer(postResult, 'MISSING_RAM');
    expect(rightFeedback.correct).toBe(true);
  });

  it('[KU-57] beberapa penyebab sekaligus (RAM rusak dan kabel daya lepas) dilaporkan satu per satu', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    const faultyRam = catalog.rams.find((r) => r.id === 'ram-ddr5-16gb-rusak')!;

    // Dua masalah sekaligus: 1) kabel 24-pin lepas, 2) RAM rusak
    state = connectPowerCable(state, 'ATX_24PIN', false).state;
    state = {
      ...state,
      ramModules: { A2: faultyRam },
    };

    // Pemeriksaan pertama: hanya melaporkan masalah pertama (kabel daya 24-pin lepas)
    const firstPost = simulatePost(state, rules, beepTable);
    expect(firstPost.success).toBe(false);
    expect(firstPost.reportedIssues).toHaveLength(1);
    expect(firstPost.primaryIssue?.code).toBe('MISSING_ATX_24PIN');

    // Setelah kabel 24-pin dipasang, barulah masalah berikutnya (RAM rusak) dilaporkan
    state = connectPowerCable(state, 'ATX_24PIN', true).state;
    const secondPost = simulatePost(state, rules, beepTable);
    expect(secondPost.success).toBe(false);
    expect(secondPost.reportedIssues).toHaveLength(1);
    expect(secondPost.primaryIssue?.code).toBe('FAULTY_RAM');
    expect(secondPost.beep?.targetComponent).toBe('RAM');
  });
});
