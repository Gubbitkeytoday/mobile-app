import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { localCoachReport, summarizeMonth } from '../analytics';
import { auditAll, auditSubscription, detectRecurring, monthlyCost, upcomingBillingDate } from '../audit';
import { addDays, addMonths, daysBetween, isValidISODate } from '../dates';
import { mascotLine } from '../mascot';
import type { Subscription, Transaction } from '../types';

const TODAY = '2026-10-02';

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 's1',
    name: 'Netflix',
    kind: 'streaming',
    price: 419,
    cycle: 'monthly',
    nextBillingDate: '2026-10-10',
    startedAt: '2025-01-01',
    usageLog: [],
    targetUsesPerMonth: 8,
    remindBeforeDays: 2,
    ...overrides,
  };
}

function tx(date: string, merchant: string, amount: number, category: Transaction['category'] = 'other'): Transaction {
  return { id: `${date}-${merchant}`, date, merchant, amount, category, source: 'manual' };
}

describe('dates', () => {
  it('clamps month-end when adding months', () => {
    assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
    assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
    assert.equal(addMonths('2026-12-15', 1), '2027-01-15');
  });

  it('computes day differences', () => {
    assert.equal(daysBetween('2026-09-30', '2026-10-02'), 2);
    assert.equal(addDays('2026-10-02', -30), '2026-09-02');
  });

  it('validates ISO dates', () => {
    assert.ok(isValidISODate('2026-02-28'));
    assert.ok(!isValidISODate('2026-02-30'));
    assert.ok(!isValidISODate('02/10/2026'));
    assert.ok(!isValidISODate(null));
  });
});

describe('monthlyCost', () => {
  it('normalizes billing cycles to a monthly figure', () => {
    assert.equal(monthlyCost(300, 'monthly'), 300);
    assert.equal(monthlyCost(1200, 'yearly'), 100);
    assert.equal(monthlyCost(120, 'weekly'), 520);
  });
});

describe('auditSubscription', () => {
  it('flags a subscription with no use in 30 days as unused', () => {
    const a = auditSubscription(sub({ usageLog: ['2026-08-01'] }), TODAY);
    assert.equal(a.status, 'unused');
    assert.equal(a.usesLast30Days, 0);
    assert.equal(a.daysSinceLastUse, 62);
    assert.equal(a.costPerUse, null);
    assert.equal(a.potentialMonthlySaving, 419);
  });

  it('gives new subscriptions a grace period', () => {
    const a = auditSubscription(sub({ startedAt: '2026-09-25' }), TODAY);
    assert.equal(a.status, 'new');
    assert.equal(a.potentialMonthlySaving, 0);
  });

  it('marks below-half-target usage as underused and computes cost per use', () => {
    const a = auditSubscription(sub({ usageLog: ['2026-09-20', '2026-09-28'] }), TODAY);
    assert.equal(a.status, 'underused');
    assert.equal(a.usesLast30Days, 2);
    assert.equal(a.valueScore, 25);
    assert.equal(a.costPerUse, 209.5);
  });

  it('marks frequent use as healthy and ignores future-dated usage', () => {
    const log = ['2026-09-05', '2026-09-10', '2026-09-15', '2026-09-20', '2026-10-01', '2026-10-05'];
    const a = auditSubscription(sub({ usageLog: log }), TODAY);
    assert.equal(a.usesLast30Days, 5);
    assert.equal(a.status, 'healthy');
    assert.equal(a.daysSinceLastUse, 1);
  });

  it('only counts uses strictly inside the 30-day window', () => {
    const a = auditSubscription(sub({ usageLog: ['2026-09-02', '2026-09-03'] }), TODAY);
    assert.equal(a.usesLast30Days, 1);
  });
});

describe('upcomingBillingDate', () => {
  it('rolls a past billing date forward by cycle', () => {
    assert.equal(upcomingBillingDate(sub({ nextBillingDate: '2026-07-15' }), TODAY), '2026-10-15');
    assert.equal(
      upcomingBillingDate(sub({ nextBillingDate: '2025-03-01', cycle: 'yearly' }), TODAY),
      '2027-03-01',
    );
    assert.equal(upcomingBillingDate(sub({ nextBillingDate: TODAY }), TODAY), TODAY);
  });
});

describe('auditAll', () => {
  it('totals costs, excludes cancelled subscriptions and lists renewals', () => {
    const summary = auditAll(
      [
        sub({ id: 'a', nextBillingDate: '2026-10-04' }),
        sub({ id: 'b', name: 'Canva', price: 1200, cycle: 'yearly', usageLog: ['2026-10-01'], targetUsesPerMonth: 1 }),
        sub({ id: 'c', cancelled: true }),
      ],
      TODAY,
    );
    assert.equal(summary.audits.length, 2);
    assert.equal(summary.totalMonthly, 519);
    assert.equal(summary.potentialMonthlySaving, 419);
    assert.equal(summary.flaggedCount, 1);
    assert.deepEqual(
      summary.renewingSoon.map((a) => a.subscription.id),
      ['a'],
    );
    // Unused subscriptions sort first.
    assert.equal(summary.audits[0].subscription.id, 'a');
  });
});

