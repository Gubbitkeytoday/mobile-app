import type { CategoryId, SubscriptionKind } from './types';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: string; // Ionicons name
  color: string;
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  food: { id: 'food', label: 'อาหาร/เครื่องดื่ม', icon: 'fast-food-outline', color: '#F97316' },
  transport: { id: 'transport', label: 'เดินทาง', icon: 'car-outline', color: '#0EA5E9' },
  shopping: { id: 'shopping', label: 'ช้อปปิ้ง', icon: 'bag-handle-outline', color: '#EC4899' },
  bills: { id: 'bills', label: 'บิล/ค่าน้ำไฟ', icon: 'receipt-outline', color: '#EAB308' },
  subscription: { id: 'subscription', label: 'ซับสคริปชัน', icon: 'repeat-outline', color: '#8B5CF6' },
  health: { id: 'health', label: 'สุขภาพ', icon: 'medkit-outline', color: '#10B981' },
  entertainment: { id: 'entertainment', label: 'บันเทิง', icon: 'game-controller-outline', color: '#6366F1' },
  education: { id: 'education', label: 'การศึกษา', icon: 'school-outline', color: '#14B8A6' },
  transfer: { id: 'transfer', label: 'โอนเงิน', icon: 'swap-horizontal-outline', color: '#64748B' },
  other: { id: 'other', label: 'อื่นๆ', icon: 'ellipsis-horizontal-circle-outline', color: '#94A3B8' },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && value in CATEGORIES;
}

export const SUBSCRIPTION_KINDS: Record<SubscriptionKind, { label: string; icon: string }> = {
  streaming: { label: 'Streaming', icon: 'play-circle-outline' },
  ai: { label: 'AI Tools', icon: 'sparkles-outline' },
  app: { label: 'Apps', icon: 'apps-outline' },
  cloud: { label: 'Cloud/Storage', icon: 'cloud-outline' },
  other: { label: 'อื่นๆ', icon: 'pricetag-outline' },
};
