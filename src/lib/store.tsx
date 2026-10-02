import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

import { todayISO } from './dates';
import { buildDemoData } from './demo-data';
import type { CoachTone } from './mascot';
import type { Subscription, Transaction } from './types';

const STORAGE_KEY = 'finance-coach/state/v1';

interface State {
  ready: boolean;
  transactions: Transaction[];
  subscriptions: Subscription[];
  tone: CoachTone;
}

type Action =
  | { type: 'hydrate'; transactions: Transaction[]; subscriptions: Subscription[]; tone?: CoachTone }
  | { type: 'addTransaction'; transaction: Transaction }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'upsertSubscription'; subscription: Subscription }
  | { type: 'deleteSubscription'; id: string }
  | { type: 'logUsage'; id: string; date: string }
  | { type: 'setTone'; tone: CoachTone }
  | { type: 'reset'; transactions: Transaction[]; subscriptions: Subscription[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return {
        ready: true,
        transactions: action.transactions,
        subscriptions: action.subscriptions,
        tone: action.tone ?? 'hype',
      };
    case 'reset':
      return { ...state, ready: true, transactions: action.transactions, subscriptions: action.subscriptions };
    case 'setTone':
      return { ...state, tone: action.tone };
    case 'addTransaction':
      return {
        ...state,
        transactions: [action.transaction, ...state.transactions].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      };
    case 'deleteTransaction':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'upsertSubscription': {
      const exists = state.subscriptions.some((s) => s.id === action.subscription.id);
      return {
        ...state,
        subscriptions: exists
          ? state.subscriptions.map((s) => (s.id === action.subscription.id ? action.subscription : s))
          : [...state.subscriptions, action.subscription],
      };
    }
    case 'deleteSubscription':
      return {
        ...state,
        subscriptions: state.subscriptions.filter((s) => s.id !== action.id),
        transactions: state.transactions.map((t) =>
          t.subscriptionId === action.id ? { ...t, subscriptionId: undefined } : t,
        ),
      };
    case 'logUsage':
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.id && !s.usageLog.includes(action.date)
            ? { ...s, usageLog: [...s.usageLog, action.date] }
            : s,
        ),
      };
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ready: false,
    transactions: [],
    subscriptions: [],
    tone: 'hype',
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          dispatch({
            type: 'hydrate',
            transactions: saved.transactions ?? [],
            subscriptions: saved.subscriptions ?? [],
            tone: saved.tone === 'roast' ? 'roast' : 'hype',
          });
          return;
        }
      } catch {
        // Corrupt or unreadable storage: fall through to demo data.
      }
      dispatch({ type: 'hydrate', ...buildDemoData(todayISO()) });
    })();
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ transactions: state.transactions, subscriptions: state.subscriptions, tone: state.tone }),
    ).catch(() => {});
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
