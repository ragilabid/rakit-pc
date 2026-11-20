import type { CompatibilityRule, FailureLevel, RamSlotId, RuleSeverity } from '../types';

export interface RuleEvaluationContext {
  cpu?: { socket: string } | null;
  motherboard?: {
    socket: string;
    ramType: string;
    formFactor: string;
    maxRamGb: number;
    dualChannelPairs: [RamSlotId, RamSlotId][];
  } | null;
  ram?: { ramType: string; capacityGb: number } | null;
  case?: { supportedFormFactors: string[] } | null;
  placement?: {
    cpuTriangleAligned?: boolean;
    ramNotchAligned?: boolean;
    targetSlotOccupied?: boolean;
  };
  power?: {
    psuWattage: number;
    requiredWatts: number;
  };
  memory?: {
    totalInstalledGb: number;
    installedSlots: RamSlotId[];
  };
}

export interface RuleViolation {
  ruleId: string;
  code: string;
  testCaseRef: string;
  level: FailureLevel;
  severity: RuleSeverity;
  reason: string;
  remediation: string;
  proposalNote?: string;
}

function resolvePath(context: RuleEvaluationContext, path?: string): unknown {
  if (!path) return undefined;
  const parts = path.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Mengevaluasi satu aturan kompatibilitas deklaratif terhadap konteks saat ini.
 * Mengembalikan `null` jika aturan terpenuhi, atau `RuleViolation` jika dilanggar.
 */
export function evaluateDeclarativeRule(
  rule: CompatibilityRule,
  context: RuleEvaluationContext,
): RuleViolation | null {
  const left = resolvePath(context, rule.leftPath);
  const right = resolvePath(context, rule.rightPath);

  let passed = true;

  switch (rule.operator) {
    case 'EQUALS':
      passed = left !== undefined && right !== undefined && left === right;
      break;

    case 'ARRAY_INCLUDES':
      passed = Array.isArray(left) && right !== undefined && left.includes(right);
      break;

    case 'BOOL_TRUE':
      passed = left === true;
      break;

    case 'SLOT_EMPTY':
      passed = left === false;
      break;

    case 'SUM_LTE':
      if (typeof left === 'number' && typeof right === 'number') {
        passed = left <= right;
      }
      break;

    case 'PAIR_MATCH':
      if (Array.isArray(left) && Array.isArray(right)) {
        // Hanya dievaluasi bila tepat 2 keping RAM dipasang
        if (left.length !== 2) {
          passed = true;
        } else {
          const sortedInstalled = [...left].sort().join('+');
          passed = (right as [string, string][]).some(
            (pair) => [...pair].sort().join('+') === sortedInstalled,
          );
        }
      }
      break;

    case 'WATTAGE_SUFFICIENT':
      if (typeof left === 'number' && typeof right === 'number') {
        passed = left >= right;
      }
      break;

    case 'WATTAGE_HEADROOM':
      if (typeof left === 'number' && typeof right === 'number') {
        if (left < right) {
          // Sudah ditangani oleh aturan WATTAGE_SUFFICIENT
          passed = true;
        } else {
          const ratio = rule.thresholdRatio ?? 0.15;
          const headroomRatio = right > 0 ? (left - right) / right : 1;
          passed = headroomRatio >= ratio;
        }
      }
      break;
  }

  if (passed) {
    return null;
  }

  return {
    ruleId: rule.id,
    code: rule.code,
    testCaseRef: rule.testCaseRef,
    level: rule.level,
    severity: rule.severity,
    reason: rule.reason,
    remediation: rule.remediation,
    proposalNote: rule.proposalNote,
  };
}

export function evaluateRulesByCode(
  rules: CompatibilityRule[],
  codes: string[],
  context: RuleEvaluationContext,
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  for (const code of codes) {
    const rule = rules.find((r) => r.code === code);
    if (!rule) continue;
    const violation = evaluateDeclarativeRule(rule, context);
    if (violation) {
      violations.push(violation);
    }
  }
  return violations;
}
