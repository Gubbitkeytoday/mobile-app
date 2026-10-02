import type { BillingCycle, SubscriptionKind } from './types';

export interface CatalogEntry {
  name: string;
  /** Brand-ish tint for the service sticker. */
  color: string;
  kind: SubscriptionKind;
  /** Approximate default price in THB; the user can edit it after adding. */
  defaultPrice: number;
  cycle: BillingCycle;
  /** Lower-case keywords used to match merchant names on slips/transactions. */
  keywords: string[];
}

export const SUBSCRIPTION_CATALOG: CatalogEntry[] = [
  { name: 'Netflix', color: '#E50914', kind: 'streaming', defaultPrice: 419, cycle: 'monthly', keywords: ['netflix'] },
  { name: 'YouTube Premium', color: '#FF0033', kind: 'streaming', defaultPrice: 179, cycle: 'monthly', keywords: ['youtube', 'google youtube'] },
  { name: 'Spotify', color: '#1DB954', kind: 'streaming', defaultPrice: 149, cycle: 'monthly', keywords: ['spotify'] },
  { name: 'Disney+ Hotstar', color: '#113CCF', kind: 'streaming', defaultPrice: 289, cycle: 'monthly', keywords: ['disney', 'hotstar'] },
  { name: 'Prime Video', color: '#00A8E1', kind: 'streaming', defaultPrice: 149, cycle: 'monthly', keywords: ['prime video', 'amazon prime'] },
  { name: 'HBO Max', color: '#5822B4', kind: 'streaming', defaultPrice: 249, cycle: 'monthly', keywords: ['hbo', 'max.com'] },
  { name: 'Viu', color: '#F5B800', kind: 'streaming', defaultPrice: 119, cycle: 'monthly', keywords: ['viu'] },
  { name: 'iQIYI', color: '#00C35A', kind: 'streaming', defaultPrice: 119, cycle: 'monthly', keywords: ['iqiyi'] },
  { name: 'Apple Music', color: '#FA2D48', kind: 'streaming', defaultPrice: 109, cycle: 'monthly', keywords: ['apple music'] },
  { name: 'ChatGPT Plus', color: '#10A37F', kind: 'ai', defaultPrice: 750, cycle: 'monthly', keywords: ['openai', 'chatgpt'] },
  { name: 'Claude Pro', color: '#D97757', kind: 'ai', defaultPrice: 750, cycle: 'monthly', keywords: ['anthropic', 'claude'] },
  { name: 'Gemini Advanced', color: '#4285F4', kind: 'ai', defaultPrice: 749, cycle: 'monthly', keywords: ['gemini', 'google one ai'] },
  { name: 'Midjourney', color: '#2B2140', kind: 'ai', defaultPrice: 360, cycle: 'monthly', keywords: ['midjourney'] },
  { name: 'GitHub Copilot', color: '#24292F', kind: 'ai', defaultPrice: 360, cycle: 'monthly', keywords: ['github', 'copilot'] },
  { name: 'Perplexity Pro', color: '#20808D', kind: 'ai', defaultPrice: 720, cycle: 'monthly', keywords: ['perplexity'] },
  { name: 'Canva Pro', color: '#00C4CC', kind: 'app', defaultPrice: 300, cycle: 'monthly', keywords: ['canva'] },
  { name: 'Notion', color: '#37352F', kind: 'app', defaultPrice: 360, cycle: 'monthly', keywords: ['notion'] },
  { name: 'Adobe Creative Cloud', color: '#FA0F00', kind: 'app', defaultPrice: 1800, cycle: 'monthly', keywords: ['adobe'] },
  { name: 'Microsoft 365', color: '#D83B01', kind: 'app', defaultPrice: 2590, cycle: 'yearly', keywords: ['microsoft', 'office 365', 'm365'] },
  { name: 'LINE Premium', color: '#06C755', kind: 'app', defaultPrice: 59, cycle: 'monthly', keywords: ['line premium', 'line corp'] },
  { name: 'iCloud+', color: '#3693F3', kind: 'cloud', defaultPrice: 35, cycle: 'monthly', keywords: ['icloud', 'apple.com/bill'] },
  { name: 'Google One', color: '#4285F4', kind: 'cloud', defaultPrice: 70, cycle: 'monthly', keywords: ['google one', 'google storage'] },
  { name: 'Dropbox', color: '#0061FF', kind: 'cloud', defaultPrice: 400, cycle: 'monthly', keywords: ['dropbox'] },
];

export function matchCatalog(merchant: string): CatalogEntry | undefined {
  const m = merchant.toLowerCase();
  return SUBSCRIPTION_CATALOG.find((entry) => entry.keywords.some((k) => m.includes(k)));
}

const FALLBACK_COLORS = ['#7B5CFF', '#FF7EB3', '#2FCB95', '#FF9A6B', '#5AB8FF', '#F5A524'];

/** Sticker color for any subscription name: catalog brand tint, else a stable pastel pick. */
export function serviceColor(name: string): string {
  const entry = matchCatalog(name);
  if (entry) return entry.color;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
