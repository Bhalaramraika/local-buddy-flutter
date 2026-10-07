import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/design';
import { SoftButton } from '@/components/ui';

const { useNativeDriver } = { useNativeDriver: true };

const FEATURES = [
  { icon: 'flash-outline' as const, label: 'Fast Help', detail: 'Tasks posted in 60 seconds' },
  { icon: 'shield-checkmark-outline' as const, label: 'Trusted', detail: 'Every buddy is verified' },
  { icon: 'cash-outline' as const, label: 'Real Earnings', detail: 'Payouts go straight to wallet' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(48)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 12, stiffness: 100, useNativeDriver }),
      ...FEATURES.map((_, i) => Animated.timing(featureAnims[i], { toValue: 1, duration: 400, delay: 300 + i * 80, useNativeDriver })),
      Animated.spring(ctaAnim, { toValue: 1, damping: 20, stiffness: 140, useNativeDriver }),
    ]).start();
  }, []);

  const ctaOpacity = ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const ctaTranslateY = ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={styles.container}>
      {/* Soft decorative background */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <View style={styles.hero}>
        {/* Logo mark */}
        <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="people-outline" size={44} color={Colors.surface.secondary} />
          </View>
          <View style={styles.logoGlow} />
        </Animated.View>

        {/* Brand */}
        <Animated.Text style={[styles.eyebrow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          LOCAL BUDDY
        </Animated.Text>
        <Animated.Text style={[styles.headline, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          Small help,{'\n'}close to home.
        </Animated.Text>
        <Animated.Text style={[styles.sub, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          Post a task. Get help from verified local buddies. Earn when you help.
        </Animated.Text>

        {/* Feature chips */}
        <View style={styles.featuresRow}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.label}
              style={[styles.feature, { opacity: featureAnims[i], transform: [{ scale: featureAnims[i] }] }]}
            >
              <View style={[styles.featureIcon, { borderColor: Colors.border.light }]}>
                <Ionicons name={f.icon} size={20} color={Colors.brand.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDetail}>{f.detail}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <Animated.View style={[styles.ctaGroup, { opacity: ctaOpacity, transform: [{ translateY: ctaTranslateY }] }]}>
        <SoftButton
          label="Get started — it's free"
          onPress={() => router.push('/(onboarding)/role-selection')}
          tone="accent"
          size="lg"
          withGlow
          icon="arrow-forward"
        />
        <Pressable
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.secondaryLink, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.secondaryLinkText}>I already have an account</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.text.secondary} style={{ marginLeft: 4 }} />
        </Pressable>
        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.link}>Terms</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  blob: { position: 'absolute', borderRadius: BorderRadius.pill, opacity: 0.5 },
  blob1: {
    top: -120, right: -140, width: 320, height: 320,
    backgroundColor: Colors.brand.primary + '0E',
  },
  blob2: {
    bottom: -60, left: -100, width: 240, height: 240,
    backgroundColor: Colors.brand.accent + '12',
    borderRadius: BorderRadius.pill,
  },
  blob3: {
    top: '42%', right: -80, width: 140, height: 140,
    backgroundColor: Colors.semantic.success + '10',
    borderRadius: BorderRadius.pill,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[6] },
  logoWrap: { marginBottom: Spacing[8], alignItems: 'center' },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
    borderRadius: BorderRadius.pill, borderWidth: 1.5,
    borderColor: Colors.brand.primary + '25',
  },
  eyebrow: {
    color: Colors.brand.primary, fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold, letterSpacing: 3,
    marginBottom: Spacing[3], includeFontPadding: false,
  },
  headline: {
    color: Colors.text.primary, fontSize: 36, fontFamily: Typography.fontFamily.bold,
    lineHeight: 44, textAlign: 'center', marginBottom: Spacing[3], letterSpacing: -0.5,
  },
  sub: {
    color: Colors.text.secondary, fontSize: 16, fontFamily: Typography.fontFamily.regular,
    lineHeight: 24, textAlign: 'center', paddingHorizontal: Spacing[2], marginBottom: Spacing[10],
  },
  featuresRow: {
    flexDirection: 'row', gap: Spacing[3], width: '100%', maxWidth: 340,
  },
  feature: {
    flex: 1, backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    padding: Spacing[3], alignItems: 'center', borderWidth: 1, borderColor: Colors.border.light,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surface.tertiary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2],
  },
  featureLabel: { color: Colors.text.primary, fontSize: 12, fontFamily: Typography.fontFamily.semiBold, textAlign: 'center' },
  featureDetail: { color: Colors.text.muted, fontSize: 10, textAlign: 'center', marginTop: 2, lineHeight: 13 },
  ctaGroup: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[8] },
  secondaryLink: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing[3], marginTop: Spacing[4],
  },
  secondaryLinkText: {
    color: Colors.text.secondary, fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
  },
  terms: {
    textAlign: 'center', color: Colors.text.muted, fontSize: 11, lineHeight: 18, marginTop: Spacing[4],
  },
  link: { color: Colors.brand.primary, fontFamily: Typography.fontFamily.semiBold },
});
