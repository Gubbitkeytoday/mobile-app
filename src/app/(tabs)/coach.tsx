import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';

import { useAudit, useMonthSummary } from '@/components/finance';
import { Mascot } from '@/components/mascot';
import { Bouncy, Card, Chips, Pill, Row, Screen, T } from '@/components/ui';
import { ApiError, fetchCoachReport, isApiConfigured } from '@/lib/api';
import { localCoachReport } from '@/lib/analytics';
import { formatTHB } from '@/lib/format';
import type { CoachTone, MascotMood } from '@/lib/mascot';
import { useStore } from '@/lib/store';
import { clayShadow, fonts, radius, space, useColors } from '@/lib/theme';
import type { CoachReport } from '@/lib/types';

const ACTION_EMOJI = ['🎯', '✂️', '💡', '🫙', '🧭'];

function Bubble({ children, delay }: { children: string; delay: number }) {
  const c = useColors();
  return (
    <Animated.View
      entering={FadeInLeft.delay(delay).duration(350)}
      style={{
        alignSelf: 'flex-start',
        maxWidth: '88%',
        backgroundColor: c.card,
        borderRadius: radius.md,
        borderTopLeftRadius: 6,
        paddingHorizontal: space.md + 2,
        paddingVertical: space.sm + 2,
        boxShadow: clayShadow(c),
      }}>
      <T style={{ lineHeight: 22 }}>{children}</T>
    </Animated.View>
  );
}

export default function CoachScreen() {
  const c = useColors();
  const { state, dispatch } = useStore();
  const month = useMonthSummary();
  const audit = useAudit();
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<CoachReport | null>(null);
  const report = aiReport ?? localCoachReport(month, audit, state.tone);
  const totalSaving = report.actions.reduce((s, a) => s + a.estimatedMonthlySaving, 0);
  const mood: MascotMood = loading ? 'thinking' : totalSaving > 0 ? (state.tone === 'roast' ? 'worried' : 'happy') : 'excited';

  const askAI = async () => {
    setLoading(true);
    setNotice(null);
    setAsked(question.trim() || null);
    try {
      setAiReport(
        await fetchCoachReport({
          month: month.month,
          totalSpent: month.total,
          previousMonthTotal: month.previousTotal,
          byCategory: month.byCategory.map((r) => ({ category: r.category, total: r.total })),
          subscriptions: audit.audits.map((a) => ({
            name: a.subscription.name,
            kind: a.subscription.kind,
            monthlyCost: Math.round(a.monthlyCost),
            usesLast30Days: a.usesLast30Days,
            targetUsesPerMonth: a.subscription.targetUsesPerMonth,
            daysSinceLastUse: a.daysSinceLastUse,
            status: a.status,
          })),
          question: question.trim() || undefined,
          tone: state.tone,
        }),
      );
      setQuestion('');
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'ขอคำแนะนำจาก AI ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="title">โค้ชน้องตังค์</T>
        <Pill
          tone={report.source === 'ai' ? 'primary' : 'mint'}
          emoji={report.source === 'ai' ? '✨' : '📱'}
          label={report.source === 'ai' ? 'Claude AI' : 'ในเครื่อง'}
        />
      </Row>

      <View style={{ marginTop: space.md }}>
      <Chips<CoachTone>
        value={state.tone}
        onChange={(tone) => {
          dispatch({ type: 'setTone', tone });
          setAiReport(null);
        }}
        options={[
          { value: 'hype', label: 'โหมดเชียร์', emoji: '💖' },
          { value: 'roast', label: 'โหมดแซว', emoji: '😏' },
        ]}
      />
      </View>

      <Row style={{ marginTop: space.lg, alignItems: 'flex-start' }}>
        <Mascot mood={mood} size={64} />
        <View style={{ flex: 1, gap: space.sm }}>
          {asked && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={{
                alignSelf: 'flex-end',
                maxWidth: '88%',
                backgroundColor: c.primary,
                borderRadius: radius.md,
                borderTopRightRadius: 6,
                paddingHorizontal: space.md + 2,
                paddingVertical: space.sm + 2,
              }}>
              <T color={c.onPrimary}>{asked}</T>
            </Animated.View>
          )}
          <Bubble delay={0}>{report.headline}</Bubble>
          {report.insights.map((s, i) => (
            <Bubble key={`${report.source}-${i}`} delay={120 * (i + 1)}>
              {s}
            </Bubble>
          ))}
        </View>
      </Row>

      {report.actions.length > 0 && (
        <View style={{ marginTop: space.xl, gap: space.md }}>
          <T variant="heading">ภารกิจออมเงิน 🎯</T>
          {report.actions.map((a, i) => (
            <Animated.View key={`${report.source}-a-${i}`} entering={FadeInDown.delay(200 + i * 80).duration(400)}>
              <Card style={{ gap: space.xs }}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <T style={{ fontSize: 24, lineHeight: 32 }}>{ACTION_EMOJI[i % ACTION_EMOJI.length]}</T>
                  <View style={{ flex: 1 }}>
                    <T variant="label" style={{ fontSize: 15 }}>
                      {a.title}
                    </T>
                    <T variant="caption" muted>
                      {a.detail}
                    </T>
                  </View>
                  {a.estimatedMonthlySaving > 0 && (
                    <Pill tone="mint" label={`+${formatTHB(a.estimatedMonthlySaving)}`} />
                  )}
                </Row>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}

      {/* chat composer */}
      <View style={{ marginTop: space.xl }}>
        <Row
          style={{
            backgroundColor: c.card,
            borderRadius: radius.pill,
            paddingLeft: space.lg,
            paddingRight: 6,
            paddingVertical: 6,
            boxShadow: clayShadow(c),
          }}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={isApiConfigured() ? 'ถามน้องตังค์ เช่น อยากเก็บ 5,000/เดือน ต้องลดอะไร?' : 'ต้องเชื่อมเซิร์ฟเวอร์ AI ก่อนนะ'}
            placeholderTextColor={c.textMuted}
            editable={isApiConfigured() && !loading}
            onSubmitEditing={askAI}
            style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: c.text, paddingVertical: 8 }}
          />
          <Bouncy onPress={askAI} disabled={!isApiConfigured() || loading} scaleTo={0.85}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isApiConfigured() ? c.primary : c.cardMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={loading ? 'hourglass' : 'sparkles'} size={20} color={isApiConfigured() ? '#FFFFFF' : c.textMuted} />
            </View>
          </Bouncy>
        </Row>
        {notice && (
          <T color={c.danger} style={{ marginTop: space.sm, textAlign: 'center' }}>
            {notice}
          </T>
        )}
        <T variant="caption" muted style={{ marginTop: space.md, textAlign: 'center' }}>
          🔒 ส่งไปแค่ยอดรวมรายหมวดและสถิติซับฯ ไม่ส่งรายการรายตัว
        </T>
      </View>
    </Screen>
  );
}
