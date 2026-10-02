import { addDays } from './dates';
import type { Subscription, Transaction } from './types';

/** Sample data so the app has something to show on first launch. */
export function buildDemoData(today: string): { transactions: Transaction[]; subscriptions: Subscription[] } {
  const d = (offset: number) => addDays(today, offset);
  let n = 0;
  const tx = (offset: number, merchant: string, amount: number, category: Transaction['category']): Transaction => ({
    id: `demo-tx-${n++}`,
    amount,
    merchant,
    category,
    date: d(offset),
    source: 'manual',
  });

  const subscriptions: Subscription[] = [
    {
      id: 'demo-sub-netflix',
      name: 'Netflix',
      kind: 'streaming',
      price: 419,
      cycle: 'monthly',
      nextBillingDate: d(3),
      startedAt: d(-400),
      usageLog: [d(-41), d(-52)],
      targetUsesPerMonth: 8,
      remindBeforeDays: 2,
    },
    {
      id: 'demo-sub-spotify',
      name: 'Spotify',
      kind: 'streaming',
      price: 149,
      cycle: 'monthly',
      nextBillingDate: d(12),
      startedAt: d(-700),
      usageLog: Array.from({ length: 20 }, (_, i) => d(-Math.floor(i * 1.5))),
      targetUsesPerMonth: 10,
      remindBeforeDays: 2,
    },
    {
      id: 'demo-sub-chatgpt',
      name: 'ChatGPT Plus',
      kind: 'ai',
      price: 750,
      cycle: 'monthly',
      nextBillingDate: d(6),
      startedAt: d(-200),
      usageLog: [d(-2), d(-9), d(-20)],
      targetUsesPerMonth: 12,
      remindBeforeDays: 3,
    },
    {
      id: 'demo-sub-claude',
      name: 'Claude Pro',
      kind: 'ai',
      price: 750,
      cycle: 'monthly',
      nextBillingDate: d(18),
      startedAt: d(-120),
      usageLog: Array.from({ length: 16 }, (_, i) => d(-i * 2)),
      targetUsesPerMonth: 12,
      remindBeforeDays: 3,
    },
    {
      id: 'demo-sub-canva',
      name: 'Canva Pro',
      kind: 'app',
      price: 3000,
      cycle: 'yearly',
      nextBillingDate: d(45),
      startedAt: d(-320),
      usageLog: [d(-75)],
      targetUsesPerMonth: 4,
      remindBeforeDays: 7,
    },
  ];

  const transactions: Transaction[] = [
    tx(0, 'Starbucks', 145, 'food'),
    tx(-1, 'Grab', 189, 'transport'),
    tx(-1, '7-Eleven', 86, 'food'),
    tx(-2, 'Lotus', 1240, 'shopping'),
    tx(-3, 'BTS', 62, 'transport'),
    tx(-4, 'MEA ค่าไฟ', 1580, 'bills'),
    tx(-5, 'Shopee', 690, 'shopping'),
    tx(-6, 'ร้านข้าวมันไก่', 60, 'food'),
    tx(-8, 'Major Cineplex', 420, 'entertainment'),
    tx(-10, 'Netflix', 419, 'subscription'),
    tx(-12, 'OpenAI ChatGPT', 750, 'subscription'),
    tx(-14, 'Watsons', 320, 'health'),
    tx(-20, 'Grab', 230, 'transport'),
    tx(-26, 'YouTube Premium', 179, 'subscription'),
    tx(-33, 'Lotus', 980, 'shopping'),
    tx(-35, 'MEA ค่าไฟ', 1490, 'bills'),
    tx(-40, 'Netflix', 419, 'subscription'),
    tx(-42, 'OpenAI ChatGPT', 750, 'subscription'),
    tx(-45, 'Starbucks', 290, 'food'),
    tx(-56, 'YouTube Premium', 179, 'subscription'),
  ];
  // Link charges to tracked subscriptions where one exists.
  for (const t of transactions) {
    const sub = subscriptions.find((s) => t.merchant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()));
    if (sub) t.subscriptionId = sub.id;
  }
  return { transactions, subscriptions };
}
