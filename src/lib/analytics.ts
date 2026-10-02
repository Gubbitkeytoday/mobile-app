import type { AuditSummary } from './audit';
import { CATEGORIES } from './categories';
import { monthKey, previousMonthKey } from './dates';
import { formatTHB } from './format';
import type { CoachTone } from './mascot';
import type { CategoryId, CoachReport, Transaction } from './types';

export interface CategoryTotal {
  category: CategoryId;
  total: number;
  share: number; // 0–1
}

export interface MonthSummary {
  month: string; // YYYY-MM
  total: number;
  count: number;
  previousTotal: number;
  /** Fractional change vs. previous month, null when there is no previous data. */
  change: number | null;
  byCategory: CategoryTotal[];
}

/**
 * Totals for `month`. Pass `uptoDay` (day of month) for the current, partial
 * month so the previous month is compared over the same days only.
 */
export function summarizeMonth(transactions: Transaction[], month: string, uptoDay?: number): MonthSummary {
  const prevMonth = previousMonthKey(month);
  const current = transactions.filter((t) => monthKey(t.date) === month);
  const previousTotal = transactions
    .filter((t) => monthKey(t.date) === prevMonth && (uptoDay === undefined || Number(t.date.slice(8, 10)) <= uptoDay))
    .reduce((s, t) => s + t.amount, 0);
  const total = current.reduce((s, t) => s + t.amount, 0);

  const totals = new Map<CategoryId, number>();
  for (const t of current) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  const byCategory = [...totals.entries()]
    .map(([category, sum]) => ({ category, total: sum, share: total ? sum / total : 0 }))
    .sort((a, b) => b.total - a.total);

  return {
    month,
    total,
    count: current.length,
    previousTotal,
    change: previousTotal ? (total - previousTotal) / previousTotal : null,
    byCategory,
  };
}

/** Rule-based coaching used when the AI backend is not configured or unreachable. */
export function localCoachReport(month: MonthSummary, audit: AuditSummary, tone: CoachTone = 'hype'): CoachReport {
  const insights: string[] = [];
  const actions: CoachReport['actions'] = [];

  if (month.change !== null) {
    const pct = Math.round(Math.abs(month.change) * 100);
    insights.push(
      month.change > 0
        ? `เดือนนี้ใช้จ่ายมากกว่าช่วงเดียวกันของเดือนก่อน ${pct}% (${formatTHB(month.total)} เทียบกับ ${formatTHB(month.previousTotal)})`
        : `เดือนนี้ใช้จ่ายน้อยกว่าช่วงเดียวกันของเดือนก่อน ${pct}% เยี่ยมมาก!`,
    );
  }

  const top = month.byCategory[0];
  if (top) {
    insights.push(
      `หมวดที่ใช้มากที่สุดคือ "${CATEGORIES[top.category].label}" ${formatTHB(top.total)} (${Math.round(top.share * 100)}% ของทั้งหมด)`,
    );
    if (top.share > 0.4 && top.category !== 'bills' && top.category !== 'transfer') {
      actions.push({
        title: `ตั้งงบหมวด${CATEGORIES[top.category].label}`,
        detail: `ลองตั้งเพดานไว้ที่ ${formatTHB(Math.round(top.total * 0.85))} ต่อเดือน (ลด 15%)`,
        estimatedMonthlySaving: Math.round(top.total * 0.15),
      });
    }
  }

  if (audit.audits.length) {
    insights.push(
      `ค่าซับสคริปชันรวม ${formatTHB(Math.round(audit.totalMonthly))}/เดือน หรือ ${formatTHB(Math.round(audit.totalYearly))}/ปี`,
    );
  }

  for (const a of audit.audits) {
    if (a.status === 'unused') {
      actions.push({
        title: `ยกเลิก ${a.subscription.name}`,
        detail:
          a.daysSinceLastUse === null
            ? 'ยังไม่มีบันทึกการใช้งานเลยตั้งแต่สมัคร'
            : `ไม่ได้ใช้มา ${a.daysSinceLastUse} วันแล้ว`,
        estimatedMonthlySaving: Math.round(a.monthlyCost),
      });
    } else if (a.status === 'underused' && a.costPerUse !== null) {
      actions.push({
        title: `ทบทวน ${a.subscription.name}`,
        detail: `ใช้แค่ ${a.usesLast30Days} ครั้งใน 30 วัน ตกครั้งละ ${formatTHB(Math.round(a.costPerUse))} — พิจารณาแพ็กเกจถูกลงหรือแชร์บัญชีครอบครัว`,
        estimatedMonthlySaving: Math.round(a.monthlyCost),
      });
    }
  }

  // Only subscriptions not already flagged above, so savings aren't double-counted.
  const aiSubs = audit.audits.filter(
    (a) => a.subscription.kind === 'ai' && a.potentialMonthlySaving === 0,
  );
  if (aiSubs.length >= 2) {
    actions.push({
      title: 'มี AI Tools ซ้ำซ้อน',
      detail: `สมัคร AI ${aiSubs.length} ตัว (${aiSubs.map((a) => a.subscription.name).join(', ')}) — เก็บตัวที่ใช้บ่อยที่สุดไว้ตัวเดียว`,
      estimatedMonthlySaving: Math.round(
        aiSubs
          .map((a) => a.monthlyCost)
          .sort((x, y) => x - y)
          .slice(0, -1)
          .reduce((s, c) => s + c, 0),
      ),
    });
  }

  const totalSaving = actions.reduce((s, a) => s + a.estimatedMonthlySaving, 0);
  return {
    headline:
      totalSaving > 0
        ? tone === 'roast'
          ? `เงิน ~${formatTHB(totalSaving)}/เดือน กำลังรั่วออกไปแบบไม่รู้ตัวนะ 🫣`
          : `ประหยัดได้สูงสุด ~${formatTHB(totalSaving)}/เดือนเลยนะ ✨`
        : tone === 'roast'
          ? 'ไม่มีอะไรให้แซวเลย น่าเบื่อจัง 😏'
          : 'การใช้จ่ายของคุณดูสมดุลดีมาก 👍',
    insights,
    actions: actions.sort((a, b) => b.estimatedMonthlySaving - a.estimatedMonthlySaving),
    source: 'local',
  };
}
