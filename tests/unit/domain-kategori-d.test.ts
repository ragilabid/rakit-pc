import { describe, expect, it } from 'vitest';
import componentsData from '../../src/content/components.json';
import rulesData from '../../src/content/rules.json';
import beepData from '../../src/content/beep-ami.json';
import type { AmiBeepEntry, CompatibilityRule, ComponentCatalog } from '../../src/domain/types';
import {
  createAssemblyState,
  installCase,
  installCooler,
  installCpu,
  installMotherboard,
  installRam,
  installStorage,
  applyThermalPaste,
  configureStandoffs,
  mountMotherboardToCase,
  connectPowerCable,
  connectFrontPanel,
  removeRam,
  acknowledgeEsdReminder,
  buildCompleteValidAssembly,
} from '../../src/domain/assembly';
import { calculatePowerRequirement } from '../../src/domain/power';
import { simulatePost } from '../../src/domain/post';
import { calculateAssemblyScore } from '../../src/domain/scoring';

const catalog = componentsData as unknown as ComponentCatalog;
const rules = rulesData as unknown as CompatibilityRule[];
const beepTable = beepData as unknown as AmiBeepEntry[];

const findById = <T extends { id: string }>(list: T[], id: string): T => {
  const found = list.find((item) => item.id === id);
  if (!found) throw new Error(`Komponen ${id} tidak ditemukan`);
  return found;
};

