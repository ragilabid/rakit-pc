import type { AssemblyState } from '../assembly';
import { evaluateRulesByCode } from '../compat';
import { calculatePowerRequirement } from '../power';
import type { AmiBeepEntry, CompatibilityRule, RamSlotId } from '../types';

export type PostStatus =
  | 'BOOT_SUCCESS'
  | 'NO_POWER'
  | 'SHORT_CIRCUIT'
  | 'PSU_OVERLOAD'
  | 'THERMAL_SHUTDOWN'
  | 'POST_BEEP_ERROR'
  | 'NO_DISPLAY'
  | 'NO_BOOTABLE_DEVICE';

export interface PostIssue {
  code: string;
  testCaseRef: string;
  relatedComponent:
    'POWER' | 'CASE' | 'PSU' | 'CPU' | 'COOLER' | 'RAM' | 'GPU' | 'MONITOR' | 'STORAGE';
  reason: string;
  remediation: string;
}

export interface PostSimulationResult {
  success: boolean;
  status: PostStatus;
  beep: AmiBeepEntry | null;
  /**
   * Sesuai SPEC Bagian 2 #11 & Bagian 6.4 (KU-57):
   * Masalah pemblokir dilaporkan SATU PER SATU sesuai urutan pemeriksaan perangkat keras.
   */
  primaryIssue: PostIssue | null;
  reportedIssues: PostIssue[];
  warnings: PostIssue[];
}

function findBeep(beepTable: AmiBeepEntry[], id: string): AmiBeepEntry | null {
  return beepTable.find((b) => b.id === id) ?? null;
}

function respondSingleFailure(
  status: PostStatus,
  issue: PostIssue,
  beep: AmiBeepEntry | null,
  warnings: PostIssue[] = [],
): PostSimulationResult {
  return {
    success: false,
    status,
    beep,
    primaryIssue: issue,
    reportedIssues: [issue],
    warnings,
  };
}

/**
 * Menyimulasikan proses menyalakan PC (Power-On -> POST -> Video Init -> OS Boot).
 * Jika ada beberapa kegagalan logis sekaligus, hanya kegagalan pertama dalam rantai
 * perangkat keras yang dilaporkan pada satu waktu (KU-57).
 */
