import type {
  CaseSpec,
  CompatibilityRule,
  ComponentCatalog,
  CoolerSpec,
  CpuSpec,
  GpuSpec,
  MonitorTargetPort,
  MotherboardSpec,
  PsuSpec,
  RamSlotId,
  RamSpec,
  StorageSpec,
} from '../types';
import { evaluateRulesByCode, type RuleViolation } from '../compat';

export interface PowerCablesState {
  ATX_24PIN: boolean;
  CPU_8PIN: boolean;
  PCIE_8PIN: boolean;
}

export interface FrontPanelState {
  connected: boolean;
  pinAlignedCorrectly: boolean;
}

export interface AssemblyState {
  esdReminderText: string;
  esdAcknowledged: boolean;
  motherboard: MotherboardSpec | null;
  cpu: CpuSpec | null;
  thermalPasteApplied: boolean;
  cooler: CoolerSpec | null;
  ramModules: Partial<Record<RamSlotId, RamSpec>>;
  storage: StorageSpec | null;
  pcCase: CaseSpec | null;
  standoffsAligned: boolean;
  isMountedInCase: boolean;
  psu: PsuSpec | null;
  gpu: GpuSpec | null;
  powerCables: PowerCablesState;
  frontPanel: FrontPanelState;
  monitorConnectedTo: MonitorTargetPort | null;
  attempts: number;
  physicalRejections: RuleViolation[];
}

export interface AssemblyActionResult {
  ok: boolean;
  state: AssemblyState;
  rejection?: RuleViolation;
}

export function createAssemblyState(): AssemblyState {
  return {
    esdReminderText:
      'Pengingat Keselamatan (ESD & K3): Sentuh permukaan logam casing atau gunakan gelang antistatik sebelum memegang komponen elektronik.',
    esdAcknowledged: false,
    motherboard: null,
    cpu: null,
    thermalPasteApplied: false,
    cooler: null,
    ramModules: {},
    storage: null,
    pcCase: null,
    standoffsAligned: true,
    isMountedInCase: false,
    psu: null,
    gpu: null,
    powerCables: {
      ATX_24PIN: false,
      CPU_8PIN: false,
      PCIE_8PIN: false,
    },
    frontPanel: {
      connected: false,
      pinAlignedCorrectly: true,
    },
    monitorConnectedTo: null,
    attempts: 1,
    physicalRejections: [],
  };
}

export function acknowledgeEsdReminder(state: AssemblyState): AssemblyState {
  return {
    ...state,
    esdAcknowledged: true,
  };
}

function rejectAction(state: AssemblyState, rejection: RuleViolation): AssemblyActionResult {
  return {
    ok: false,
    rejection,
    state: {
      ...state,
      attempts: state.attempts + 1,
      physicalRejections: [...state.physicalRejections, rejection],
    },
  };
}

function createOrderViolation(reason: string, remediation: string): RuleViolation {
  return {
    ruleId: 'rule-assembly-order',
    code: 'OUT_OF_ORDER_STEP',
    testCaseRef: 'KU-46',
    level: 'PHYSICAL',
    severity: 'REJECT',
    reason,
    remediation,
  };
}

export function installMotherboard(
  state: AssemblyState,
  motherboard: MotherboardSpec,
): AssemblyActionResult {
  return {
    ok: true,
    state: {
      ...state,
      motherboard,
    },
  };
}

export function installCpu(
  state: AssemblyState,
  cpu: CpuSpec,
  options: { triangleAligned: boolean },
  rules: CompatibilityRule[],
): AssemblyActionResult {
  if (!state.motherboard) {
    return rejectAction(
      state,
      createOrderViolation(
        'Motherboard belum disiapkan di meja kerja.',
        'Siapkan motherboard terlebih dahulu sebelum memasang prosesor (CPU).',
      ),
    );
  }

  const violations = evaluateRulesByCode(
    rules,
    ['CPU_SOCKET_MISMATCH', 'CPU_ORIENTATION_INVALID'],
    {
      cpu,
      motherboard: state.motherboard,
      placement: { cpuTriangleAligned: options.triangleAligned },
    },
  );

  if (violations.length > 0) {
    return rejectAction(state, violations[0]!);
  }

  return {
    ok: true,
    state: {
      ...state,
      cpu,
    },
  };
}

