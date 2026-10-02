import { useColorScheme } from 'react-native';

const palette = {
  light: {
    background: '#F6F7FB',
    card: '#FFFFFF',
    cardMuted: '#EEF0F6',
    border: '#E3E6EE',
    text: '#0F172A',
    textMuted: '#64748B',
    primary: '#4F46E5',
    primarySoft: '#E0E7FF',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    success: '#059669',
    successSoft: '#D1FAE5',
  },
  dark: {
    background: '#0B0F19',
    card: '#151B2B',
    cardMuted: '#1E2638',
    border: '#263049',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    primary: '#818CF8',
    primarySoft: '#262B57',
    onPrimary: '#0B0F19',
    danger: '#F87171',
    dangerSoft: '#3B1D24',
    warning: '#FBBF24',
    warningSoft: '#3A2E14',
    success: '#34D399',
    successSoft: '#123227',
  },
};

export type Palette = typeof palette.light;

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 14, lg: 20 } as const;
