import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { TransactionForm, emptyDraft, type TransactionDraft } from '@/components/transaction-form';
import { Button, Card, Pill, Row, Screen, T } from '@/components/ui';
import { ApiError, isApiConfigured, scanSlip } from '@/lib/api';
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
        <Card tone="success" style={{ gap: space.sm }}>
          <T variant="heading">✅ บันทึกแล้ว</T>
          <T muted>รายการถูกเพิ่มและจัดหมวดหมู่เรียบร้อย</T>
        </Card>
        {phase.subscriptionName && !alreadyTracked && (
          <Card tone="primary" style={{ marginTop: space.lg, gap: space.md }}>
            <T>
              ดูเหมือนเป็นค่าซับสคริปชัน <T style={{ fontWeight: '700' }}>{phase.subscriptionName}</T>{' '}
              ต้องการให้ช่วยติดตามการใช้งานและเตือนก่อนตัดเงินไหม?
            </T>
            <Button
              label="ติดตามซับสคริปชันนี้"
              icon="repeat"
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
      <T variant="title">สแกนสลิป</T>
      <T muted style={{ marginBottom: space.lg }}>
        ถ่ายรูปหรือเลือกสลิปโอนเงิน/ใบเสร็จ AI จะอ่านยอดเงิน ร้านค้า วันที่ และจัดหมวดหมู่ให้อัตโนมัติ
      </T>

      {phase.step === 'idle' && (
        <View style={{ gap: space.md }}>
          <Button label="ถ่ายรูปสลิป" icon="camera" onPress={() => pick(true)} />
          <Button label="เลือกจากคลังภาพ" icon="images" variant="secondary" onPress={() => pick(false)} />
          {!isApiConfigured() && (
            <Card tone="warning">
              <T variant="caption">
                โหมดออฟไลน์: ยังไม่ได้ตั้งค่า EXPO_PUBLIC_API_URL จึงต้องกรอกข้อมูลเอง (ดู README)
              </T>
            </Card>
          )}
        </View>
      )}

      {phase.step !== 'idle' && (
        <Image
          source={{ uri: phase.uri }}
          contentFit="contain"
          style={{ height: 260, borderRadius: radius.md, backgroundColor: c.cardMuted, marginBottom: space.lg }}
        />
      )}

      {phase.step === 'scanning' && (
        <Row style={{ justifyContent: 'center', padding: space.lg }}>
          <ActivityIndicator color={c.primary} />
          <T muted>AI กำลังอ่านสลิป…</T>
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
                tone={phase.result.confidence === 'high' ? 'success' : 'warning'}
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