describe('Kategori D — Simulasi Perakitan (KU-30 s.d. KU-52)', () => {
  it('[KU-30] rakitan benar sesuai urutan dinyatakan berhasil dan simulasi POST sukses', () => {
    const state = buildCompleteValidAssembly(catalog, rules);

    expect(state.physicalRejections).toHaveLength(0);
    expect(state.isMountedInCase).toBe(true);

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(true);
    expect(postResult.status).toBe('BOOT_SUCCESS');
    expect(postResult.beep?.id).toBe('ami-normal-post');
    expect(postResult.primaryIssue).toBeNull();
  });

  it('[KU-31] soket CPU tidak cocok ditolak dengan alasan jelas (AM5 ke LGA1700)', () => {
    let state = createAssemblyState();
    const mbLga1700 = findById(catalog.motherboards, 'mb-b760-atx-ddr5');
    const cpuAm5 = findById(catalog.cpus, 'cpu-ryzen5-7600');

    const mbRes = installMotherboard(state, mbLga1700);
    state = mbRes.state;

    const cpuRes = installCpu(state, cpuAm5, { triangleAligned: true }, rules);
    expect(cpuRes.ok).toBe(false);
    expect(cpuRes.rejection?.code).toBe('CPU_SOCKET_MISMATCH');
    expect(cpuRes.rejection?.level).toBe('PHYSICAL');
    expect(cpuRes.rejection?.reason.toLowerCase()).toContain('soket');
    expect(cpuRes.state.cpu).toBeNull();
  });

  it('[KU-32] tipe RAM tidak cocok (DDR4 ke slot DDR5) ditolak dengan penjelasan notch berbeda', () => {
    let state = createAssemblyState();
    const mbAm5Ddr5 = findById(catalog.motherboards, 'mb-b650-atx');
    const cpuAm5 = findById(catalog.cpus, 'cpu-ryzen5-7600');
    const cooler = findById(catalog.coolers, 'cooler-tower-universal');
    const ramDdr4 = findById(catalog.rams, 'ram-ddr4-16gb');

    state = installMotherboard(state, mbAm5Ddr5).state;
    state = installCpu(state, cpuAm5, { triangleAligned: true }, rules).state;
    state = applyThermalPaste(state).state;
    state = installCooler(state, cooler).state;

    const ramRes = installRam(state, ramDdr4, 'A2', { notchAligned: true }, rules);
    expect(ramRes.ok).toBe(false);
    expect(ramRes.rejection?.code).toBe('RAM_TYPE_MISMATCH');
    expect(ramRes.rejection?.level).toBe('PHYSICAL');
    expect(ramRes.rejection?.reason.toLowerCase()).toContain('notch');
  });

  it('[KU-33] orientasi CPU salah (segitiga penanda tidak sejajar) ditolak', () => {
    let state = createAssemblyState();
    const mbAm5 = findById(catalog.motherboards, 'mb-b650-atx');
    const cpuAm5 = findById(catalog.cpus, 'cpu-ryzen5-7600');

    state = installMotherboard(state, mbAm5).state;
    const cpuRes = installCpu(state, cpuAm5, { triangleAligned: false }, rules);

    expect(cpuRes.ok).toBe(false);
    expect(cpuRes.rejection?.code).toBe('CPU_ORIENTATION_INVALID');
    expect(cpuRes.rejection?.reason.toLowerCase()).toContain('segitiga');
    expect(cpuRes.state.cpu).toBeNull();
  });

  it('[KU-34] RAM dipasang terbalik (notch tidak searah) ditolak dan muncul petunjuk', () => {
    let state = createAssemblyState();
    const mbAm5 = findById(catalog.motherboards, 'mb-b650-atx');
    const cpuAm5 = findById(catalog.cpus, 'cpu-ryzen5-7600');
    const cooler = findById(catalog.coolers, 'cooler-tower-universal');
    const ramDdr5 = findById(catalog.rams, 'ram-ddr5-16gb');

    state = installMotherboard(state, mbAm5).state;
    state = installCpu(state, cpuAm5, { triangleAligned: true }, rules).state;
    state = applyThermalPaste(state).state;
    state = installCooler(state, cooler).state;

    const ramRes = installRam(state, ramDdr5, 'A2', { notchAligned: false }, rules);
    expect(ramRes.ok).toBe(false);
    expect(ramRes.rejection?.code).toBe('RAM_ORIENTATION_REVERSED');
    expect(ramRes.rejection?.remediation.length).toBeGreaterThan(10);
  });

  it('[KU-35] form factor tidak muat (motherboard ATX ke casing Mini-ITX) ditolak secara fisik', () => {
    let state = createAssemblyState();
    const mbAtx = findById(catalog.motherboards, 'mb-b650-atx');
    const cpuAm5 = findById(catalog.cpus, 'cpu-ryzen5-7600');
    const cooler = findById(catalog.coolers, 'cooler-tower-universal');
    const ramDdr5 = findById(catalog.rams, 'ram-ddr5-16gb');
    const ssd = findById(catalog.storages, 'ssd-nvme-512-os');
    const caseMiniItx = findById(catalog.cases, 'case-mini-itx');

    state = installMotherboard(state, mbAtx).state;
    state = installCpu(state, cpuAm5, { triangleAligned: true }, rules).state;
    state = applyThermalPaste(state).state;
    state = installCooler(state, cooler).state;
    state = installRam(state, ramDdr5, 'A2', { notchAligned: true }, rules).state;
    state = installStorage(state, ssd).state;
    state = installCase(state, caseMiniItx).state;
    state = configureStandoffs(state, true).state;

    const mountRes = mountMotherboardToCase(state, rules);
    expect(mountRes.ok).toBe(false);
    expect(mountRes.rejection?.code).toBe('FORM_FACTOR_INCOMPATIBLE');
    expect(mountRes.rejection?.level).toBe('PHYSICAL');
    expect(mountRes.state.isMountedInCase).toBe(false);
  });

  it('[KU-36] daya PSU kurang (kebutuhan 650 W, PSU 450 W) gagal menyala saat POST', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    const cpuHigh = findById(catalog.cpus, 'cpu-i9-13900k'); // 250W
    const mbLga = findById(catalog.motherboards, 'mb-b760-atx-ddr5'); // 50W
    const gpuHigh = findById(catalog.gpus, 'gpu-high-power-320w'); // 320W
    const psu450 = findById(catalog.psus, 'psu-450w');

    state = {
      ...state,
      motherboard: mbLga,
      cpu: cpuHigh,
      gpu: gpuHigh,
      psu: psu450,
    };

    const powerSummary = calculatePowerRequirement(state);
    expect(powerSummary.requiredWatts).toBe(650);
    expect(powerSummary.psuWattage).toBe(450);

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.primaryIssue?.code).toBe('PSU_WATTAGE_INSUFFICIENT');
  });

  it('[KU-37] daya PSU hanya sedikit di atas kebutuhan memberi peringatan tanpa cadangan', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    const cpuHigh = findById(catalog.cpus, 'cpu-i9-13900k'); // 250W
    const mbLga = findById(catalog.motherboards, 'mb-b760-atx-ddr5'); // 50W
    const gpuHigh = findById(catalog.gpus, 'gpu-high-power-320w'); // 320W
    const psu650 = findById(catalog.psus, 'psu-650w'); // 650W == tepat 650W (selisih 0W)

    state = {
      ...state,
      motherboard: mbLga,
      cpu: cpuHigh,
      gpu: gpuHigh,
      psu: psu650,
    };

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(true);
    expect(postResult.warnings.some((w) => w.code === 'PSU_TIGHT_HEADROOM')).toBe(true);
    expect(
      postResult.warnings.find((w) => w.code === 'PSU_TIGHT_HEADROOM')?.reason.toLowerCase(),
    ).toContain('tanpa cadangan');
  });

  it('[KU-38] konektor daya tidak terpasang (24-pin atau CPU 8-pin lupa) gagal menyala dengan petunjuk', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    state = connectPowerCable(state, 'ATX_24PIN', false).state;

    const postMissing24 = simulatePost(state, rules, beepTable);
    expect(postMissing24.success).toBe(false);
    expect(postMissing24.primaryIssue?.code).toBe('MISSING_ATX_24PIN');
    expect(postMissing24.primaryIssue?.remediation).toContain('24-pin');

    let state2 = buildCompleteValidAssembly(catalog, rules);
    state2 = connectPowerCable(state2, 'CPU_8PIN', false).state;

    const postMissingCpu8 = simulatePost(state2, rules, beepTable);
    expect(postMissingCpu8.success).toBe(false);
    expect(postMissingCpu8.primaryIssue?.code).toBe('MISSING_CPU_8PIN');
    expect(postMissingCpu8.primaryIssue?.remediation).toContain('8-pin');
  });

  it('[KU-39] kabel daya GPU tidak terpasang menyebabkan gagal tampil dengan petunjuk PCIe power', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    state = connectPowerCable(state, 'PCIE_8PIN', false).state;

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.primaryIssue?.code).toBe('MISSING_GPU_PCIE_POWER');
    expect(postResult.primaryIssue?.remediation.toLowerCase()).toContain('pcie');
  });

  it('[KU-40] menyalakan rakitan tanpa CPU atau tanpa RAM gagal POST sesuai bagian yang hilang', () => {
    const base = buildCompleteValidAssembly(catalog, rules);

    const withoutCpu = { ...base, cpu: null };
    const resNoCpu = simulatePost(withoutCpu, rules, beepTable);
    expect(resNoCpu.success).toBe(false);
    expect(resNoCpu.primaryIssue?.code).toBe('MISSING_CPU');

    const withoutRam = { ...base, ramModules: {} };
    const resNoRam = simulatePost(withoutRam, rules, beepTable);
    expect(resNoRam.success).toBe(false);
    expect(resNoRam.primaryIssue?.code).toBe('MISSING_RAM');
  });

  it('[KU-41] menyalakan tanpa pendingin CPU memicu peringatan suhu dan mati otomatis', () => {
    const base = buildCompleteValidAssembly(catalog, rules);
    const withoutCooler = { ...base, cooler: null };

    const postResult = simulatePost(withoutCooler, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.status).toBe('THERMAL_SHUTDOWN');
    expect(postResult.primaryIssue?.code).toBe('MISSING_CPU_COOLER');
    expect(postResult.primaryIssue?.reason.toLowerCase()).toContain('suhu');
  });

  it('[KU-42] pendingin dipasang tanpa pasta termal menghasilkan peringatan suhu tinggi', () => {
    const base = buildCompleteValidAssembly(catalog, rules);
    const withoutPaste = { ...base, thermalPasteApplied: false };

    const postResult = simulatePost(withoutPaste, rules, beepTable);
    expect(postResult.warnings.some((w) => w.code === 'MISSING_THERMAL_PASTE')).toBe(true);
    expect(
      postResult.warnings.find((w) => w.code === 'MISSING_THERMAL_PASTE')?.reason.toLowerCase(),
    ).toContain('suhu tinggi');
  });

  it('[KU-43] kabel front panel salah (pin power SW tertukar) membuat tombol power tidak berfungsi', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    state = connectFrontPanel(state, { connected: true, pinAlignedCorrectly: false }).state;

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.status).toBe('NO_POWER');
    expect(postResult.primaryIssue?.code).toBe('FRONT_PANEL_MISWIRED');
  });

  it('[KU-44] penyimpanan tanpa OS menampilkan pesan no bootable device', () => {
    const base = buildCompleteValidAssembly(catalog, rules);
    const emptySsd = findById(catalog.storages, 'ssd-nvme-512-kosong');
    const state = { ...base, storage: emptySsd };

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.status).toBe('NO_BOOTABLE_DEVICE');
    expect(postResult.primaryIssue?.code).toBe('NO_BOOTABLE_DEVICE');
    expect(postResult.primaryIssue?.reason.toLowerCase()).toContain('no bootable device');
  });

  it('[KU-45] lubang standoff tidak sesuai memicu peringatan/kegagalan korsleting', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    state = configureStandoffs(state, false).state;

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(false);
    expect(postResult.primaryIssue?.code).toBe('STANDOFF_SHORT_CIRCUIT');
    expect(postResult.primaryIssue?.reason.toLowerCase()).toContain('korsleting');
  });

  it('[KU-46] urutan pemasangan dipaksa mengikuti urutan (pasang motherboard ke casing sebelum CPU/RAM ditolak)', () => {
    let state = createAssemblyState();
    const mb = findById(catalog.motherboards, 'mb-b650-atx');
    const pcCase = findById(catalog.cases, 'case-mid-atx');

    state = installMotherboard(state, mb).state;
    state = installCase(state, pcCase).state;
    state = configureStandoffs(state, true).state;

    // Mencoba memasang motherboard ke casing padahal CPU, pendingin, dan RAM belum dipasang
    const mountRes = mountMotherboardToCase(state, rules);
    expect(mountRes.ok).toBe(false);
    expect(mountRes.rejection?.code).toBe('OUT_OF_ORDER_STEP');
  });

  it('[KU-47] komponen dilepas lalu dipasang ulang memiliki status konsisten tanpa komponen ganda', () => {
    let state = createAssemblyState();
    const mb = findById(catalog.motherboards, 'mb-b650-atx');
    const cpu = findById(catalog.cpus, 'cpu-ryzen5-7600');
    const cooler = findById(catalog.coolers, 'cooler-tower-universal');
    const ram = findById(catalog.rams, 'ram-ddr5-16gb');

    state = installMotherboard(state, mb).state;
    state = installCpu(state, cpu, { triangleAligned: true }, rules).state;
    state = applyThermalPaste(state).state;
    state = installCooler(state, cooler).state;

    state = installRam(state, ram, 'A2', { notchAligned: true }, rules).state;
    expect(Object.keys(state.ramModules)).toEqual(['A2']);

    state = removeRam(state, 'A2').state;
    expect(Object.keys(state.ramModules)).toHaveLength(0);

    state = installRam(state, ram, 'A2', { notchAligned: true }, rules).state;
    expect(Object.keys(state.ramModules)).toEqual(['A2']);
    expect(state.ramModules.A2?.id).toBe('ram-ddr5-16gb');
  });

  it('[KU-48] memasang dua komponen di satu slot (dua RAM di slot sama) ditolak', () => {
    let state = createAssemblyState();
    const mb = findById(catalog.motherboards, 'mb-b650-atx');
    const cpu = findById(catalog.cpus, 'cpu-ryzen5-7600');
    const cooler = findById(catalog.coolers, 'cooler-tower-universal');
    const ram = findById(catalog.rams, 'ram-ddr5-16gb');

    state = installMotherboard(state, mb).state;
    state = installCpu(state, cpu, { triangleAligned: true }, rules).state;
    state = applyThermalPaste(state).state;
    state = installCooler(state, cooler).state;

    const first = installRam(state, ram, 'A2', { notchAligned: true }, rules);
    expect(first.ok).toBe(true);
    state = first.state;

    const second = installRam(state, ram, 'A2', { notchAligned: true }, rules);
    expect(second.ok).toBe(false);
    expect(second.rejection?.code).toBe('SLOT_ALREADY_OCCUPIED');
  });

  it('[KU-49] konfigurasi dual-channel di slot tidak berpasangan tetap berjalan dengan catatan performa lebih rendah', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    const ram = findById(catalog.rams, 'ram-ddr5-16gb');

    // Reset RAM lalu pasang di A1 dan A2 (tidak berpasangan; pasangan seharusnya A2+B2 atau A1+B1)
    state = {
      ...state,
      ramModules: {
        A1: ram,
        A2: ram,
      },
    };

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.success).toBe(true);
    expect(postResult.warnings.some((w) => w.code === 'RAM_SINGLE_CHANNEL_SUBOPTIMAL')).toBe(true);
  });

  it('[KU-50] total RAM melebihi batas motherboard (4 x 64 GB di board max 128 GB) memberi peringatan kapasitas', () => {
    let state = buildCompleteValidAssembly(catalog, rules);
    const ram64 = findById(catalog.rams, 'ram-ddr5-64gb');

    state = {
      ...state,
      ramModules: {
        A1: ram64,
        A2: ram64,
        B1: ram64,
        B2: ram64,
      },
    };

    const postResult = simulatePost(state, rules, beepTable);
    expect(postResult.warnings.some((w) => w.code === 'RAM_CAPACITY_EXCEEDED')).toBe(true);
  });

  it('[KU-51] cek keselamatan (ESD, K3) hanya berupa pengingat dan tidak memblokir perakitan', () => {
    const state = createAssemblyState();
    expect(state.esdReminderText.toLowerCase()).toContain('esd');
    expect(state.esdAcknowledged).toBe(false);

    // Tetap bisa langsung memasang motherboard tanpa mencentang ESD
    const mb = findById(catalog.motherboards, 'mb-b650-atx');
    const res = installMotherboard(state, mb);
    expect(res.ok).toBe(true);

    // Opsi pencatatan pengingat tetap tersedia bila siswa mengklik
    const ackState = acknowledgeEsdReminder(res.state);
    expect(ackState.esdAcknowledged).toBe(true);
  });

  it('[KU-52] penilaian siswa menghitung skor berdasarkan hasil + waktu + jumlah percobaan', () => {
    const fastFirstTry = calculateAssemblyScore({
      isPostSuccess: true,
      elapsedSeconds: 180,
      targetSeconds: 300,
      attempts: 1,
      warningCount: 0,
    });

    const slowManyAttempts = calculateAssemblyScore({
      isPostSuccess: true,
      elapsedSeconds: 720,
      targetSeconds: 300,
      attempts: 4,
      warningCount: 0,
    });

    const failedBuild = calculateAssemblyScore({
      isPostSuccess: false,
      elapsedSeconds: 200,
      targetSeconds: 300,
      attempts: 2,
      warningCount: 1,
    });

    expect(fastFirstTry.totalScore).toBe(100);
    expect(slowManyAttempts.totalScore).toBeLessThan(fastFirstTry.totalScore);
    expect(slowManyAttempts.timeScore).toBeLessThan(fastFirstTry.timeScore);
    expect(slowManyAttempts.attemptScore).toBeLessThan(fastFirstTry.attemptScore);
    expect(failedBuild.resultScore).toBe(0);
    expect(failedBuild.totalScore).toBeLessThan(slowManyAttempts.totalScore);
  });
});
