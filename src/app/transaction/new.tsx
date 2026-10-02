import { router } from 'expo-router';

import { TransactionForm, emptyDraft } from '@/components/transaction-form';
import { Screen } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function NewTransactionScreen() {
  const { dispatch } = useStore();
  return (
    <Screen safeTop={false}>
      <TransactionForm
        initial={emptyDraft()}
        source="manual"
        onSubmit={(transaction) => {
          dispatch({ type: 'addTransaction', transaction });
          router.back();
        }}
      />
    </Screen>
  );
}
