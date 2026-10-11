/**
 * Login Screen — Soft Modern
 * Cream canvas, warm blobs, Playfair headline,
 * white soft card + orange CTA with Moti entrances.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';
import { authService, normalizeEmail } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const requestOtp = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      Keyboard.dismiss();
      await authService.requestOtp(normalizedEmail);
      router.push({ pathname: '/otp', params: { email: normalizedEmail, mode: 'login' } });
    } catch (requestError: any) {
      setError(getApiErrorMessage(requestError, 'Unable to send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Decorative warm blobs */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.inner}>
        {/* Back + brand mark */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </Pressable>
          <View style={styles.brandMark}>
            <Ionicons name="people" size={16} color="#FFFFFF" />
          </View>
        </View>

        {/* Hero */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="lock-closed" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSub}>Sign in with your email — we'll send you a quick 6-digit code.</Text>
        </MotiView>

        {/* Card */}
        <MotiView
          from={{ opacity: 0, translateY: 36 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 120 }}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={[styles.inputWrap, focused && styles.inputFocused, error ? styles.inputErrorState : null]}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="mail" size={17} color={focused ? Colors.brand.accent : Colors.text.muted} />
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor={Colors.text.muted}
                autoComplete="email"
                autoFocus
                style={styles.input}
              />
            </View>
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color={Colors.semantic.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <View style={styles.ctaWrap}>
              <SoftButton
                label="Continue with OTP"
                onPress={requestOtp}
                loading={loading}
                size="lg"
                variant="accent"
                withGlow
                icon="mail-outline"
              />
            </View>
          </View>
        </MotiView>

        {/* Supporting links */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 320 }}
          style={styles.links}
        >
          <Pressable onPress={() => router.push('/welcome')} hitSlop={8}>
            <Text style={styles.linkTextMuted}>Back to welcome</Text>
          </Pressable>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.primary },
  inner: { flex: 1, paddingHorizontal: Spacing[6], paddingTop: Spacing[3] },
  blob: {
    position: 'absolute',
    borderRadius: BorderRadius.pill,
  },
  blobTop: { top: -110, right: -140, width: 300, height: 300, backgroundColor: Colors.brand.accent, opacity: 0.1 },
  blobBottom: { bottom: -90, left: -110, width: 220, height: 220, backgroundColor: Colors.brand.primary, opacity: 0.06 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[8] },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface.elevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.cardPressed,
  },
  brandMark: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  hero: { alignItems: 'center', marginBottom: Spacing[8] },
  heroBadge: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
    ...Shadows.card,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.display, fontSize: 32, lineHeight: 40,
    color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing[3],
  },
  heroSub: {
    fontFamily: Typography.fontFamily.body, fontSize: 14.5, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 22,
  },
  card: { marginBottom: Spacing[7] },
  cardInner: {
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[6], ...Shadows.elevated,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.text.secondary,
    marginBottom: Spacing[2], marginLeft: Spacing[1],
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: Colors.border.light,
  },
  inputFocused: { borderColor: Colors.brand.accent, backgroundColor: Colors.surface.secondary },
  inputErrorState: { borderColor: Colors.semantic.error },
  inputIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surface.creamSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, fontFamily: Typography.fontFamily.body, fontSize: 15.5,
    color: Colors.text.primary, paddingVertical: Spacing[3] + 2, includeFontPadding: false,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing[2], marginLeft: Spacing[1] },
  errorText: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.semantic.error },
  ctaWrap: { marginTop: Spacing[5] },
  links: { alignItems: 'center' },
  linkTextMuted: {
    fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.text.muted, textAlign: 'center',
  },
});
