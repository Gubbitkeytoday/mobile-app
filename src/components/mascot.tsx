import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import type { MascotMood } from '@/lib/mascot';

/**
 * "น้องตังค์" — a squishy golden coin-mochi with a savings sprout on its head.
 * Its face reflects the user's financial mood.
 */
export function Mascot({
  mood = 'happy',
  size = 120,
  animated = true,
  style,
}: {
  mood?: MascotMood;
  size?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const float = useSharedValue(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!animated) return;
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200);
    return () => clearInterval(id);
  }, [animated, float]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 * float.value },
      { scaleX: 1 + 0.02 * float.value },
      { scaleY: 1 - 0.02 * float.value },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - 0.12 * float.value }],
    opacity: 0.18 - 0.06 * float.value,
  }));

  const eyesClosed = mood === 'sleepy' || (blink && mood !== 'excited');

  return (
    <View style={[{ width: size, height: size * 1.08, alignItems: 'center' }, style]}>
      <Animated.View style={bodyStyle}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Defs>
            <RadialGradient id="body" cx="40%" cy="32%" r="75%">
              <Stop offset="0" stopColor="#FFF1A8" />
              <Stop offset="0.55" stopColor="#FFD24D" />
              <Stop offset="1" stopColor="#F5A623" />
            </RadialGradient>
            <RadialGradient id="leaf" cx="30%" cy="30%" r="80%">
              <Stop offset="0" stopColor="#9BF5C9" />
              <Stop offset="1" stopColor="#2FCB95" />
            </RadialGradient>
          </Defs>

          {/* sprout */}
          <Path d="M60 26 C60 20 60 16 61 12" stroke="#2FCB95" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M61 14 C66 4 80 4 82 10 C76 16 66 18 61 14 Z" fill="url(#leaf)" />
          <Path d="M60 16 C55 8 44 8 42 13 C47 18 56 19 60 16 Z" fill="url(#leaf)" />

          {/* arms */}
          {mood === 'excited' ? (
            <>
              <Ellipse cx={17} cy={52} rx={8} ry={11} fill="#F5B53A" transform="rotate(-35 17 52)" />
              <Ellipse cx={103} cy={52} rx={8} ry={11} fill="#F5B53A" transform="rotate(35 103 52)" />
            </>
          ) : (
            <>
              <Ellipse cx={15} cy={78} rx={8} ry={10} fill="#F5B53A" />
              <Ellipse cx={105} cy={78} rx={8} ry={10} fill="#F5B53A" />
            </>
          )}

          {/* body */}
          <Ellipse cx={60} cy={70} rx={46} ry={43} fill="url(#body)" />
          <Ellipse cx={60} cy={70} rx={38} ry={35} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2} />
          <Ellipse cx={42} cy={44} rx={12} ry={7} fill="#FFFFFF" opacity={0.55} transform="rotate(-25 42 44)" />

          {/* cheeks */}
          <Ellipse cx={33} cy={80} rx={8} ry={5} fill="#FF8FB8" opacity={0.75} />
          <Ellipse cx={87} cy={80} rx={8} ry={5} fill="#FF8FB8" opacity={0.75} />

          {/* eyes */}
          <G>
            {eyesClosed ? (
              <>
                <Path d="M38 68 Q45 73 52 68" stroke="#2B2140" strokeWidth={3.5} strokeLinecap="round" fill="none" />
                <Path d="M68 68 Q75 73 82 68" stroke="#2B2140" strokeWidth={3.5} strokeLinecap="round" fill="none" />
              </>
            ) : mood === 'excited' ? (
              <>
                <Path d="M38 70 L45 63 L52 70" stroke="#2B2140" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M68 70 L75 63 L82 70" stroke="#2B2140" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </>
            ) : (
              <>
                <Ellipse cx={45} cy={mood === 'thinking' ? 64 : 67} rx={6.5} ry={8} fill="#2B2140" />
                <Ellipse cx={75} cy={mood === 'thinking' ? 64 : 67} rx={6.5} ry={8} fill="#2B2140" />
                <Circle cx={47.5} cy={mood === 'thinking' ? 61 : 64} r={2.6} fill="#FFFFFF" />
                <Circle cx={77.5} cy={mood === 'thinking' ? 61 : 64} r={2.6} fill="#FFFFFF" />
                <Circle cx={43} cy={mood === 'thinking' ? 67 : 70} r={1.2} fill="#FFFFFF" />
                <Circle cx={73} cy={mood === 'thinking' ? 67 : 70} r={1.2} fill="#FFFFFF" />
              </>
            )}
          </G>

          {/* brows */}
          {mood === 'worried' && (
            <>
              <Path d="M37 54 L50 57" stroke="#2B2140" strokeWidth={3} strokeLinecap="round" />
              <Path d="M83 54 L70 57" stroke="#2B2140" strokeWidth={3} strokeLinecap="round" />
            </>
          )}

          {/* mouth */}
          {mood === 'happy' && (
            <Path d="M52 83 Q60 91 68 83" stroke="#2B2140" strokeWidth={3.5} strokeLinecap="round" fill="none" />
          )}
          {mood === 'excited' && <Path d="M50 81 Q60 97 70 81 Z" fill="#2B2140" />}
          {mood === 'excited' && <Ellipse cx={60} cy={88} rx={5} ry={3} fill="#FF7EB3" />}
          {mood === 'worried' && (
            <Path d="M51 88 Q55 84 60 88 Q65 92 69 88" stroke="#2B2140" strokeWidth={3} strokeLinecap="round" fill="none" />
          )}
          {mood === 'sleepy' && <Ellipse cx={60} cy={87} rx={4} ry={5} fill="#2B2140" />}
          {mood === 'thinking' && <Circle cx={66} cy={86} r={3.5} fill="#2B2140" />}

          {/* extras */}
          {mood === 'worried' && <Path d="M95 50 Q99 58 95 61 Q91 58 95 50 Z" fill="#7FD3FF" />}
          {mood === 'sleepy' && (
            <>
              <SvgText x={92} y={36} fontSize={16} fontWeight="bold" fill="#9C84FF">
                z
              </SvgText>
              <SvgText x={102} y={24} fontSize={11} fontWeight="bold" fill="#9C84FF">
                z
              </SvgText>
            </>
          )}
          {mood === 'excited' && (
            <>
              <Path d="M14 22 L16 28 L22 30 L16 32 L14 38 L12 32 L6 30 L12 28 Z" fill="#FFC93C" />
              <Path d="M102 18 L103.5 22 L108 23.5 L103.5 25 L102 29 L100.5 25 L96 23.5 L100.5 22 Z" fill="#FF7EB3" />
            </>
          )}
          {mood === 'thinking' && (
            <>
              <Circle cx={96} cy={40} r={3} fill="#C9BCFF" />
              <Circle cx={104} cy={30} r={4.5} fill="#C9BCFF" />
            </>
          )}
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          { width: size * 0.55, height: size * 0.07, borderRadius: size, backgroundColor: '#5B3FE0' },
          shadowStyle,
        ]}
      />
    </View>
  );
}
