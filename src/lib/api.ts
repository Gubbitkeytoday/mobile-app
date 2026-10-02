import { isCategoryId } from './categories';
import { isValidISODate } from './dates';
import type { CoachReport, SlipScanResult } from './types';

/** Base URL of the backend in /server, e.g. http://192.168.1.10:8787 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

export const isApiConfigured = () => API_URL.length > 0;

export class ApiError extends Error {}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!isApiConfigured()) throw new ApiError('ยังไม่ได้ตั้งค่า EXPO_PUBLIC_API_URL');
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.error ?? `เซิร์ฟเวอร์ตอบกลับ ${res.status}`);
  return json as T;
}

export async function scanSlip(imageBase64: string, mediaType: string): Promise<SlipScanResult> {
  const r = await post<SlipScanResult>('/api/scan-slip', { imageBase64, mediaType });
  if (typeof r?.amount !== 'number' || typeof r.merchant !== 'string') {
    throw new ApiError('ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  }
  return {
    ...r,
    category: isCategoryId(r.category) ? r.category : 'other',
    date: isValidISODate(r.date) ? r.date : null,
  };
}

export interface CoachRequest {
  month: string;
  totalSpent: number;
  previousMonthTotal: number;
  byCategory: { category: string; total: number }[];
  subscriptions: {
    name: string;
    kind: string;
    monthlyCost: number;
    usesLast30Days: number;
    targetUsesPerMonth: number;
    daysSinceLastUse: number | null;
    status: string;
  }[];
  question?: string;
  tone?: 'hype' | 'roast';
}

export async function fetchCoachReport(req: CoachRequest): Promise<CoachReport> {
  const r = await post<Omit<CoachReport, 'source'>>('/api/coach', req);
  if (typeof r?.headline !== 'string' || !Array.isArray(r.insights) || !Array.isArray(r.actions)) {
    throw new ApiError('ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  }
  return { ...r, source: 'ai' };
}
