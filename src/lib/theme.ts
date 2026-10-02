// "Candy Clay" design system: warm cream canvas, pastel candy accents, puffy
// clay-like cards with soft double shadows, chunky 3D buttons and the rounded
// Thai typeface Mali.
import { useColorScheme } from 'react-native';

const palette = {
  light: {
    background: '#FFF7EE',
    backgroundAlt: '#FDEBDD',
    card: '#FFFFFF',
    cardMuted: '#F6EEF9',
    border: '#F1E3EA',
    text: '#2B2140',
    textMuted: '#8A7E9E',
    primary: '#7B5CFF',
    primaryDeep: '#5B3FE0',
    primarySoft: '#ECE6FF',
    onPrimary: '#FFFFFF',
    pink: '#FF7EB3',
    pinkSoft: '#FFE3EF',
    mint: '#2FCB95',
    mintSoft: '#DDF8EC',
    lemon: '#FFC93C',
    lemonSoft: '#FFF3CC',
    peach: '#FF9A6B',
    peachSoft: '#FFE6D9',
    sky: '#5AB8FF',
    skySoft: '#DFF1FF',
    danger: '#FF5C7A',
    dangerSoft: '#FFE1E7',
    warning: '#F5A524',
    warningSoft: '#FFF0D2',
    success: '#2FCB95',
    successSoft: '#DDF8EC',
    shadow: 'rgba(123, 92, 255, 0.16)',
    highlight: 'rgba(255, 255, 255, 0.9)',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#17112A',
    backgroundAlt: '#211838',
    card: '#251C40',
    cardMuted: '#2F2550',
    border: '#3A2E60',
    text: '#F7F2FF',
    textMuted: '#AFA3CC',
    primary: '#9C84FF',
    primaryDeep: '#7356F0',
    primarySoft: '#33285F',
    onPrimary: '#FFFFFF',
    pink: '#FF8DBD',
    pinkSoft: '#43253F',
    mint: '#4BDDA8',
    mintSoft: '#1D3A36',
    lemon: '#FFD45E',
    lemonSoft: '#3D3420',
    peach: '#FFA77E',
    peachSoft: '#402B2A',
    sky: '#74C4FF',
    skySoft: '#1E3150',
    danger: '#FF7690',
    dangerSoft: '#47233A',
    warning: '#FFB84D',
    warningSoft: '#3F3220',
    success: '#4BDDA8',
    successSoft: '#1D3A36',
    shadow: 'rgba(0, 0, 0, 0.45)',
    highlight: 'rgba(255, 255, 255, 0.06)',
    tabBar: '#251C40',
  },
};

export type Palette = typeof palette.light;
export type Tone = 'primary' | 'pink' | 'mint' | 'lemon' | 'peach' | 'sky' | 'danger' | 'warning' | 'success';

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

export function toneColors(c: Palette, tone: Tone): { fg: string; bg: string } {
  return { fg: c[tone], bg: c[`${tone}Soft`] };
}

export const fonts = {
  regular: 'Mali_400Regular',
  medium: 'Mali_500Medium',
  semibold: 'Mali_600SemiBold',
  bold: 'Mali_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 12, md: 20, lg: 28, pill: 999 } as const;

/** Puffy clay look: a soft drop shadow plus an inner top highlight. */
export function clayShadow(c: Palette, lifted = false): string {
  const drop = lifted ? `0px 14px 28px ${c.shadow}` : `0px 8px 20px ${c.shadow}`;
  return `${drop}, inset 0px 2px 0px ${c.highlight}`;
}
