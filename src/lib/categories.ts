import type { CategoryId, SubscriptionKind } from './types';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
  /** Chart/accent color. */
  color: string;
  /** Pastel tile background. */
  soft: string;
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  food: { id: 'food', label: 'อาหาร/เครื่องดื่ม', emoji: '🍜', color: '#FF9A6B', soft: '#FFE6D9' },
  transport: { id: 'transport', label: 'เดินทาง', emoji: '🚕', color: '#5AB8FF', soft: '#DFF1FF' },
  shopping: { id: 'shopping', label: 'ช้อปปิ้ง', emoji: '🛍️', color: '#FF7EB3', soft: '#FFE3EF' },
  bills: { id: 'bills', label: 'บิล/ค่าน้ำไฟ', emoji: '💡', color: '#FFC93C', soft: '#FFF3CC' },
  subscription: { id: 'subscription', label: 'ซับสคริปชัน', emoji: '🔁', color: '#7B5CFF', soft: '#ECE6FF' },
  health: { id: 'health', label: 'สุขภาพ', emoji: '💊', color: '#2FCB95', soft: '#DDF8EC' },
  entertainment: { id: 'entertainment', label: 'บันเทิง', emoji: '🎮', color: '#B07CFF', soft: '#F1E6FF' },
  education: { id: 'education', label: 'การศึกษา', emoji: '📚', color: '#26C6DA', soft: '#DAF6FA' },
  transfer: { id: 'transfer', label: 'โอนเงิน', emoji: '💸', color: '#8D99AE', soft: '#ECEFF4' },
  other: { id: 'other', label: 'อื่นๆ', emoji: '✨', color: '#C3A8D9', soft: '#F4ECFA' },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && value in CATEGORIES;
}

export const SUBSCRIPTION_KINDS: Record<SubscriptionKind, { label: string; emoji: string }> = {
  streaming: { label: 'Streaming', emoji: '🎬' },
  ai: { label: 'AI Tools', emoji: '🤖' },
  app: { label: 'Apps', emoji: '📱' },
  cloud: { label: 'Cloud', emoji: '☁️' },
  other: { label: 'อื่นๆ', emoji: '🏷️' },
};
