import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { auditAll } from './audit';
import { addDays, parseISODate, todayISO } from './dates';
import { formatTHB } from './format';
import type { Subscription } from './types';

const REMINDER_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Replaces all scheduled reminders with one per active subscription, fired
 * `remindBeforeDays` before the next charge. Unused/underused subscriptions get
 * a stronger "cancel before you're charged" message.
 */
export async function rescheduleRenewalReminders(subs: Subscription[]): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('renewals', {
      name: 'แจ้งเตือนตัดเงินซับสคริปชัน',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const today = todayISO();
  const now = Date.now();
  let scheduled = 0;

  for (const audit of auditAll(subs, today).audits) {
    const sub = audit.subscription;
    const remindOn = parseISODate(addDays(audit.nextBillingDate, -sub.remindBeforeDays));
    const fireAt = new Date(
      remindOn.getUTCFullYear(),
      remindOn.getUTCMonth(),
      remindOn.getUTCDate(),
      REMINDER_HOUR,
    );
    if (fireAt.getTime() <= now) continue;

    const flagged = audit.status === 'unused' || audit.status === 'underused';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: flagged
          ? `⚠️ ${sub.name} จะตัดเงินอีก ${sub.remindBeforeDays} วัน`
          : `${sub.name} จะตัดเงินอีก ${sub.remindBeforeDays} วัน`,
        body: flagged
          ? `ใช้แค่ ${audit.usesLast30Days} ครั้งใน 30 วัน — ยกเลิกก่อนเสีย ${formatTHB(sub.price)} ไหม?`
          : `ยอด ${formatTHB(sub.price)} จะถูกเรียกเก็บ`,
        data: { subscriptionId: sub.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: 'renewals',
      },
    });
    scheduled++;
  }
  return scheduled;
}