export function simulatePost(
  state: AssemblyState,
  rules: CompatibilityRule[],
  beepTable: AmiBeepEntry[],
): PostSimulationResult {
  const power = calculatePowerRequirement(state);

  // 1. Pemeriksaan jalur tombol daya & konektor daya utama (tidak ada arus / gagal menyala)
  if (!state.frontPanel.connected || !state.frontPanel.pinAlignedCorrectly) {
    return respondSingleFailure(
      'NO_POWER',
      {
        code: 'FRONT_PANEL_MISWIRED',
        testCaseRef: 'KU-43',
        relatedComponent: 'POWER',
        reason:
          'Tombol power pada casing tidak berfungsi karena kabel front panel (Power SW) belum terpasang atau tertukar pinnya.',
        remediation:
          'Periksa header JFP1/F_PANEL di sudut bawah motherboard dan pastikan konektor Power SW terpasang pada dua pin Power Switch yang benar.',
      },
      null,
    );
  }

  if (!state.powerCables.ATX_24PIN) {
    return respondSingleFailure(
      'NO_POWER',
      {
        code: 'MISSING_ATX_24PIN',
        testCaseRef: 'KU-38',
        relatedComponent: 'POWER',
        reason: 'Motherboard tidak mendapat daya utama karena konektor ATX 24-pin belum terpasang.',
        remediation:
          'Pasang kabel daya utama ATX 24-pin dari PSU ke soket 24-pin di sisi kanan motherboard hingga penguncinya berbunyi klik.',
      },
      null,
    );
  }

  if (!state.standoffsAligned) {
    return respondSingleFailure(
      'SHORT_CIRCUIT',
      {
        code: 'STANDOFF_SHORT_CIRCUIT',
        testCaseRef: 'KU-45',
        relatedComponent: 'CASE',
        reason:
          'Peringatan korsleting: posisi dudukan baut (standoff) pada casing tidak sesuai dengan lubang motherboard sehingga memicu proteksi arus pendek.',
        remediation:
          'Lepas motherboard, sesuaikan posisi baut standoff pada baki casing agar tepat sejajar dengan lubang baut form factor motherboard.',
      },
      null,
    );
  }

  if (!state.powerCables.CPU_8PIN) {
    return respondSingleFailure(
      'NO_POWER',
      {
        code: 'MISSING_CPU_8PIN',
        testCaseRef: 'KU-38',
        relatedComponent: 'POWER',
        reason: 'Prosesor tidak mendapat suplai daya karena kabel CPU EPS 8-pin belum terpasang.',
        remediation:
          'Hubungkan kabel daya CPU 8-pin (4+4 pin) dari PSU ke konektor ATX_12V/CPU_PWR di sudut kiri atas motherboard.',
      },
      null,
    );
  }

  // 2. Pemeriksaan kecukupan daya PSU (KU-36)
  const psuViolations = evaluateRulesByCode(rules, ['PSU_WATTAGE_INSUFFICIENT'], {
    power: {
      psuWattage: power.psuWattage,
      requiredWatts: power.requiredWatts,
    },
  });

  if (psuViolations.length > 0) {
    const v = psuViolations[0]!;
    return respondSingleFailure(
      'PSU_OVERLOAD',
      {
        code: v.code,
        testCaseRef: v.testCaseRef,
        relatedComponent: 'PSU',
        reason: v.reason,
        remediation: v.remediation,
      },
      null,
    );
  }

  // 3. Pemeriksaan keberadaan CPU & pendingin CPU (KU-40, KU-41)
  if (!state.cpu) {
    return respondSingleFailure(
      'POST_BEEP_ERROR',
      {
        code: 'MISSING_CPU',
        testCaseRef: 'KU-40',
        relatedComponent: 'CPU',
        reason: 'Gagal POST: prosesor (CPU) belum terpasang pada soket motherboard.',
        remediation:
          'Pasang prosesor yang kompatibel pada soket CPU motherboard sebelum menyalakan komputer.',
      },
      findBeep(beepTable, 'ami-cpu-failure'),
    );
  }

  if (!state.cooler) {
    return respondSingleFailure(
      'THERMAL_SHUTDOWN',
      {
        code: 'MISSING_CPU_COOLER',
        testCaseRef: 'KU-41',
        relatedComponent: 'COOLER',
        reason:
          'Peringatan suhu kritis: CPU menyala tanpa heatsink/pendingin sehingga suhu melonjak drastis dan sistem mati otomatis (thermal shutdown).',
        remediation:
          'Oleskan pasta termal dan pasang pendingin CPU (heatsink + kipas) dengan rapat di atas prosesor.',
      },
      null,
    );
  }

  // 4. Pemeriksaan keberadaan dan kesehatan RAM (KU-40, KU-54, KU-57)
  const installedRams = Object.values(state.ramModules).filter((r): r is NonNullable<typeof r> =>
    Boolean(r),
  );

  if (installedRams.length === 0) {
    return respondSingleFailure(
      'POST_BEEP_ERROR',
      {
        code: 'MISSING_RAM',
        testCaseRef: 'KU-40',
        relatedComponent: 'RAM',
        reason:
          'Gagal POST dengan kode bip AMI berulang: tidak ada modul RAM yang terdeteksi pada slot memori.',
        remediation:
          'Pasang minimal satu keping RAM yang kompatibel pada slot DIMM (disarankan slot A2) hingga pengunci menutup sempurna.',
      },
      findBeep(beepTable, 'ami-ram-missing-or-faulty'),
    );
  }

  if (installedRams.some((ram) => ram.defective)) {
    return respondSingleFailure(
      'POST_BEEP_ERROR',
      {
        code: 'FAULTY_RAM',
        testCaseRef: 'KU-57',
        relatedComponent: 'RAM',
        reason:
          'Gagal POST dengan kode bip AMI berulang: modul RAM yang terpasang rusak atau gagal melewati pemeriksaan memori.',
        remediation:
          'Lepas modul RAM yang bermasalah, bersihkan pin kontaknya, atau ganti dengan keping RAM yang berfungsi baik.',
      },
      findBeep(beepTable, 'ami-ram-missing-or-faulty'),
    );
  }

  // 5. Pemeriksaan GPU & jalur tampilan monitor (KU-39, KU-55)
  if (state.gpu && state.gpu.requiresPciePower && !state.powerCables.PCIE_8PIN) {
    return respondSingleFailure(
      'NO_DISPLAY',
      {
        code: 'MISSING_GPU_PCIE_POWER',
        testCaseRef: 'KU-39',
        relatedComponent: 'GPU',
        reason:
          'Layar kosong dan POST tertahan: kartu grafis membutuhkan daya tambahan tetapi kabel PCIe power belum dicolok.',
        remediation:
          'Pasang kabel daya PCIe 8-pin dari PSU ke konektor daya pada bagian atas kartu grafis (GPU).',
      },
      findBeep(beepTable, 'ami-no-video-card'),
    );
  }

  if (state.gpu && state.monitorConnectedTo === 'MOTHERBOARD' && !state.cpu.hasIntegratedGraphics) {
    return respondSingleFailure(
      'NO_DISPLAY',
      {
        code: 'MONITOR_WRONG_PORT_MOTHERBOARD',
        testCaseRef: 'KU-55',
        relatedComponent: 'MONITOR',
        reason:
          'Tidak ada tampilan di layar karena kabel monitor dicolok ke port motherboard, sedangkan CPU tidak memiliki grafis terintegrasi.',
        remediation:
          'Pindahkan kabel monitor (HDMI/DisplayPort) dari panel belakang motherboard lalu colok langsung ke port output pada kartu grafis (GPU).',
      },
      findBeep(beepTable, 'ami-normal-post'),
    );
  }

  // 6. Pemeriksaan perangkat boot / sistem operasi (KU-44)
  if (!state.storage || !state.storage.hasOsInstalled) {
    return respondSingleFailure(
      'NO_BOOTABLE_DEVICE',
      {
        code: 'NO_BOOTABLE_DEVICE',
        testCaseRef: 'KU-44',
        relatedComponent: 'STORAGE',
        reason:
          'POST berhasil, tetapi muncul pesan "No bootable device found" karena media penyimpanan kosong atau belum terinstal sistem operasi.',
        remediation:
          'Gunakan SSD/HDD yang sudah terinstal sistem operasi atau masukkan media instalasi OS (USB bootable).',
      },
      findBeep(beepTable, 'ami-normal-post'),
    );
  }

  // 7. Kumpulkan peringatan non-fatal (KU-37, KU-42, KU-49, KU-50)
  const warnings: PostIssue[] = [];

  if (!state.thermalPasteApplied) {
    warnings.push({
      code: 'MISSING_THERMAL_PASTE',
      testCaseRef: 'KU-42',
      relatedComponent: 'COOLER',
      reason:
        'Peringatan suhu tinggi: pendingin CPU dipasang tanpa pasta termal sehingga perpindahan panas tidak optimal.',
      remediation:
        'Lepas pendingin CPU, oleskan pasta termal secukupnya di tengah IHS prosesor, lalu pasang kembali pendingin.',
    });
  }

  const totalRamGb = installedRams.reduce((sum, r) => sum + r.capacityGb, 0);
  const installedSlots = Object.keys(state.ramModules) as RamSlotId[];

  const declarativeWarnings = evaluateRulesByCode(
    rules,
    ['PSU_TIGHT_HEADROOM', 'RAM_CAPACITY_EXCEEDED', 'RAM_SINGLE_CHANNEL_SUBOPTIMAL'],
    {
      motherboard: state.motherboard,
      power: {
        psuWattage: power.psuWattage,
        requiredWatts: power.requiredWatts,
      },
      memory: {
        totalInstalledGb: totalRamGb,
        installedSlots,
      },
    },
  );

  for (const w of declarativeWarnings) {
    warnings.push({
      code: w.code,
      testCaseRef: w.testCaseRef,
      relatedComponent: w.code.startsWith('PSU') ? 'PSU' : 'RAM',
      reason: w.reason,
      remediation: w.remediation,
    });
  }

  return {
    success: true,
    status: 'BOOT_SUCCESS',
    beep: findBeep(beepTable, 'ami-normal-post'),
    primaryIssue: null,
    reportedIssues: [],
    warnings,
  };
}
