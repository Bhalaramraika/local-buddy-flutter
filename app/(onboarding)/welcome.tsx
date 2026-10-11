/**
 * Welcome Screen — Soft Modern
 * Antique-white canvas, cocoa logo mark, Playfair headline,
 * white feature cards, orange CTA — the style every screen follows.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';

const FEATURES = [
  { icon: 'flash' as const, label: 'Fast Help', detail: 'Tasks posted in 60 seconds' },
  { icon: 'shield-checkmark' as const, label: 'Trusted', detail: 'Every buddy is verified' },
  { icon: 'cash' as const, label: 'Real Earnings', detail: 'Payouts go straight to wallet' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Soft decorative background */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <View style={styles.hero}>
        {/* Logo mark */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 120 }}
          style={styles.logoWrap}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="people" size={42} color="#FFFFFF" />
          </View>
          <View style={styles.logoGlow} />
        </MotiView>

        {/* Brand */}
        <MotiView
          from={{ opacity: 0, translateY: 22 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 120 }}
          style={{ alignItems: 'center' }}
        >
          <Text style={styles.eyebrow}>LOCAL BUDDY</Text>
          <Text style={styles.headline}>Small help,{'\n'}close to home.</Text>
          <Text style={styles.sub}>Post a task. Get help from verified local buddies. Earn when you help.</Text>
        </MotiView>

        {/* Feature chips */}
        <View style={styles.featuresRow}>
          {FEATURES.map((f, i) => (
            <MotiView
              key={f.label}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 160, delay: 320 + i * 90 }}
              style={styles.featureWrap}
            >
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={19} color={Colors.brand.accent} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDetail}>{f.detail}</Text>
              </View>
            </MotiView>
          ))}
        </View>
      </View>

      {/* CTA */}
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 620 }}
        style={styles.ctaGroup}
      >
        <SoftButton
          label="Get started — it's free"
          onPress={() => router.push('/(onboarding)/setup')}
          variant="accent"
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
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  blob: { position: 'absolute', borderRadius: BorderRadius.pill },
  blob1: {
    top: -120, right: -140, width: 320, height: 320,
    backgroundColor: Colors.brand.accent, opacity: 0.1,
  },
  blob2: {
    bottom: -60, left: -100, width: 240, height: 240,
    backgroundColor: Colors.brand.primary, opacity: 0.06,
  },
  blob3: {
    top: '42%', right: -80, width: 140, height: 140,
    backgroundColor: Colors.semantic.success, opacity: 0.08,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[6] },
  logoWrap: { marginBottom: Spacing[8], alignItems: 'center' },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  logoGlow: {
    position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
    borderRadius: BorderRadius.pill, borderWidth: 1.5,
    borderColor: Colors.brand.accent + '40',
  },
  eyebrow: {
    color: Colors.brand.accent, fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold, letterSpacing: 3.5,
    marginBottom: Spacing[3], includeFontPadding: false,
  },
  headline: {
    color: Colors.text.primary, fontSize: 38, fontFamily: Typography.fontFamily.display,
    lineHeight: 46, textAlign: 'center', marginBottom: Spacing[4],
  },
  sub: {
    color: Colors.text.secondary, fontSize: 15.5, fontFamily: Typography.fontFamily.body,
    lineHeight: 24, textAlign: 'center', paddingHorizontal: Spacing[2], marginBottom: Spacing[9],
  },
  featuresRow: {
    flexDirection: 'row', gap: Spacing[3], width: '100%', maxWidth: 350,
  },
  featureWrap: { flex: 1 },
  feature: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    padding: Spacing[3], alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  featureIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2],
  },
  featureLabel: { color: Colors.text.primary, fontSize: 12, fontFamily: Typography.fontFamily.semiBold, textAlign: 'center' },
  featureDetail: { color: Colors.text.muted, fontSize: 10, fontFamily: Typography.fontFamily.body, textAlign: 'center', marginTop: 3, lineHeight: 13.5 },
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
    textAlign: 'center', color: Colors.text.muted, fontSize: 11, fontFamily: Typography.fontFamily.body, lineHeight: 18, marginTop: Spacing[4],
  },
  link: { color: Colors.brand.accent, fontFamily: Typography.fontFamily.semiBold },
});
