import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useColors } from '@/lib/theme';

/** Rounded-cap donut chart; segments are separated by small gaps. */
export function Donut({
  segments,
  size = 150,
  thickness = 22,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const c = useColors();
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const gap = segments.length > 1 ? thickness * 0.9 : 0;

  let offset = 0;
  const arcs = total
    ? segments.map((seg, i) => {
        const len = (seg.value / total) * circumference;
        const visible = Math.max(len - gap, 0.01);
        const arc = (
          <Circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={seg.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${visible} ${circumference - visible}`}
            strokeDashoffset={-offset - gap / 2}
          />
        );
        offset += len;
        return arc;
      })
    : [];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.cardMuted} strokeWidth={thickness} fill="none" />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {arcs}
        </G>
      </Svg>
      {children}
    </View>
  );
}
