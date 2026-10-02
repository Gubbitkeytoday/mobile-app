import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '@/components/finance';
import { Button, Chips, EmptyState, Row, T } from '@/components/ui';
import { CATEGORIES, CATEGORY_IDS } from '@/lib/categories';
import { formatThaiMonth, monthKey } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';
import type { CategoryId, Transaction } from '@/lib/types';

type Filter = 'all' | CategoryId;

export default function TransactionsScreen() {
  const c = useColors();
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const sections = useMemo(() => {
    const filtered = state.transactions.filter((t) => filter === 'all' || t.category === filter);
    const byMonth = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = monthKey(t.date);
      byMonth.set(key, [...(byMonth.get(key) ?? []), t]);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        title: formatThaiMonth(month),
        total: data.reduce((s, t) => s + t.amount, 0),
        data,
      }));
  }, [state.transactions, filter]);

  const confirmDelete = (tx: Transaction) => {
    const remove = () => dispatch({ type: 'deleteTransaction', id: tx.id });
    if (Platform.OS === 'web') {
      if (window.confirm(`ลบ ${tx.merchant}?`)) remove();
      return;
    }
    Alert.alert('ลบรายการ', `ลบ ${tx.merchant} ${formatTHB(tx.amount)}?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="title">รายการ</T>
          <Button label="เพิ่ม" icon="add" onPress={() => router.push('/transaction/new')} />
        </Row>
        <Chips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'ทั้งหมด' },
            ...CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORIES[id].label })),
          ]}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 48 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Row style={{ justifyContent: 'space-between', marginTop: space.lg, marginBottom: space.xs }}>
            <T variant="heading">{section.title}</T>
            <T muted>{formatTHB(section.total)}</T>
          </Row>
        )}
        renderItem={({ item }) => <TransactionRow tx={item} onLongPress={() => confirmDelete(item)} />}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="ยังไม่มีรายการ" hint="สแกนสลิปหรือเพิ่มรายจ่ายเองได้เลย" />
        }
        ListFooterComponent={
          sections.length ? (
            <T variant="caption" muted style={{ textAlign: 'center', marginTop: space.lg }}>
              กดค้างที่รายการเพื่อลบ
            </T>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
