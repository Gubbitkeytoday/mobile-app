import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Donut } from '@/components/donut';
import { TransactionRow, useAudit, useMonthSummary } from '@/components/finance';
import { Mascot } from '@/components/mascot';
import { Bouncy, Button, Card, Pill, Row, Screen, SectionTitle, SpeechBubble, Sticker, T } from '@/components/ui';
import { CATEGORIES } from '@/lib/categories';
import { formatThaiDate, formatThaiMonth, todayISO } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { mascotLine } from '@/lib/mascot';
import { useStore } from '@/lib/store';
import { serviceColor } from '@/lib/subscription-catalog';
import { space, useColors } from '@/lib/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'อรุณสวัสดิ์ ☀️';
  if (h < 17) return 'สวัสดีตอนบ่าย 🌤️';
  return 'สวัสดีตอนเย็น 🌙';
}

export default function DashboardScreen() {
  const c = useColors();
  const { state } = useStore();
  const month = useMonthSummary();
  const audit = useAudit();
  const line = mascotLine(month, audit, state.tone);
  const topCats = month.byCategory.slice(0, 4);
  const upcoming = audit.audits
    .filter((a) => a.daysUntilBilling <= 14)
    .sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <T variant="caption" muted>
            {formatThaiDate(todayISO())}
          </T>
          <T variant="title">{greeting()}</T>
        </View>
      </Row>

      {/* mascot says hi */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <Row style={{ marginTop: space.md, alignItems: 'center' }}>
          <Mascot mood={line.mood} size={92} />
          <SpeechBubble>{line.message}</SpeechBubble>
        </Row>
      </Animated.View>

      {/* hero balance card */}
      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Card gradient={['#8F6BFF', '#B57BFF', '#FF8EC1']} lifted style={{ marginTop: space.lg, gap: space.xs }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="label" color="#FFFFFFCC">
              ใช้ไปเดือน {formatThaiMonth(month.month)}
            </T>
            {month.change !== null && (
              <View style={{ backgroundColor: '#FFFFFF33', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 }}>
                <T variant="caption" color="#FFFFFF">
                  {month.change > 0 ? '▲' : '▼'} {Math.abs(Math.round(month.change * 100))}%
                </T>
              </View>
            )}
          </Row>
          <T variant="display" color="#FFFFFF">
            {formatTHB(month.total)}
          </T>
          <Row style={{ gap: space.lg, marginTop: space.xs }}>
            <View>
              <T variant="caption" color="#FFFFFFB3">
                ซับฯ ต่อเดือน
              </T>
              <T variant="label" color="#FFFFFF">
                {formatTHB(Math.round(audit.totalMonthly))}
              </T>
            </View>
            <View style={{ width: 1.5, alignSelf: 'stretch', backgroundColor: '#FFFFFF44' }} />
            <View>
              <T variant="caption" color="#FFFFFFB3">
                {month.count} รายการ
              </T>
              <T variant="label" color="#FFFFFF">
                เฉลี่ย {formatTHB(Math.round(month.count ? month.total / month.count : 0))}
              </T>
            </View>
          </Row>
        </Card>
      </Animated.View>

      <Row style={{ marginTop: space.lg }}>
        <Button label="สแกนสลิป" icon="camera" onPress={() => router.push('/scan')} style={{ flex: 1 }} />
        <Button label="จดเอง" icon="pencil" variant="secondary" onPress={() => router.push('/transaction/new')} style={{ flex: 1 }} />
      </Row>

      {/* bento grid */}
      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Row style={{ marginTop: space.lg, alignItems: 'stretch' }}>
          <Card style={{ flex: 1.15, alignItems: 'center', gap: space.md }}>
            <T variant="label" style={{ alignSelf: 'flex-start' }}>
              เงินไปไหน? 🧐
            </T>
            <Donut
              size={124}
              thickness={18}
              segments={month.byCategory.map((r) => ({ value: r.total, color: CATEGORIES[r.category].color }))}>
              <T style={{ fontSize: 26, lineHeight: 34 }}>{topCats[0] ? CATEGORIES[topCats[0].category].emoji : '🌱'}</T>
              <T variant="caption" muted>
                {topCats[0] ? `${Math.round(topCats[0].share * 100)}%` : 'ว่างเปล่า'}
              </T>
            </Donut>
            <View style={{ alignSelf: 'stretch', gap: 2 }}>
              {topCats.map((r) => (
                <Row key={r.category} style={{ gap: space.xs }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CATEGORIES[r.category].color }} />
                  <T variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                    {CATEGORIES[r.category].label}
                  </T>
                  <T variant="caption" muted>
                    {Math.round(r.share * 100)}%
                  </T>
                </Row>
              ))}
            </View>
          </Card>

          <View style={{ flex: 1, gap: space.md }}>
            <Card tone="mint" style={{ flex: 1, gap: 2 }} onPress={() => router.push('/subscription/review')}>
              <T style={{ fontSize: 30, lineHeight: 40 }}>🫙</T>
              <T variant="caption" muted>
                กระปุกที่รอเติม
              </T>
              <T variant="heading" color={c.mint}>
                +{formatTHB(Math.round(audit.potentialMonthlySaving * 12))}
              </T>
              <T variant="caption" muted>
                ต่อปี ถ้าเลิกตัวที่หลับ →
              </T>
            </Card>
            <Card tone="lemon" style={{ flex: 1, gap: 2 }} onPress={() => router.push('/subscriptions')}>
              <T style={{ fontSize: 30, lineHeight: 40 }}>⏰</T>
              <T variant="caption" muted>
                ใกล้ตัดเงิน (7 วัน)
              </T>
              <T variant="heading">{audit.renewingSoon.length} รายการ</T>
            </Card>
          </View>
        </Row>
      </Animated.View>

      {upcoming.length > 0 && (
        <>
          <SectionTitle>จะตัดเงินเร็วๆ นี้ 💳</SectionTitle>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: space.md, paddingBottom: space.md }}>
            {upcoming.map((a) => (
              <Card
                key={a.subscription.id}
                style={{ width: 150, gap: space.sm, padding: space.md + 2 }}
                onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: a.subscription.id } })}>
                <Sticker label={a.subscription.name} color={serviceColor(a.subscription.name)} size={40} />
                <T variant="label" numberOfLines={1}>
                  {a.subscription.name}
                </T>
                <Pill
                  tone={a.daysUntilBilling <= 3 ? 'danger' : 'primary'}
                  label={a.daysUntilBilling === 0 ? 'วันนี้!' : `อีก ${a.daysUntilBilling} วัน`}
                />
                <T variant="caption" muted>
                  {formatTHB(a.subscription.price)}
                </T>
              </Card>
            ))}
          </ScrollView>
        </>
      )}

      <SectionTitle
        action={
          <Bouncy onPress={() => router.push('/transactions')}>
            <T variant="label" color={c.primary}>
              ดูทั้งหมด →
            </T>
          </Bouncy>
        }>
        ล่าสุด 🧾
      </SectionTitle>
      <Card style={{ paddingVertical: space.sm }}>
        {state.transactions.slice(0, 5).map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </Card>
    </Screen>
  );
}
