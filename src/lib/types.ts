export type CategoryId =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'subscription'
  | 'health'
  | 'entertainment'
  | 'education'
  | 'transfer'
  | 'other';

export type TransactionSource = 'manual' | 'slip';

export interface Transaction {
  id: string;
  amount: number; // THB, always positive (expense)
  merchant: string;
  category: CategoryId;
  date: string; // ISO date (YYYY-MM-DD)
  note?: string;
  source: TransactionSource;
  subscriptionId?: string;
}

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export type SubscriptionKind = 'streaming' | 'ai' | 'app' | 'cloud' | 'other';

export interface Subscription {
  id: string;
  name: string;
  kind: SubscriptionKind;
  price: number; // THB per billing cycle
  cycle: BillingCycle;
  nextBillingDate: string; // ISO date
  startedAt: string; // ISO date
  /** ISO dates on which the user said they used this service. */
  usageLog: string[];
  /** Times per month the user expects to use it to be "worth it". */
  targetUsesPerMonth: number;
  remindBeforeDays: number;
  cancelled?: boolean;
}

export interface SlipScanResult {
  merchant: string;
  amount: number;
  date: string | null;
  category: CategoryId;
  isSubscription: boolean;
  subscriptionName: string | null;
  confidence: 'high' | 'medium' | 'low';
  note: string | null;
}

export interface CoachAction {
  title: string;
  detail: string;
  estimatedMonthlySaving: number;
}

export interface CoachReport {
  headline: string;
  insights: string[];
  actions: CoachAction[];
  source: 'ai' | 'local';
}
