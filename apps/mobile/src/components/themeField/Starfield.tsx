import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

type Star = { x: number; y: number; size: number; delay: number; };

interface Props {
  active?: boolean;        // star 테마에서만 true로
  count?: number;          // 별 개수
  color?: string;          // 별 색상
  maxOpacity?: number;     // 최대 불투명도
}

const Starfield: React.FC<Props> = ({
  active = true,
  count = 70,
  color = 'rgba(255,255,255,0.9)',
  maxOpacity = 0.9,
}) => {
  const { width, height } = useWindowDimensions();

  // 랜덤 별 좌표/크기 세트
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1.2,          // 1.2 ~ 3.2 px
        delay: Math.random() * 2000,            // 시작 지연
      })),
    [count, width, height]
  );

  // 각 별의 opacity 애니메이터
  const anims = useRef(stars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;

    const loops = anims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: maxOpacity,
            duration: 1200 + (i % 5) * 200,
            delay: stars[i].delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.1,
            duration: 1400 + (i % 7) * 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active, anims, maxOpacity, stars]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((s, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              backgroundColor: color,
              opacity: anims[i],
              transform: [{ scale: anims[i].interpolate({
                inputRange: [0, maxOpacity],
                outputRange: [0.8, 1.1],
              })}],
            },
          ]}
        />
      ))}
      {/* 은은한 비네팅(가장자리 어둡게) */}
      <View style={styles.vignette} />
    </View>
  );
};

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // 가장자리 살짝 어둡게 (안드로이드/IOS 공통)
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 40,
  },
});

export default Starfield;