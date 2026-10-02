import type { MonthSummary } from './analytics';
import type { AuditSummary } from './audit';
import { formatTHB } from './format';

export type MascotMood = 'happy' | 'excited' | 'worried' | 'sleepy' | 'thinking';

/** How the coach talks: cheerleader or cheeky friend (inspired by Cleo's hype/roast modes). */
export type CoachTone = 'hype' | 'roast';

export interface MascotLine {
  mood: MascotMood;
  message: string;
}

/** What น้องตังค์ says on the dashboard, based on this month's numbers. */
export function mascotLine(month: MonthSummary, audit: AuditSummary, tone: CoachTone): MascotLine {
  const unused = audit.audits.filter((a) => a.status === 'unused');
  const saving = Math.round(audit.potentialMonthlySaving);

  if (unused.length > 0) {
    const names = unused
      .slice(0, 2)
      .map((a) => a.subscription.name)
      .join(' กับ ');
    return {
      mood: 'sleepy',
      message:
        tone === 'roast'
          ? `${names} หลับเป็นตายเลยนะ แต่เงินยังไหลออกทุกเดือน 😴 ปลุกหรือปล่อยไปดี?`
          : `เจอ ${names} แอบหลับอยู่ ยกเลิกแล้วได้เงินคืน ${formatTHB(saving)}/เดือนเลยนะ ✨`,
    };
  }

  if (month.change !== null && month.change > 0.2) {
    const pct = Math.round(month.change * 100);
    return {
      mood: 'worried',
      message:
        tone === 'roast'
          ? `เดือนนี้รูดเพลินไป ${pct}% แล้วนะ กระเป๋าตังค์ร้องไห้แล้ว 🥲`
          : `ใช้มากกว่าเดือนก่อน ${pct}% ลองชะลอนิดนึง เราทำได้! 💪`,
    };
  }

  if (month.change !== null && month.change < -0.1) {
    return {
      mood: 'excited',
      message:
        tone === 'roast'
          ? `โห ประหยัดขึ้น ${Math.round(-month.change * 100)}% ใครมาสิงร่างเนี่ย 😳`
          : `เก่งมาก! ใช้น้อยลง ${Math.round(-month.change * 100)}% จากเดือนก่อน 🎉`,
    };
  }

  if (month.count === 0) {
    return { mood: 'thinking', message: 'ยังไม่มีรายการเดือนนี้เลย ลองสแกนสลิปใบแรกกันไหม? 📸' };
  }

  return {
    mood: 'happy',
    message:
      tone === 'roast'
        ? 'ยังรอดอยู่นะเดือนนี้ แต่อย่าเพิ่งได้ใจล่ะ 😏'
        : 'การเงินเดือนนี้ดูดีเลย รักษาฟอร์มไว้นะ 💛',
  };
}