describe('detectRecurring', () => {
  it('detects monthly charges of a similar amount', () => {
    const result = detectRecurring(
      [tx('2026-08-05', 'Gym Club', 990), tx('2026-09-05', 'Gym Club', 990), tx('2026-09-06', 'Cafe', 80)],
      [],
    );
    assert.deepEqual(result, [
      { merchant: 'Gym Club', amount: 990, cycle: 'monthly', lastChargedAt: '2026-09-05', occurrences: 2 },
    ]);
  });

  it('detects known services from a single charge and skips tracked ones', () => {
    const txs = [tx('2026-09-20', 'SPOTIFY P1234', 149), tx('2026-09-12', 'NETFLIX.COM', 419)];
    const result = detectRecurring(txs, [sub({ name: 'Netflix' })]);
    assert.equal(result.length, 1);
    assert.equal(result[0].merchant, 'Spotify');
  });

  it('does not treat recurring utility bills as subscriptions', () => {
    const result = detectRecurring(
      [tx('2026-08-05', 'MEA', 1500, 'bills'), tx('2026-09-05', 'MEA', 1550, 'bills')],
      [],
    );
    assert.equal(result.length, 0);
  });

  it('ignores irregular charges', () => {
    const result = detectRecurring([tx('2026-09-01', 'Shop', 100), tx('2026-09-15', 'Shop', 100)], []);
    assert.equal(result.length, 0);
  });
});

describe('analytics', () => {
  const txs = [
    tx('2026-10-01', 'A', 600, 'food'),
    tx('2026-10-02', 'B', 400, 'transport'),
    tx('2026-09-10', 'C', 800, 'food'),
  ];

  it('summarizes a month by category with change vs previous month', () => {
    const m = summarizeMonth(txs, '2026-10');
    assert.equal(m.total, 1000);
    assert.equal(m.previousTotal, 800);
    assert.equal(m.change, 0.25);
    assert.deepEqual(
      m.byCategory.map((c) => [c.category, c.total, c.share]),
      [
        ['food', 600, 0.6],
        ['transport', 400, 0.4],
      ],
    );
  });

  it('compares a partial month with the same days of the previous month', () => {
    const m = summarizeMonth([...txs, tx('2026-09-01', 'D', 200, 'food')], '2026-10', 2);
    assert.equal(m.previousTotal, 200);
    assert.equal(m.change, 4);
  });

  it('local coach recommends cancelling unused subscriptions without double counting', () => {
    const audit = auditAll(
      [
        sub({ id: 'a', name: 'ChatGPT Plus', kind: 'ai', price: 750 }),
        sub({ id: 'b', name: 'Claude Pro', kind: 'ai', price: 750, usageLog: ['2026-10-01'], targetUsesPerMonth: 1 }),
      ],
      TODAY,
    );
    const report = localCoachReport(summarizeMonth(txs, '2026-10'), audit);
    assert.equal(report.source, 'local');
    const cancel = report.actions.find((a) => a.title.includes('ChatGPT Plus'));
    assert.equal(cancel?.estimatedMonthlySaving, 750);
    // Only one healthy AI tool remains, so no duplicate-AI suggestion.
    assert.ok(!report.actions.some((a) => a.title.includes('ซ้ำซ้อน')));
  });
});

describe('mascotLine', () => {
  const month = (change: number | null, count = 3) => ({
    month: '2026-10',
    total: 1000,
    count,
    previousTotal: 800,
    change,
    byCategory: [],
  });

  it('falls asleep when a subscription is unused, in both tones', () => {
    const audit = auditAll([sub({ usageLog: [] })], TODAY);
    const hype = mascotLine(month(0), audit, 'hype');
    const roast = mascotLine(month(0), audit, 'roast');
    assert.equal(hype.mood, 'sleepy');
    assert.equal(roast.mood, 'sleepy');
    assert.notEqual(hype.message, roast.message);
    assert.ok(hype.message.includes('Netflix'));
  });

  it('worries about overspending and celebrates saving', () => {
    const none = auditAll([], TODAY);
    assert.equal(mascotLine(month(0.5), none, 'hype').mood, 'worried');
    assert.equal(mascotLine(month(-0.3), none, 'hype').mood, 'excited');
    assert.equal(mascotLine(month(0.05), none, 'hype').mood, 'happy');
    assert.equal(mascotLine(month(null, 0), none, 'hype').mood, 'thinking');
  });
});
