/**
 * Skema tipe domain murni — tanpa ketergantungan pada React, three.js, atau API browser.
 */

export type CpuSocket = 'AM5' | 'LGA1700';
export type RamType = 'DDR4' | 'DDR5';
export type FormFactor = 'ATX' | 'Micro-ATX' | 'Mini-ITX';
export type StorageInterface = 'NVMe_M2' | 'SATA';
export type CableType =
  'ATX_24PIN' | 'CPU_8PIN' | 'PCIE_8PIN' | 'FRONT_PANEL' | 'SATA_DATA' | 'MONITOR_HDMI';

export type RamSlotId = 'A1' | 'A2' | 'B1' | 'B2';
export type MonitorTargetPort = 'MOTHERBOARD' | 'GPU';

export type AssemblyStepId =
  | 'PREP_MOTHERBOARD'
  | 'INSTALL_CPU'
  | 'APPLY_THERMAL_PASTE'
  | 'INSTALL_COOLER'
  | 'INSTALL_RAM'
  | 'INSTALL_STORAGE'
  | 'PREP_CASE_STANDOFF'
  | 'MOUNT_MOTHERBOARD'
  | 'INSTALL_PSU'
  | 'INSTALL_GPU'
  | 'CONNECT_CABLES';

export interface BaseComponentSpec {
  id: string;
  name: string;
  category: 'cpu' | 'motherboard' | 'ram' | 'psu' | 'case' | 'gpu' | 'storage' | 'cooler' | 'cable';
  tdpWatts: number;
  verificationNote?: string;
}

export interface CpuSpec extends BaseComponentSpec {
  category: 'cpu';
  socket: CpuSocket;
  hasIntegratedGraphics: boolean;
}

export interface MotherboardSpec extends BaseComponentSpec {
  category: 'motherboard';
  socket: CpuSocket;
  ramType: RamType;
  ramSlots: RamSlotId[];
  dualChannelPairs: [RamSlotId, RamSlotId][];
  maxRamGb: number;
  formFactor: FormFactor;
}

export interface RamSpec extends BaseComponentSpec {
  category: 'ram';
  ramType: RamType;
  capacityGb: number;
  defective?: boolean;
}

export interface PsuSpec extends BaseComponentSpec {
  category: 'psu';
  wattage: number;
}

export interface CaseSpec extends BaseComponentSpec {
  category: 'case';
  supportedFormFactors: FormFactor[];
}

export interface GpuSpec extends BaseComponentSpec {
  category: 'gpu';
  requiresPciePower: boolean;
}

export interface StorageSpec extends BaseComponentSpec {
  category: 'storage';
  interface: StorageInterface;
  hasOsInstalled: boolean;
}

export interface CoolerSpec extends BaseComponentSpec {
  category: 'cooler';
  supportedSockets: CpuSocket[];
}

export interface CableSpec extends BaseComponentSpec {
  category: 'cable';
  cableType: CableType;
}

export type AnyComponentSpec =
  | CpuSpec
  | MotherboardSpec
  | RamSpec
  | PsuSpec
  | CaseSpec
  | GpuSpec
  | StorageSpec
  | CoolerSpec
  | CableSpec;

export interface ComponentCatalog {
  cpus: CpuSpec[];
  motherboards: MotherboardSpec[];
  rams: RamSpec[];
  psus: PsuSpec[];
  cases: CaseSpec[];
  gpus: GpuSpec[];
  storages: StorageSpec[];
  coolers: CoolerSpec[];
  cables: CableSpec[];
}

/**
 * Skema aturan kompatibilitas deklaratif (SPEC Bagian 4 aturan #4 & Bagian 6.3).
 */
export type FailureLevel = 'PHYSICAL' | 'LOGICAL';
export type RuleSeverity = 'REJECT' | 'ERROR' | 'WARNING' | 'INFO';

export type DeclarativeOperator =
  | 'EQUALS'
  | 'ARRAY_INCLUDES'
  | 'BOOL_TRUE'
  | 'SLOT_EMPTY'
  | 'SUM_LTE'
  | 'PAIR_MATCH'
  | 'WATTAGE_SUFFICIENT'
  | 'WATTAGE_HEADROOM';

export interface CompatibilityRule {
  id: string;
  code: string;
  testCaseRef: string;
  level: FailureLevel;
  severity: RuleSeverity;
  operator: DeclarativeOperator;
  leftPath: string;
  rightPath?: string;
  thresholdRatio?: number;
  reason: string;
  remediation: string;
  proposalNote?: string;
}

export interface AmiBeepEntry {
  id: string;
  pattern: string;
  beepCount: number | string;
  toneType: 'SHORT' | 'LONG_SHORT' | 'CONTINUOUS' | 'NONE';
  meaning: string;
  targetComponent: 'NORMAL' | 'RAM' | 'GPU' | 'CPU' | 'MOTHERBOARD' | 'POWER';
  diagnosticHint: string;
  verificationStatus: 'TODO-VERIFIKASI' | 'VERIFIED';
  sourceNote: string;
}
