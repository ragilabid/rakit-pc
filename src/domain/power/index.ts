import type { AssemblyState } from '../assembly';

export interface PowerSummary {
  cpuWatts: number;
  motherboardWatts: number;
  ramWatts: number;
  gpuWatts: number;
  storageWatts: number;
  coolerWatts: number;
  caseWatts: number;
  requiredWatts: number;
  psuWattage: number;
  headroomWatts: number;
  headroomRatio: number;
  isSufficient: boolean;
  isTightHeadroom: boolean;
}

const DEFAULT_HEADROOM_THRESHOLD = 0.15;

/**
 * Menghitung total kebutuhan daya (Watt) dari seluruh komponen yang terpasang
 * dan membandingkannya dengan kapasitas PSU.
 */
export function calculatePowerRequirement(state: AssemblyState): PowerSummary {
  const cpuWatts = state.cpu?.tdpWatts ?? 0;
  const motherboardWatts = state.motherboard?.tdpWatts ?? 0;
  const ramWatts = Object.values(state.ramModules).reduce(
    (sum, mod) => sum + (mod?.tdpWatts ?? 0),
    0,
  );
  const gpuWatts = state.gpu?.tdpWatts ?? 0;
  const storageWatts = state.storage?.tdpWatts ?? 0;
  const coolerWatts = state.cooler?.tdpWatts ?? 0;
  const caseWatts = state.pcCase?.tdpWatts ?? 0;

  const requiredWatts =
    cpuWatts + motherboardWatts + ramWatts + gpuWatts + storageWatts + coolerWatts + caseWatts;

  const psuWattage = state.psu?.wattage ?? 0;
  const headroomWatts = psuWattage - requiredWatts;
  const headroomRatio = requiredWatts > 0 ? headroomWatts / requiredWatts : 1;
  const isSufficient = psuWattage >= requiredWatts && psuWattage > 0;
  const isTightHeadroom = isSufficient && headroomRatio < DEFAULT_HEADROOM_THRESHOLD;

  return {
    cpuWatts,
    motherboardWatts,
    ramWatts,
    gpuWatts,
    storageWatts,
    coolerWatts,
    caseWatts,
    requiredWatts,
    psuWattage,
    headroomWatts,
    headroomRatio,
    isSufficient,
    isTightHeadroom,
  };
}
