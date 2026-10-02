import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { SubscriptionAuditCard, useAudit } from '@/components/finance';
import { Button, Card, EmptyState, Row, Screen, SectionTitle, T } from '@/components/ui';
import { detectRecurring } from '@/lib/audit';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

export default function SubscriptionsScreen() {
  const c = useColors();
  const { state } = useStore();
  const audit = useAudit();
  const candidates = useMemo(
    () => detectRecurring(state.transactions, state.subscriptions),
    [state.transactions, state.subscriptions],
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="title">ซับสคริปชัน</T>
        <Button label="เพิ่ม" icon="add" onPress={() => router.push('/subscription/new')} />
      </Row>

      <Row style={{ marginTop: space.lg, alignItems: 'stretch' }}>
        <Card style={{ flex: 1 }}>
          <T variant="caption" muted>
            รวมต่อเดือน
          </T>
          <T variant="heading">{formatTHB(Math.round(audit.totalMonthly))}</T>
          <T variant="caption" muted>
            {formatTHB(Math.round(audit.totalYearly))}/ปี
          </T>
        </Card>
        <Card style={{ flex: 1 }} tone={audit.potentialMonthlySaving > 0 ? 'success' : undefined}>
          <T variant="caption" muted>
            ประหยัดได้
          </T>
          <T variant="heading" color={audit.potentialMonthlySaving > 0 ? c.success : undefined}>
            {formatTHB(Math.round(audit.potentialMonthlySaving))}
          </T>
          <T variant="caption" muted>
            ต่อเดือน ถ้ายกเลิกที่ไม่ได้ใช้
          </T>
        </Card>
      </Row>

      {candidates.length > 0 && (
        <>
          <SectionTitle>🔍 พบรายจ่ายที่อาจเป็นซับสคริปชัน</SectionTitle>
          <Card style={{ gap: space.md }}>
            {candidates.map((cand) => (
              <Row key={cand.merchant} style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '600' }}>{cand.merchant}</T>
                  <T variant="caption" muted>
                    {formatTHB(cand.amount)} · พบ {cand.occurrences} ครั้ง
                  </T>
                </View>
                <Button
                  label="ติดตาม"
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

      <SectionTitle>การใช้งานจริง (30 วันล่าสุด)</SectionTitle>
      {audit.audits.length === 0 ? (
        <EmptyState
          icon="repeat-outline"
          title="ยังไม่มีซับสคริปชัน"
          hint="เพิ่ม Netflix, Spotify, ChatGPT ฯลฯ เพื่อดูว่าตัวไหนคุ้ม ตัวไหนควรยกเลิก"
        />
      ) : (
        audit.audits.map((a) => <SubscriptionAuditCard key={a.subscription.id} audit={a} />)
      )}
      <T variant="caption" muted style={{ textAlign: 'center' }}>
        แตะที่ซับสคริปชันแล้วกด “ใช้วันนี้” ทุกครั้งที่ใช้ เพื่อให้ระบบวิเคราะห์ความคุ้มค่าได้แม่นยำ
      </T>
    </Screen>
  );
}
