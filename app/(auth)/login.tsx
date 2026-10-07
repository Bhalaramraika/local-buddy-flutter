import React, { useState, useRef, useEffect } from 'react';
import { Animated, View, Text, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Animation } from '@/constants/design';
import { SoftButton, SoftCard } from '@/components/ui';
import { authService, normalizeEmail } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';

const duration = 400;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: duration * 0.8, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1, ...Animation.gentle, useNativeDriver: true }),
      Animated.spring(buttonAnim, { toValue: 1, ...Animation.spring, useNativeDriver: true }),
      Animated.spring(iconAnim, { toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const iconScale = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [36, 0] });
  const buttonScale = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

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
      {/* Decorative soft circles */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.inner}>
        {/* Back + brand mark */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back-outline" size={22} color={Colors.text.secondary} />
          </Pressable>
          <View style={styles.brandMark}>
            <Ionicons name="people-outline" size={18} color={Colors.surface.secondary} />
          </View>
        </View>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: headerAnim, transform: [{ scale: iconScale }] }]}>
          <View style={styles.heroBadge}>
            <Ionicons name="lock-closed-outline" size={32} color={Colors.brand.primary} />
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSub}>Sign in with your email — we'll send you a quick 6-digit code.</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: cardAnim, transform: [{ translateY: cardTranslateY }] }]}>
          <SoftCard padding={6} style={styles.cardInner}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={[styles.inputWrap, focused && styles.inputFocused, error ? styles.inputErrorState : null]}>
              <Ionicons name="mail-outline" size={20} color={focused ? Colors.brand.primary : Colors.text.muted} />
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
              <Text style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={12} color={Colors.semantic.error} /> {error}
              </Text>
            ) : null}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <SoftButton
                label="Continue with OTP"
                onPress={requestOtp}
                loading={loading}
                size="lg"
                tone="brand"
                withGlow
                icon="mail-outline"
              />
            </Animated.View>
          </SoftCard>
        </Animated.View>

        {/* Supporting links */}
        <View style={styles.links}>
          <Pressable onPress={() => router.push('/welcome')} hitSlop={8}>
            <Text style={styles.linkTextMuted}>Back to welcome</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.primary },
  inner: { flex: 1, paddingHorizontal: Spacing[6], paddingTop: Spacing[2] },
  blob: {
    position: 'absolute',
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.brand.primary,
  },
  blobTop: { top: -100, right: -140, width: 300, height: 300, opacity: 0.08 },
  blobBottom: { bottom: -80, left: -100, width: 200, height: 200, opacity: 0.05, backgroundColor: Colors.brand.accent },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[8], marginTop: Spacing[2] },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.light },
  brandMark: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: Spacing[8] },
  heroBadge: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: Colors.brand.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.bold, fontSize: 30, color: Colors.text.primary,
    textAlign: 'center', marginBottom: Spacing[2], letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: Typography.fontFamily.regular, fontSize: 15, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 22,
  },
  card: { marginBottom: Spacing[7] },
  cardInner: { borderRadius: BorderRadius['2xl'] },
  fieldLabel: {
    fontFamily: Typography.fontFamily.semiBold, fontSize: 13, color: Colors.text.secondary,
    marginBottom: Spacing[2], marginLeft: Spacing[1],
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderWidth: 1.5, borderColor: 'transparent',
  },
  inputFocused: { borderColor: Colors.brand.primary, backgroundColor: Colors.surface.secondary },
  inputErrorState: { borderColor: Colors.semantic.error },
  input: {
    flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: 16,
    color: Colors.text.primary, paddingVertical: Spacing[3], includeFontPadding: false,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.semantic.error,
    marginTop: Spacing[2], marginLeft: Spacing[1],
  },
  links: { alignItems: 'center' },
  linkText: {
    fontFamily: Typography.fontFamily.regular, fontSize: 14, color: Colors.text.secondary, textAlign: 'center',
  },
  linkAccent: { color: Colors.brand.accent, fontFamily: Typography.fontFamily.semiBold },
  linkTextMuted: {
    fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.text.muted, textAlign: 'center',
  },
});
