// Shared payment schedule utilities to keep calculations consistent across
// webhook, dashboard, and admin reporting.
// Business rules:
//  - True Limit = plan-specific utilization % of plan credit limit (rounded to 2 decimals)
//  - First payment = ceil(True Limit / 12) to 2 decimals
//  - Regular payment = floor(True Limit / 12) to 2 decimals
//  - Growth after N completed subscription payments (capped at 12) =
//      first + (N - 1) * regular (capped to True Limit)
//  - Current Balance = True Limit - Growth (never negative)
//  - Available Credit (display) = Plan Credit Limit - Current Balance
//  - Utilization % = Current Balance / Plan Credit Limit * 100

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Mapping of plan name or slug fragments to utilization rates.
// Starter / Power: 10%; Max: 8.4%; Blaster: 7.2%; Super / Star: 6%.
export function getPlanUtilizationRate(planNameOrSlug: string): number {
  if (!planNameOrSlug) return 0.1;
  const v = planNameOrSlug.toLowerCase();
  if (v.includes('starter')) return 0.1;
  if (v.includes('power')) return 0.1;
  if (v.includes('max')) return 0.084;
  if (v.includes('blaster')) return 0.072;
  if (v.includes('super')) return 0.06;
  if (v.includes('star')) return 0.06;
  return 0.1; // default fallback
}

// True Limit can vary by product. Provide rate override or derive from plan name.
export function getTrueLimit(creditLimit: number, rate: number = 0.1): number {
  if (!creditLimit || creditLimit <= 0) return 0;
  const r = Number.isFinite(rate) && rate > 0 ? rate : 0.1;
  return round2(creditLimit * r);
}

export function getFirstAndRegular(trueLimit: number): {
  first: number;
  regular: number;
} {
  if (!trueLimit || trueLimit <= 0) return { first: 0, regular: 0 };
  const regular = Math.floor((trueLimit / 12) * 100) / 100; // floor to 2 decimals
  const first = Math.ceil((trueLimit / 12) * 100) / 100; // ceil to 2 decimals
  return { first: round2(first), regular: round2(regular) };
}

export function getScheduledGrowth(
  completedCountRaw: number,
  trueLimit: number
): number {
  if (!trueLimit || trueLimit <= 0) return 0;
  const completedCount = Math.min(
    12,
    Math.max(0, Math.floor(completedCountRaw))
  );
  if (completedCount === 0) return 0;
  const { first, regular } = getFirstAndRegular(trueLimit);
  let growth = first + (completedCount - 1) * regular;
  growth = round2(growth);
  if (growth > trueLimit) growth = trueLimit; // cap at True Limit
  return growth;
}

export function getBalanceMetrics(
  creditLimit: number,
  completedCountRaw: number,
  rate?: number
): {
  trueLimit: number;
  first: number;
  regular: number;
  growth: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPct: number;
} {
  const trueLimit = getTrueLimit(creditLimit, rate);
  const { first, regular } = getFirstAndRegular(trueLimit);
  const growth = getScheduledGrowth(completedCountRaw, trueLimit);
  let currentBalance = round2(trueLimit - growth);
  if (currentBalance < 0) currentBalance = 0;
  const availableCredit = round2(creditLimit - currentBalance);
  const utilizationPct =
    creditLimit > 0
      ? Math.min(100, Math.max(0, (currentBalance / creditLimit) * 100))
      : 0;
  return {
    trueLimit,
    first,
    regular,
    growth,
    currentBalance,
    availableCredit,
    utilizationPct,
  };
}

export function getPastDueMetrics(
  activationMonth: Date | null,
  targetMonthStart: Date,
  closedMonthStart: Date | null,
  completedCountRaw: number,
  trueLimit: number
): {
  expectedCount: number;
  completedCount: number;
  expectedSum: number;
  completedSum: number;
  amountPastDue: number;
} {
  const { first, regular } = getFirstAndRegular(trueLimit);
  let expectedCount = 0;
  if (activationMonth) {
    const end =
      closedMonthStart && closedMonthStart < targetMonthStart
        ? closedMonthStart
        : targetMonthStart;
    // Inclusive month diff
    const start = new Date(
      activationMonth.getFullYear(),
      activationMonth.getMonth(),
      1
    );
    const endNorm = new Date(end.getFullYear(), end.getMonth(), 1);
    const diff =
      (endNorm.getFullYear() - start.getFullYear()) * 12 +
      (endNorm.getMonth() - start.getMonth()) +
      1;
    expectedCount = Math.min(12, Math.max(0, diff));
  }
  const completedCount = Math.min(
    12,
    Math.max(0, Math.floor(completedCountRaw))
  );
  const expectedSum =
    expectedCount > 0
      ? round2(first + round2((expectedCount - 1) * regular))
      : 0;
  const completedSum =
    completedCount > 0
      ? round2(first + round2((completedCount - 1) * regular))
      : 0;
  const amountPastDue = Math.max(0, round2(expectedSum - completedSum));
  return {
    expectedCount,
    completedCount,
    expectedSum,
    completedSum,
    amountPastDue,
  };
}
