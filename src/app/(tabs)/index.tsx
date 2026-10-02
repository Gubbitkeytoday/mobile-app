import { router } from 'expo-router';
import { View } from 'react-native';

import { TransactionRow, useAudit, useMonthSummary } from '@/components/finance';
import { Button, Card, ProgressBar, Row, Screen, SectionTitle, T } from '@/components/ui';
import { CATEGORIES } from '@/lib/categories';
import { formatThaiMonth } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

export default function DashboardScreen() {
  const c = useColors();
  const { state } = useStore();
  const month = useMonthSummary();
  const audit = useAudit();

  return (
    <Screen>
      <T variant="caption" muted>
        ใช้จ่ายเดือน {formatThaiMonth(month.month)}
      </T>
      <T variant="money">{formatTHB(month.total)}</T>
      {month.change !== null && (
        <T variant="caption" color={month.change > 0 ? c.danger : c.success}>
          {month.change > 0 ? '▲' : '▼'} {Math.abs(Math.round(month.change * 100))}% จากช่วงเดียวกันเดือนก่อน
        </T>
      )}

      <Row style={{ marginTop: space.lg }}>
        <Button label="สแกนสลิป" icon="scan" onPress={() => router.push('/scan')} style={{ flex: 1 }} />
        <Button
          label="เพิ่มเอง"
          icon="add"
          variant="secondary"
          onPress={() => router.push('/transaction/new')}
          style={{ flex: 1 }}
        />
      </Row>

      {audit.potentialMonthlySaving > 0 && (
        <Card tone="warning" style={{ marginTop: space.lg }} onPress={() => router.push('/subscriptions')}>
          <T style={{ fontWeight: '700' }}>
            💡 มีซับสคริปชันที่ไม่ค่อยได้ใช้ {audit.flaggedCount} รายการ
          </T>
          <T muted>
            ยกเลิกแล้วประหยัดได้ {formatTHB(Math.round(audit.potentialMonthlySaving))}/เดือน (
            {formatTHB(Math.round(audit.potentialMonthlySaving * 12))}/ปี)
          </T>
        </Card>
      )}

      <SectionTitle>แยกตามหมวด</SectionTitle>
      <Card style={{ gap: space.md }}>
        {month.byCategory.length === 0 && <T muted>ยังไม่มีรายจ่ายเดือนนี้</T>}
        {month.byCategory.map((row) => {
          const cat = CATEGORIES[row.category];
          return (
            <View key={row.category} style={{ gap: space.xs }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T>{cat.label}</T>
                <T style={{ fontWeight: '600' }}>
                  {formatTHB(row.total)}{' '}
                  <T variant="caption" muted>
                    {Math.round(row.share * 100)}%
                  </T>
                </T>
              </Row>
              <ProgressBar value={row.share * 100} color={cat.color} />
            </View>
          );
        })}
      </Card>

      {audit.renewingSoon.length > 0 && (
        <>
          <SectionTitle>จะตัดเงินเร็วๆ นี้</SectionTitle>
          <Card>
            {audit.renewingSoon.map((a) => (
              <Row key={a.subscription.id} style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
                <T>{a.subscription.name}</T>
                <T muted>
                  {formatTHB(a.subscription.price)} ·{' '}
                  {a.daysUntilBilling === 0 ? 'วันนี้' : `อีก ${a.daysUntilBilling} วัน`}
                </T>
              </Row>
            ))}
          </Card>
        </>
      )}

      <SectionTitle
        action={
          <T color={c.primary} onPress={() => router.push('/transactions')}>
            ดูทั้งหมด
          </T>
        }>
        ล่าสุด
      </SectionTitle>
      <Card>
        {state.transactions.slice(0, 5).map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </Card>
    </Screen>
  );
}
