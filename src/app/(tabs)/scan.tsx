import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Mascot } from '@/components/mascot';
import { TransactionForm, emptyDraft, type TransactionDraft } from '@/components/transaction-form';
import { Button, Card, Pill, Row, Screen, T } from '@/components/ui';
import { ApiError, isApiConfigured, scanSlip } from '@/lib/api';
import { formatTHB } from '@/lib/format';
import { matchCatalog } from '@/lib/subscription-catalog';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';
import type { SlipScanResult } from '@/lib/types';

type Phase =
  | { step: 'idle' }
  | { step: 'scanning'; uri: string }
  | { step: 'review'; uri: string; draft: TransactionDraft; result: SlipScanResult | null; error?: string }
  | { step: 'saved'; subscriptionName: string | null; amount: number };

export default function ScanScreen() {
  const c = useColors();
  const { state, dispatch } = useStore();
  const [phase, setPhase] = useState<Phase>({ step: 'idle' });

  const pick = async (fromCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.6 };
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];

    if (!isApiConfigured() || !asset.base64) {
      setPhase({
        step: 'review',
        uri: asset.uri,
        draft: emptyDraft(),
        result: null,
        error: isApiConfigured()
          ? 'อ่านรูปไม่ได้ กรุณากรอกข้อมูลเอง'
          : 'ยังไม่ได้เชื่อมเซิร์ฟเวอร์ AI (EXPO_PUBLIC_API_URL) — กรอกข้อมูลจากสลิปเองได้เลย',
      });
      return;
    }

    setPhase({ step: 'scanning', uri: asset.uri });
    try {
      const result = await scanSlip(asset.base64, asset.mimeType ?? 'image/jpeg');
      setPhase({
        step: 'review',
        uri: asset.uri,
        result,
        draft: {
          ...emptyDraft(),
          merchant: result.merchant,
          amount: String(result.amount),
          date: result.date ?? emptyDraft().date,
          category: result.category,
          note: result.note ?? '',
        },
      });
    } catch (e) {
      setPhase({
        step: 'review',
        uri: asset.uri,
        draft: emptyDraft(),
        result: null,
        error: e instanceof ApiError ? e.message : 'สแกนไม่สำเร็จ กรุณากรอกข้อมูลเอง',
      });
    }
  };

  if (phase.step === 'saved') {
    const alreadyTracked =
      phase.subscriptionName &&
      state.subscriptions.some((s) => s.name.toLowerCase() === phase.subscriptionName!.toLowerCase());
    return (
      <Screen>
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center', gap: space.sm, marginTop: space.lg }}>
          <Mascot mood="excited" size={140} />
          <T variant="title">บันทึกแล้ว! 🎉</T>
          <T muted style={{ textAlign: 'center' }}>
            -{formatTHB(phase.amount)} ถูกจัดหมวดหมู่เรียบร้อย
          </T>
        </Animated.View>
        {phase.subscriptionName && !alreadyTracked && (
          <Card tone="primary" style={{ marginTop: space.xl, gap: space.md }}>
            <T>
              อันนี้เหมือนค่าสมาชิก <T variant="label">{phase.subscriptionName}</T> นะ ให้น้องตังค์ช่วยดูว่าใช้คุ้มไหม
              และเตือนก่อนตัดเงินดีไหม? 👀
            </T>
            <Button
              label="ติดตามเลย"
              icon="albums"
              onPress={() => {
                router.push({
                  pathname: '/subscription/new',
                  params: { name: phase.subscriptionName!, price: String(phase.amount) },
                });
                setPhase({ step: 'idle' });
              }}
            />
          </Card>
        )}
        <Button
          label="สแกนใบต่อไป"
          icon="scan"
          variant="secondary"
          style={{ marginTop: space.lg }}
          onPress={() => setPhase({ step: 'idle' })}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <T variant="title">สแกนสลิป 📸</T>
      <T muted style={{ marginBottom: space.lg }}>
        ไม่ต้องพิมพ์เองแล้ว ถ่ายสลิปมา เดี๋ยว AI อ่านยอด ร้านค้า วันที่ แล้วจัดหมวดให้เลย
      </T>

      {phase.step === 'idle' && (
        <View style={{ gap: space.lg }}>
          <Card gradient={['#ECE6FF', '#FFE3EF']} lifted style={{ alignItems: 'center', paddingVertical: space.xxl }}>
            <View style={styles.viewfinder}>
              {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                <View key={corner} style={[styles.corner, styles[corner], { borderColor: c.primary }]} />
              ))}
              <Mascot mood="thinking" size={110} />
            </View>
            <T variant="label" style={{ marginTop: space.md, color: '#2B2140' }}>
              วางสลิปให้อยู่ในกรอบ แล้วถ่ายเลย!
            </T>
          </Card>
          <Button label="ถ่ายรูปสลิป" icon="camera" onPress={() => pick(true)} />
          <Button label="เลือกจากคลังภาพ" icon="images" variant="secondary" onPress={() => pick(false)} />
          <Row style={{ flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }}>
            {['K PLUS', 'SCB EASY', 'Krungthai NEXT', 'PromptPay', 'ใบเสร็จร้านค้า'].map((b) => (
              <Pill key={b} tone="primary" label={b} />
            ))}
          </Row>
          {!isApiConfigured() && (
            <Card tone="lemon">
              <T variant="caption">
                🔌 โหมดออฟไลน์: ยังไม่ได้เชื่อมเซิร์ฟเวอร์ AI (EXPO_PUBLIC_API_URL) เลยต้องกรอกข้อมูลเองก่อนนะ (ดู README)
              </T>
            </Card>
          )}
        </View>
      )}

      {phase.step !== 'idle' && (
        <Image
          source={{ uri: phase.uri }}
          contentFit="contain"
          style={{ height: 260, borderRadius: radius.lg, backgroundColor: c.cardMuted, marginBottom: space.lg }}
        />
      )}

      {phase.step === 'scanning' && (
        <Row style={{ justifyContent: 'center', padding: space.lg }}>
          <Mascot mood="thinking" size={70} />
          <T variant="label" muted>
            น้องตังค์กำลังอ่านสลิป…
          </T>
        </Row>
      )}

      {phase.step === 'review' && (
        <>
          {phase.error && (
            <Card tone="warning" style={{ marginBottom: space.lg }}>
              <T variant="caption">{phase.error}</T>
            </Card>
          )}
          {phase.result && (
            <Row style={{ marginBottom: space.md }}>
              <Pill
                label={`ความมั่นใจ: ${{ high: 'สูง', medium: 'กลาง', low: 'ต่ำ' }[phase.result.confidence]}`}
                tone={phase.result.confidence === 'high' ? 'mint' : 'warning'}
                emoji={phase.result.confidence === 'high' ? '✨' : '🤔'}
              />
              <T variant="caption" muted>
                ตรวจสอบก่อนบันทึก
              </T>
            </Row>
          )}
          <TransactionForm
            key={phase.uri}
            initial={phase.draft}
            source="slip"
            submitLabel="ยืนยันและบันทึก"
            onSubmit={(transaction) => {
              const sub = state.subscriptions.find((s) =>
                transaction.merchant.toLowerCase().includes(s.name.toLowerCase()),
              );
              dispatch({ type: 'addTransaction', transaction: { ...transaction, subscriptionId: sub?.id } });
              const subscriptionName =
                transaction.category === 'subscription'
                  ? (phase.result?.subscriptionName ?? matchCatalog(transaction.merchant)?.name ?? transaction.merchant)
                  : null;
              setPhase({ step: 'saved', subscriptionName, amount: transaction.amount });
            }}
          />
          <Button
            label="ยกเลิก"
            variant="secondary"
            style={{ marginTop: space.md }}
            onPress={() => setPhase({ step: 'idle' })}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  viewfinder: { width: 200, height: 170, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 34, height: 34, borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 18 },
});
