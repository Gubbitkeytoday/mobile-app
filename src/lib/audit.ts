import { addDays, addMonths, daysBetween } from './dates';
import { matchCatalog } from './subscription-catalog';
import type { BillingCycle, CategoryId, Subscription, Transaction } from './types';

/** A subscription younger than this is not judged on usage yet. */
const GRACE_PERIOD_DAYS = 14;
const USAGE_WINDOW_DAYS = 30;

export type UsageStatus = 'new' | 'unused' | 'underused' | 'healthy';

export interface SubscriptionAudit {
  subscription: Subscription;
  monthlyCost: number;
  usesLast30Days: number;
  daysSinceLastUse: number | null;
  /** THB per use over the last 30 days; null when there were no uses. */
  costPerUse: number | null;
  /** 0–100: actual uses vs. the user's target. */
  valueScore: number;
  status: UsageStatus;
  /** Monthly THB saved by cancelling, counted only for unused/underused subscriptions. */
  potentialMonthlySaving: number;
  nextBillingDate: string;
  daysUntilBilling: number;
}

export function monthlyCost(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return (price * 52) / 12;
    case 'monthly':
      return price;
    case 'yearly':
      return price / 12;
  }
}

export function advanceBillingDate(iso: string, cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly':
      return addDays(iso, 7);
    case 'monthly':
      return addMonths(iso, 1);
    case 'yearly':
      return addMonths(iso, 12);
  }
}

/** Rolls a stored billing date forward until it is today or later. */
export function upcomingBillingDate(sub: Subscription, today: string): string {
  let next = sub.nextBillingDate;
  // Bounded loop guards against corrupt far-past dates.
  for (let i = 0; i < 1000 && daysBetween(today, next) < 0; i++) {
    next = advanceBillingDate(next, sub.cycle);
  }
  return next;
}

export function auditSubscription(sub: Subscription, today: string): SubscriptionAudit {
  const cost = monthlyCost(sub.price, sub.cycle);
  const windowStart = addDays(today, -USAGE_WINDOW_DAYS);
  const pastUses = sub.usageLog.filter((d) => daysBetween(d, today) >= 0);
  const recentUses = pastUses.filter((d) => daysBetween(windowStart, d) > 0);
  const lastUse = pastUses.length ? pastUses.reduce((a, b) => (a > b ? a : b)) : null;
  const daysSinceLastUse = lastUse ? daysBetween(lastUse, today) : null;
  const target = Math.max(1, sub.targetUsesPerMonth);
  const valueScore = Math.min(100, Math.round((recentUses.length / target) * 100));
  const ageDays = daysBetween(sub.startedAt, today);

  let status: UsageStatus;
  if (recentUses.length === 0 && ageDays < GRACE_PERIOD_DAYS) status = 'new';
  else if (recentUses.length === 0) status = 'unused';
  else if (valueScore < 50) status = 'underused';
  else status = 'healthy';

  const nextBillingDate = upcomingBillingDate(sub, today);

  return {
    subscription: sub,
    monthlyCost: cost,
    usesLast30Days: recentUses.length,
    daysSinceLastUse,
    costPerUse: recentUses.length ? cost / recentUses.length : null,
    valueScore,
    status,
    potentialMonthlySaving: status === 'unused' || status === 'underused' ? cost : 0,
    nextBillingDate,
    daysUntilBilling: daysBetween(today, nextBillingDate),
  };
}

export interface AuditSummary {
  audits: SubscriptionAudit[];
  totalMonthly: number;
  totalYearly: number;
  potentialMonthlySaving: number;
  flaggedCount: number;
  renewingSoon: SubscriptionAudit[];
}

const STATUS_ORDER: Record<UsageStatus, number> = { unused: 0, underused: 1, new: 2, healthy: 3 };

export function auditAll(subs: Subscription[], today: string, renewalWindowDays = 7): AuditSummary {
  const audits = subs
    .filter((s) => !s.cancelled)
    .map((s) => auditSubscription(s, today))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.monthlyCost - a.monthlyCost,
    );
  const totalMonthly = audits.reduce((sum, a) => sum + a.monthlyCost, 0);
  const potentialMonthlySaving = audits.reduce((sum, a) => sum + a.potentialMonthlySaving, 0);
  return {
    audits,
    totalMonthly,
    totalYearly: totalMonthly * 12,
    potentialMonthlySaving,
    flaggedCount: audits.filter((a) => a.status === 'unused' || a.status === 'underused').length,
    renewingSoon: audits
      .filter((a) => a.daysUntilBilling <= renewalWindowDays)
      .sort((a, b) => a.daysUntilBilling - b.daysUntilBilling),
  };
}

export interface RecurringCandidate {
  merchant: string;
  amount: number;
  cycle: BillingCycle;
  lastChargedAt: string;
  occurrences: number;
}

/** Regular charges in these categories (utilities, transfers, groceries…) are not subscriptions. */
const NON_SUBSCRIPTION_CATEGORIES: ReadonlySet<CategoryId> = new Set([
  'bills',
  'transfer',
  'food',
  'transport',
  'shopping',
]);

function normalizeMerchant(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, ' ').trim();
}

function cycleForGap(days: number): BillingCycle | null {
  if (days >= 6 && days <= 8) return 'weekly';
  if (days >= 26 && days <= 35) return 'monthly';
  if (days >= 355 && days <= 375) return 'yearly';
  return null;
}

/**
 * Finds charges that look like subscriptions but aren't tracked yet:
 * either a merchant from the known catalog, or the same merchant charging a
 * similar amount (±10%) at a regular weekly/monthly/yearly interval.
 */
export function detectRecurring(
  transactions: Transaction[],
  tracked: Subscription[],
): RecurringCandidate[] {
  const trackedNames = new Set(tracked.map((s) => normalizeMerchant(s.name)));
  const isTracked = (merchant: string) => {
    const n = normalizeMerchant(merchant);
    if (trackedNames.has(n)) return true;
    const entry = matchCatalog(merchant);
    return !!entry && trackedNames.has(normalizeMerchant(entry.name));
  };

  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.subscriptionId || isTracked(t.merchant)) continue;
    if (NON_SUBSCRIPTION_CATEGORIES.has(t.category) && !matchCatalog(t.merchant)) continue;
    const key = normalizeMerchant(t.merchant);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const candidates: RecurringCandidate[] = [];
  for (const txs of groups.values()) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const last = sorted[sorted.length - 1];
    const catalog = matchCatalog(last.merchant);

    let cycle: BillingCycle | null = null;
    if (sorted.length >= 2) {
      const prev = sorted[sorted.length - 2];
      const similar = Math.abs(prev.amount - last.amount) <= last.amount * 0.1;
      if (similar) cycle = cycleForGap(daysBetween(prev.date, last.date));
    }
    if (!cycle && catalog) cycle = catalog.cycle;
    if (!cycle) continue;

    candidates.push({
      merchant: catalog?.name ?? last.merchant,
      amount: last.amount,
      cycle,
      lastChargedAt: last.date,
      occurrences: sorted.length,
    });
  }
  return candidates.sort((a, b) => b.amount - a.amount);
}