export function applyThermalPaste(state: AssemblyState): AssemblyActionResult {
  if (!state.cpu) {
    return rejectAction(
      state,
      createOrderViolation(
        'CPU belum terpasang di soket motherboard.',
        'Pasang CPU terlebih dahulu sebelum mengoleskan pasta termal.',
      ),
    );
  }

  return {
    ok: true,
    state: {
      ...state,
      thermalPasteApplied: true,
    },
  };
}

export function installCooler(state: AssemblyState, cooler: CoolerSpec): AssemblyActionResult {
  if (!state.cpu) {
    return rejectAction(
      state,
      createOrderViolation(
        'Pendingin CPU tidak dapat dipasang sebelum CPU berada di soket.',
        'Pasang CPU (dan pasta termal) terlebih dahulu sebelum memasang heatsink/pendingin.',
      ),
    );
  }

  return {
    ok: true,
    state: {
      ...state,
      cooler,
    },
  };
}

export function installRam(
  state: AssemblyState,
  ram: RamSpec,
  slot: RamSlotId,
  options: { notchAligned: boolean },
  rules: CompatibilityRule[],
): AssemblyActionResult {
  if (!state.motherboard || !state.cpu) {
    return rejectAction(
      state,
      createOrderViolation(
        'Urutan perakitan belum tepat: pasang motherboard dan CPU terlebih dahulu sebelum memasang RAM.',
        'Ikuti urutan perakitan dengan menyiapkan motherboard dan memasang CPU sebelum modul RAM.',
      ),
    );
  }

  const slotOccupied = Boolean(state.ramModules[slot]);
  const violations = evaluateRulesByCode(
    rules,
    ['SLOT_ALREADY_OCCUPIED', 'RAM_TYPE_MISMATCH', 'RAM_ORIENTATION_REVERSED'],
    {
      motherboard: state.motherboard,
      ram,
      placement: {
        ramNotchAligned: options.notchAligned,
        targetSlotOccupied: slotOccupied,
      },
    },
  );

  if (violations.length > 0) {
    return rejectAction(state, violations[0]!);
  }

  return {
    ok: true,
    state: {
      ...state,
      ramModules: {
        ...state.ramModules,
        [slot]: ram,
      },
    },
  };
}

export function removeRam(state: AssemblyState, slot: RamSlotId): AssemblyActionResult {
  const nextModules = { ...state.ramModules };
  delete nextModules[slot];

  return {
    ok: true,
    state: {
      ...state,
      ramModules: nextModules,
    },
  };
}

export function installStorage(state: AssemblyState, storage: StorageSpec): AssemblyActionResult {
  if (!state.motherboard) {
    return rejectAction(
      state,
      createOrderViolation(
        'Motherboard belum tersedia untuk pemasangan penyimpanan.',
        'Siapkan motherboard terlebih dahulu sebelum memasang penyimpanan.',
      ),
    );
  }

  return {
    ok: true,
    state: {
      ...state,
      storage,
    },
  };
}

export function installCase(state: AssemblyState, pcCase: CaseSpec): AssemblyActionResult {
  return {
    ok: true,
    state: {
      ...state,
      pcCase,
    },
  };
}

export function configureStandoffs(state: AssemblyState, aligned: boolean): AssemblyActionResult {
  return {
    ok: true,
    state: {
      ...state,
      standoffsAligned: aligned,
    },
  };
}

export function mountMotherboardToCase(
  state: AssemblyState,
  rules: CompatibilityRule[],
): AssemblyActionResult {
  if (!state.motherboard || !state.pcCase) {
    return rejectAction(
      state,
      createOrderViolation(
        'Motherboard dan casing harus dipilih sebelum memasang motherboard ke dalam casing.',
        'Siapkan motherboard dan casing terlebih dahulu.',
      ),
    );
  }

  // KU-46: wajib mengikuti urutan — CPU dan RAM harus dipasang di motherboard sebelum masuk casing
  if (!state.cpu || Object.keys(state.ramModules).length === 0) {
    return rejectAction(
      state,
      createOrderViolation(
        'Urutan pemasangan tidak sesuai: CPU dan RAM harus dipasang pada motherboard di luar casing terlebih dahulu.',
        'Pasang CPU, pendingin, dan RAM pada motherboard sebelum memasukkan motherboard ke dalam casing.',
      ),
    );
  }

  // KU-35: cek kecocokan form factor secara fisik (ATX ke Mini-ITX ditolak)
  const violations = evaluateRulesByCode(rules, ['FORM_FACTOR_INCOMPATIBLE'], {
    motherboard: state.motherboard,
    case: state.pcCase,
  });

  if (violations.length > 0) {
    return rejectAction(state, violations[0]!);
  }

  return {
    ok: true,
    state: {
      ...state,
      isMountedInCase: true,
    },
  };
}

