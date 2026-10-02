import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SubscriptionAuditCard, useAudit } from '@/components/finance';
import { Mascot } from '@/components/mascot';
import { Button, Card, EmptyState, Row, Screen, SectionTitle, Sticker, T } from '@/components/ui';
import { detectRecurring } from '@/lib/audit';
import { SUBSCRIPTION_KINDS } from '@/lib/categories';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { serviceColor } from '@/lib/subscription-catalog';
import { space, useColors } from '@/lib/theme';
import type { SubscriptionKind } from '@/lib/types';

export default function SubscriptionsScreen() {
  const c = useColors();
  const { state } = useStore();
  const audit = useAudit();
  const candidates = useMemo(
    () => detectRecurring(state.transactions, state.subscriptions),
    [state.transactions, state.subscriptions],
  );
  const byKind = useMemo(() => {
    const totals = new Map<SubscriptionKind, number>();
    for (const a of audit.audits) totals.set(a.subscription.kind, (totals.get(a.subscription.kind) ?? 0) + a.monthlyCost);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [audit]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="title">ซับสคริปชัน</T>
        <Button label="เพิ่ม" icon="add" size="sm" onPress={() => router.push('/subscription/new')} />
      </Row>

      <Animated.View entering={FadeInDown.duration(450)}>
        <Card gradient={['#5AB8FF', '#8F6BFF']} lifted style={{ marginTop: space.lg }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="label" color="#FFFFFFCC">
                จ่ายค่าสมาชิกรวม
              </T>
              <T variant="display" color="#FFFFFF">
                {formatTHB(Math.round(audit.totalMonthly))}
              </T>
              <T variant="caption" color="#FFFFFFCC">
                ต่อเดือน · {formatTHB(Math.round(audit.totalYearly))} ต่อปี 😮
              </T>
            </View>
            <Mascot mood={audit.flaggedCount ? 'worried' : 'happy'} size={78} />
          </Row>
          <Row style={{ marginTop: space.md, flexWrap: 'wrap', gap: space.sm }}>
            {byKind.map(([kind, total]) => (
              <View key={kind} style={{ backgroundColor: '#FFFFFF2E', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                <T variant="caption" color="#FFFFFF">
                  {SUBSCRIPTION_KINDS[kind].emoji} {SUBSCRIPTION_KINDS[kind].label} {formatTHB(Math.round(total))}
                </T>
              </View>
            ))}
          </Row>
        </Card>
      </Animated.View>

      {audit.flaggedCount > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(450)}>
          <Card tone="pink" style={{ marginTop: space.lg, gap: space.md }}>
            <Row>
              <T style={{ fontSize: 34, lineHeight: 44 }}>💘</T>
              <View style={{ flex: 1 }}>
                <T variant="heading">มี {audit.flaggedCount} ตัวที่ไม่ค่อยได้ใช้</T>
                <T variant="caption" muted>
                  ปัดขวาเก็บไว้ ปัดซ้ายบอกลา — ประหยัดได้สูงสุด {formatTHB(Math.round(audit.potentialMonthlySaving))}/เดือน
                </T>
              </View>
            </Row>
            <Button label="เริ่มปัดเลือกเลย!" icon="heart" onPress={() => router.push('/subscription/review')} />
          </Card>
        </Animated.View>
      )}

      {candidates.length > 0 && (
        <>
          <SectionTitle>🔍 น้องตังค์เจอรายจ่ายแปลกๆ</SectionTitle>
          <Card style={{ gap: space.md }}>
            <T variant="caption" muted>
              รายการเหล่านี้ตัดเงินซ้ำๆ เหมือนเป็นค่าสมาชิก ติดตามไว้ไหม?
            </T>
            {candidates.map((cand) => (
              <Row key={cand.merchant}>
                <Sticker label={cand.merchant} color={serviceColor(cand.merchant)} size={40} />
                <View style={{ flex: 1 }}>
                  <T variant="label">{cand.merchant}</T>
                  <T variant="caption" muted>
                    {formatTHB(cand.amount)} · เจอ {cand.occurrences} ครั้ง
                  </T>
                </View>
                <Button
                  label="ติดตาม"
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/subscription/new',
                      params: {
                        name: cand.merchant,
                        price: String(cand.amount),
                        cycle: cand.cycle,
                        lastCharged: cand.lastChargedAt,
                      },
                    })
                  }
                />
              </Row>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>ใช้คุ้มไหม? (30 วันล่าสุด)</SectionTitle>
      {audit.audits.length === 0 ? (
        <EmptyState
          title="ยังไม่มีซับสคริปชันเลย"
          hint="เพิ่ม Netflix, Spotify, ChatGPT ฯลฯ แล้วน้องตังค์จะช่วยดูว่าตัวไหนคุ้ม ตัวไหนควรบอกลา"
        />
      ) : (
        audit.audits.map((a, i) => (
          <Animated.View key={a.subscription.id} entering={FadeInDown.delay(150 + i * 50).duration(400)}>
            <SubscriptionAuditCard audit={a} />
          </Animated.View>
        ))
      )}
      <T variant="caption" muted style={{ textAlign: 'center', color: c.textMuted }}>
        💡 แตะที่การ์ดแล้วกด “ใช้วันนี้” ทุกครั้งที่ใช้ งานวิเคราะห์จะแม่นขึ้น
      </T>
    </Screen>
  );
}
