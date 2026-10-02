import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

const MODEL = 'claude-opus-5-5';
// Re-runs a request on Anthropic's recommended fallback model if the primary model declines it.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const client = new Anthropic();

export const CATEGORY_IDS = [
  'food',
  'transport',
  'shopping',
  'bills',
  'subscription',
  'health',
  'entertainment',
  'education',
  'transfer',
  'other',
] as const;

export class RefusalError extends Error {}

// ---------------------------------------------------------------------------
// Slip / receipt scanning
// ---------------------------------------------------------------------------

const SlipSchema = z.object({
  merchant: z.string().describe('Recipient or shop name as written on the slip'),
  amount: z.number().describe('Total amount paid in THB, excluding fees'),
  date: z.string().nullable().describe('Transaction date as YYYY-MM-DD in the Gregorian calendar, or null'),
  category: z.enum(CATEGORY_IDS),
  isSubscription: z.boolean(),
  subscriptionName: z.string().nullable().describe('Canonical service name, e.g. "Netflix", when isSubscription'),
  confidence: z.enum(['high', 'medium', 'low']),
  note: z.string().nullable().describe('Short Thai note, e.g. the memo on the slip, or null'),
});

export type SlipResult = z.infer<typeof SlipSchema>;

const SLIP_SYSTEM = `You read Thai payment slips (K PLUS, SCB EASY, Krungthai NEXT, Bangkok Bank, PromptPay, TrueMoney, etc.) and shop receipts, and extract one expense record.

- merchant: the payee. On transfer slips this is the recipient (after "ไปยัง"/"To"), not the sender. On receipts use the shop name.
- amount: the amount actually paid ("จำนวนเงิน"/"Amount"/"ยอดสุทธิ"/"Total").
- date: Thai slips often use the Buddhist Era (e.g. "2 ต.ค. 69" or "2569"); subtract 543 to convert to Gregorian. Output YYYY-MM-DD, or null if no date is visible.
- category: choose the best fit. Use "subscription" for recurring digital services (streaming, AI tools, app stores, cloud storage), "transfer" for person-to-person transfers with no other context, "bills" for utilities/phone/internet.
- confidence: "low" if the image is not a slip/receipt or key fields are unreadable. If it is not a slip at all, return amount 0 and confidence "low".`;

export async function scanSlip(imageBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'): Promise<SlipResult> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(SlipSchema) },
    system: SLIP_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: 'Extract the expense from this slip.' },
        ],
      },
    ],
  });
  if (response.stop_reason === 'refusal') throw new RefusalError('ไม่สามารถอ่านรูปนี้ได้');
  if (!response.parsed_output) throw new Error(`Slip parse failed (stop_reason=${response.stop_reason})`);
  return response.parsed_output;
}

// ---------------------------------------------------------------------------
// Finance coach
// ---------------------------------------------------------------------------

export const CoachInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  totalSpent: z.number().nonnegative(),
  previousMonthTotal: z.number().nonnegative(),
  byCategory: z.array(z.object({ category: z.string().max(40), total: z.number() })).max(20),
  subscriptions: z
    .array(
      z.object({
        name: z.string().max(80),
        kind: z.string().max(20),
        monthlyCost: z.number(),
        usesLast30Days: z.number(),
        targetUsesPerMonth: z.number(),
        daysSinceLastUse: z.number().nullable(),
        status: z.string().max(20),
      }),
    )
    .max(50),
  question: z.string().max(500).optional(),
  tone: z.enum(['hype', 'roast']).optional(),
});

export type CoachInput = z.infer<typeof CoachInputSchema>;

const CoachSchema = z.object({
  headline: z.string().describe('One short Thai sentence summarizing the biggest opportunity'),
  insights: z.array(z.string()).describe('2–4 short Thai observations grounded in the numbers'),
  actions: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        estimatedMonthlySaving: z.number().describe('THB per month, 0 if not a saving'),
      }),
    )
    .describe('Up to 5 concrete actions, highest saving first'),
});

export type CoachResult = z.infer<typeof CoachSchema>;

const COACH_SYSTEM = `You are a friendly, practical personal-finance coach for a user in Thailand. Write in natural Thai, amounts in บาท.

You receive one month's spending totals by category and a usage audit of the user's subscriptions (streaming, AI tools, apps). Subscription status is precomputed: "unused" = no use in 30 days, "underused" = under half the user's own target, "new" = started under 14 days ago, "healthy" otherwise.

Give advice that is specific to these numbers: name the subscriptions to cancel, downgrade, share (family plans) or consolidate (e.g. overlapping AI tools), and realistic category budgets. Savings estimates must be derivable from the data — don't invent figures. Don't give investment or tax advice. If the user asks a question, answer it within the headline/insights/actions.`;

export async function coach(input: CoachInput): Promise<CoachResult> {
  const { question, tone, ...data } = input;
  const toneNote =
    tone === 'roast'
      ? '\n\nโหมดแซว: พูดแบบเพื่อนสนิทที่แซวขำๆ ตรงๆ จิกนิดๆ แต่ไม่หยาบคายหรือทำให้รู้สึกแย่'
      : '\n\nโหมดเชียร์: พูดแบบให้กำลังใจ อบอุ่น ชมเมื่อทำได้ดี';
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(CoachSchema) },
    system: COACH_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `<data>\n${JSON.stringify(data, null, 2)}\n</data>${toneNote}${question ? `\n\nคำถามจากผู้ใช้: ${question}` : ''}`,
      },
    ],
  });
  if (response.stop_reason === 'refusal') throw new RefusalError('AI ไม่สามารถตอบคำถามนี้ได้');
  if (!response.parsed_output) throw new Error(`Coach parse failed (stop_reason=${response.stop_reason})`);
  return response.parsed_output;
}
