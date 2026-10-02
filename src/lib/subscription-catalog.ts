import type { BillingCycle, SubscriptionKind } from './types';

export interface CatalogEntry {
  name: string;
  kind: SubscriptionKind;
  /** Approximate default price in THB; the user can edit it after adding. */
  defaultPrice: number;
  cycle: BillingCycle;
  /** Lower-case keywords used to match merchant names on slips/transactions. */
  keywords: string[];
}

export const SUBSCRIPTION_CATALOG: CatalogEntry[] = [
  { name: 'Netflix', kind: 'streaming', defaultPrice: 419, cycle: 'monthly', keywords: ['netflix'] },
  { name: 'YouTube Premium', kind: 'streaming', defaultPrice: 179, cycle: 'monthly', keywords: ['youtube', 'google youtube'] },
  { name: 'Spotify', kind: 'streaming', defaultPrice: 149, cycle: 'monthly', keywords: ['spotify'] },
  { name: 'Disney+ Hotstar', kind: 'streaming', defaultPrice: 289, cycle: 'monthly', keywords: ['disney', 'hotstar'] },
  { name: 'Prime Video', kind: 'streaming', defaultPrice: 149, cycle: 'monthly', keywords: ['prime video', 'amazon prime'] },
  { name: 'HBO Max', kind: 'streaming', defaultPrice: 249, cycle: 'monthly', keywords: ['hbo', 'max.com'] },
  { name: 'Viu', kind: 'streaming', defaultPrice: 119, cycle: 'monthly', keywords: ['viu'] },
  { name: 'iQIYI', kind: 'streaming', defaultPrice: 119, cycle: 'monthly', keywords: ['iqiyi'] },
  { name: 'Apple Music', kind: 'streaming', defaultPrice: 109, cycle: 'monthly', keywords: ['apple music'] },
  { name: 'ChatGPT Plus', kind: 'ai', defaultPrice: 750, cycle: 'monthly', keywords: ['openai', 'chatgpt'] },
  { name: 'Claude Pro', kind: 'ai', defaultPrice: 750, cycle: 'monthly', keywords: ['anthropic', 'claude'] },
  { name: 'Gemini Advanced', kind: 'ai', defaultPrice: 749, cycle: 'monthly', keywords: ['gemini', 'google one ai'] },
  { name: 'Midjourney', kind: 'ai', defaultPrice: 360, cycle: 'monthly', keywords: ['midjourney'] },
  { name: 'GitHub Copilot', kind: 'ai', defaultPrice: 360, cycle: 'monthly', keywords: ['github', 'copilot'] },
  { name: 'Perplexity Pro', kind: 'ai', defaultPrice: 720, cycle: 'monthly', keywords: ['perplexity'] },
  { name: 'Canva Pro', kind: 'app', defaultPrice: 300, cycle: 'monthly', keywords: ['canva'] },
  { name: 'Notion', kind: 'app', defaultPrice: 360, cycle: 'monthly', keywords: ['notion'] },
  { name: 'Adobe Creative Cloud', kind: 'app', defaultPrice: 1800, cycle: 'monthly', keywords: ['adobe'] },
  { name: 'Microsoft 365', kind: 'app', defaultPrice: 2590, cycle: 'yearly', keywords: ['microsoft', 'office 365', 'm365'] },
  { name: 'LINE Premium', kind: 'app', defaultPrice: 59, cycle: 'monthly', keywords: ['line premium', 'line corp'] },
  { name: 'iCloud+', kind: 'cloud', defaultPrice: 35, cycle: 'monthly', keywords: ['icloud', 'apple.com/bill'] },
  { name: 'Google One', kind: 'cloud', defaultPrice: 70, cycle: 'monthly', keywords: ['google one', 'google storage'] },
  { name: 'Dropbox', kind: 'cloud', defaultPrice: 400, cycle: 'monthly', keywords: ['dropbox'] },
];

export function matchCatalog(merchant: string): CatalogEntry | undefined {
  const m = merchant.toLowerCase();
  return SUBSCRIPTION_CATALOG.find((entry) => entry.keywords.some((k) => m.includes(k)));
}
