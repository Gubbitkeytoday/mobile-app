import { useState } from 'react';
import { View } from 'react-native';

import { useAudit, useMonthSummary } from '@/components/finance';
import { Button, Card, Field, Pill, Row, Screen, SectionTitle, T } from '@/components/ui';
import { ApiError, fetchCoachReport, isApiConfigured } from '@/lib/api';
import { localCoachReport } from '@/lib/analytics';
import { formatTHB } from '@/lib/format';
import { space, useColors } from '@/lib/theme';
import type { CoachReport } from '@/lib/types';

export default function CoachScreen() {
  const c = useColors();
  const month = useMonthSummary();
  const audit = useAudit();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<CoachReport | null>(null);
  const report = aiReport ?? localCoachReport(month, audit);

  const askAI = async () => {
    setLoading(true);
    setNotice(null);
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
        }),
      );
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'ขอคำแนะนำจาก AI ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <T variant="title">AI Finance Coach</T>
      <Row style={{ marginTop: space.xs, marginBottom: space.lg }}>
        <Pill
          label={report.source === 'ai' ? 'วิเคราะห์โดย Claude' : 'วิเคราะห์ในเครื่อง'}
          tone={report.source === 'ai' ? 'primary' : 'success'}
        />
      </Row>

      <Card tone="primary">
        <T variant="heading">{report.headline}</T>
      </Card>

      {report.insights.length > 0 && (
        <>
          <SectionTitle>ข้อสังเกต</SectionTitle>
          <Card style={{ gap: space.sm }}>
            {report.insights.map((s, i) => (
              <T key={i}>• {s}</T>
            ))}
          </Card>
        </>
      )}

      {report.actions.length > 0 && (
        <>
          <SectionTitle>สิ่งที่ควรทำ</SectionTitle>
          {report.actions.map((a, i) => (
            <Card key={i} style={{ marginBottom: space.md, gap: space.xs }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <T style={{ fontWeight: '700', flex: 1 }}>{a.title}</T>
                {a.estimatedMonthlySaving > 0 && (
                  <T color={c.success} style={{ fontWeight: '700' }}>
                    +{formatTHB(a.estimatedMonthlySaving)}/ด.
                  </T>
                )}
              </Row>
              <T muted>{a.detail}</T>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>ถาม AI Coach</SectionTitle>
      <View>
        <Field
          label="คำถาม (ไม่บังคับ)"
          value={question}
          onChangeText={setQuestion}
          placeholder="เช่น อยากเก็บเงิน 5,000 ต่อเดือน ควรลดอะไร?"
          multiline
        />
        <Button
          label={isApiConfigured() ? 'วิเคราะห์ด้วย AI' : 'ต้องตั้งค่าเซิร์ฟเวอร์ AI ก่อน'}
          icon="sparkles"
          loading={loading}
          disabled={!isApiConfigured()}
          onPress={askAI}
        />
        {notice && (
          <T color={c.danger} style={{ marginTop: space.sm }}>
            {notice}
          </T>
        )}
        <T variant="caption" muted style={{ marginTop: space.md }}>
          ระบบส่งเฉพาะยอดสรุปรายหมวดและสถิติซับสคริปชันไปวิเคราะห์ ไม่ส่งรายการธุรกรรมรายตัว
        </T>
      </View>
    </Screen>
  );
}
