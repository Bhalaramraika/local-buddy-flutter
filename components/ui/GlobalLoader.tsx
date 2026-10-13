/**
 * GlobalLoader — app-wide centered orange loading overlay.
 *
 * Shown automatically for every in-flight API request (see
 * services/api.ts request tracker) and manually via
 * uiStore.setGlobalLoading({ isLoading, message }).
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useUIStore } from '@/store/uiStore';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/design';

const ORANGE = Colors.brand.accent; // #F77051

export function GlobalLoader() {
  const { isLoading, message } = useUIStore((s) => s.globalLoading);

  const fade = React.useState(() => new Animated.Value(0))[0];
  const pulse = React.useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(fade, {
      toValue: isLoading ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fade]);

  useEffect(() => {
    if (!isLoading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading, pulse]);

  if (!isLoading) return null;

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, { opacity: fade }]}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}
    >
      <View style={styles.card}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]} />
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
        <Text style={styles.text}>{message || 'Loading…'}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 18, 9, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius['2xl'] - 8,
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[8],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#1E1209',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  ringWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ORANGE + '22',
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default GlobalLoader;