export function installPsu(state: AssemblyState, psu: PsuSpec): AssemblyActionResult {
  if (!state.isMountedInCase) {
    return rejectAction(
      state,
      createOrderViolation(
        'Pasang motherboard ke dalam casing terlebih dahulu sebelum memasang PSU.',
        'Ikuti urutan pemasangan dengan memasang motherboard ke casing sebelum PSU.',
      ),
    );
  }

  return {
    ok: true,
    state: {
      ...state,
      psu,
    },
  };
}

export function installGpu(state: AssemblyState, gpu: GpuSpec): AssemblyActionResult {
  if (!state.isMountedInCase) {
    return rejectAction(
      state,
      createOrderViolation(
        'Motherboard harus sudah terpasang di dalam casing sebelum memasang kartu grafis (GPU).',
        'Pasang motherboard ke casing terlebih dahulu, lalu pasang GPU pada slot PCIe.',
      ),
    );
  }

  return {
    ok: true,
    state: {
      ...state,
      gpu,
    },
  };
}

export function connectPowerCable(
  state: AssemblyState,
  cable: keyof PowerCablesState,
  connected: boolean,
): AssemblyActionResult {
  return {
    ok: true,
    state: {
      ...state,
      powerCables: {
        ...state.powerCables,
        [cable]: connected,
      },
    },
  };
}

export function connectFrontPanel(
  state: AssemblyState,
  frontPanel: FrontPanelState,
): AssemblyActionResult {
  return {
    ok: true,
    state: {
      ...state,
      frontPanel,
    },
  };
}

export function connectMonitorCable(
  state: AssemblyState,
  targetPort: MonitorTargetPort,
): AssemblyActionResult {
  return {
    ok: true,
    state: {
      ...state,
      monitorConnectedTo: targetPort,
    },
  };
}

/**
 * Helper untuk membangun satu rakitan lengkap dan valid sesuai urutan standar (KU-30).
 */
export function buildCompleteValidAssembly(
  catalog: ComponentCatalog,
  rules: CompatibilityRule[],
): AssemblyState {
  let state = createAssemblyState();
  const mb = catalog.motherboards.find((m) => m.id === 'mb-b650-atx')!;
  const cpu = catalog.cpus.find((c) => c.id === 'cpu-ryzen5-7600')!;
  const cooler = catalog.coolers.find((c) => c.id === 'cooler-tower-universal')!;
  const ram = catalog.rams.find((r) => r.id === 'ram-ddr5-16gb')!;
  const ssd = catalog.storages.find((s) => s.id === 'ssd-nvme-512-os')!;
  const pcCase = catalog.cases.find((c) => c.id === 'case-mid-atx')!;
  const psu = catalog.psus.find((p) => p.id === 'psu-650w')!;
  const gpu = catalog.gpus.find((g) => g.id === 'gpu-rtx-4060')!;

  state = installMotherboard(state, mb).state;
  state = installCpu(state, cpu, { triangleAligned: true }, rules).state;
  state = applyThermalPaste(state).state;
  state = installCooler(state, cooler).state;
  state = installRam(state, ram, 'A2', { notchAligned: true }, rules).state;
  state = installRam(state, ram, 'B2', { notchAligned: true }, rules).state;
  state = installStorage(state, ssd).state;
  state = installCase(state, pcCase).state;
  state = configureStandoffs(state, true).state;
  state = mountMotherboardToCase(state, rules).state;
  state = installPsu(state, psu).state;
  state = installGpu(state, gpu).state;
  state = connectPowerCable(state, 'ATX_24PIN', true).state;
  state = connectPowerCable(state, 'CPU_8PIN', true).state;
  state = connectPowerCable(state, 'PCIE_8PIN', true).state;
  state = connectFrontPanel(state, { connected: true, pinAlignedCorrectly: true }).state;
  state = connectMonitorCable(state, 'GPU').state;

  return state;
}
