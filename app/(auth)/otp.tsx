/**
 * OTP Verification Screen — Soft Modern
 * Cream canvas, Playfair headline, white OTP card with
 * orange-focused rounded digit boxes, Moti entrances.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { authService, normalizeEmail } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const OTP_LEN = 6;

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string; mode?: string; name?: string; phone?: string }>();
  const { login, updateProfile, isLoading, error } = useAuth();
  const email = normalizeEmail(String(params.email || ''));

  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  useEffect(() => {
    if (timerActive && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      // Defer — no sync setState inside the effect body.
      const t = setTimeout(() => setTimerActive(false), 0);
      return () => clearTimeout(t);
    }
  }, [timer, timerActive]);

  const startTimer = () => {
    setTimer(60);
    setTimerActive(true);
  };

  const verify = async () => {
    if (otp.length !== OTP_LEN || !/^\d+$/.test(otp)) {
      setLocalError(`Enter the 6-digit OTP sent to your email.`);
      return;
    }
    try {
      setLocalError(null);
      await login(email, otp);
      if (params.mode === 'register') {
        await updateProfile({
          name: String(params.name || '').trim() || undefined,
          phone: String(params.phone || '').trim() || undefined,
        });
      }
      const currentUser = useAuthStore.getState().user;
      router.replace(currentUser?.profileCompleted || currentUser?.city ? '/home' : '/(onboarding)/setup');
    } catch { /* AuthContext exposes the error */ }
  };

  const resend = async () => {
    try {
      setResending(true);
      await authService.requestOtp(email);
      setLocalError('A new OTP was sent.');
      startTimer();
    } catch (resendError: any) {
      setLocalError(getApiErrorMessage(resendError, 'Unable to resend OTP.'));
    } finally {
      setResending(false);
    }
  };

  useEffect(() => { void Promise.resolve().then(startTimer); }, []);
  useEffect(() => {
    if (otp.length === OTP_LEN) {
      // Small auto-submit delay; no jarring instant feels → we want subtle happiness
      const t = setTimeout(() => verify(), 350);
      return () => clearTimeout(t);
    }
  }, [otp]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Warm deco blob */}
      <View style={[styles.blob, styles.blobTop]} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </Pressable>
          <View style={styles.brandMark}>
            <Ionicons name="people" size={14} color="#FFFFFF" />
            <Text style={styles.brand}>Local Buddy</Text>
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
            <Ionicons name="shield-checkmark" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.heroTitle}>Check your inbox</Text>
          <Text style={styles.heroSub}>
            We sent a {OTP_LEN}-digit code to{'\n'}
            <Text style={styles.emph}>{email || 'your email'}</Text>
          </Text>
        </MotiView>

        {/* OTP Card */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 140 }}
          style={styles.cardWrap}
        >
          <Pressable style={styles.cardInner} onPress={() => { inputRef.current?.focus(); Keyboard.isVisible(); }}>
            {/*
             * The TextInput OVERLAYS the digit boxes (absolute fill, nearly
             * invisible). Taps anywhere on the boxes hit the native input
             * directly, so the keyboard opens reliably on Android + iOS.
             * (The old 1x1px "hidden" input at the corner wasn't focusable,
             * so tapping the boxes never opened the keyboard.)
             */}
            <View style={styles.otpField}>
              <View style={styles.boxes} pointerEvents="none">
                {Array.from({ length: OTP_LEN }, (_, i) => {
                  const filled = otp.length > i;
                  const active = otp.length === i;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.box,
                        filled && styles.boxFilled,
                        active && styles.boxActive,
                      ]}
                    >
                      <Text style={[styles.digit, filled && styles.digitFilled]}>
                        {otp[i] || ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LEN))}
                keyboardType="number-pad"
                maxLength={OTP_LEN}
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                autoFocus
                caretHidden
                selectionColor="transparent"
                style={styles.overlayInput}
                accessibilityLabel="One-time password input"
              />
            </View>
          </Pressable>

          {localError || error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={13} color={Colors.semantic.error} />
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          ) : null}

          <SoftButton
            label="Verify & continue"
            onPress={verify}
            loading={isLoading}
            size="lg"
            variant="accent"
            withGlow
            icon="checkmark-circle-outline"
            style={styles.cta}
          />

          <View style={styles.helpers}>
            <Text style={styles.resendText}>
              Didn&apos;t receive the code?{'\n'}
              <Text style={styles.resendPlus} onPress={resend} disabled={resending || timerActive}>
                {timerActive ? `Resend in ${timer}s` : 'Resend OTP'}
              </Text>
            </Text>
          </View>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.primary },
  container: { flex: 1, paddingHorizontal: Spacing[6], paddingTop: Spacing[3] },
  blob: {
    position: 'absolute', borderRadius: BorderRadius.pill,
    backgroundColor: Colors.brand.accent, opacity: 0.1,
  },
  blobTop: { top: -120, right: -130, width: 310, height: 310 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[7] },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface.elevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.cardPressed,
  },
  brandMark: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], ...Shadows.button,
  },
  brand: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12, color: '#FFFFFF', letterSpacing: 0.4 },
  hero: { alignItems: 'center', marginBottom: Spacing[7] },
  heroBadge: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4], ...Shadows.card,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.display, fontSize: 30, lineHeight: 38,
    color: Colors.text.primary, marginBottom: Spacing[2],
  },
  heroSub: {
    fontFamily: Typography.fontFamily.body, fontSize: 14.5, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 22,
  },
  emph: { fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accent },
  cardWrap: { marginBottom: Spacing[6] },
  cardInner: {
    borderRadius: BorderRadius['2xl'], padding: Spacing[6], alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    marginBottom: Spacing[5], ...Shadows.elevated,
  },
  boxes: { flexDirection: 'row', gap: Spacing[2], justifyContent: 'center' },
  box: {
    width: 46, height: 56, borderRadius: BorderRadius.md, borderWidth: 1.5,
    borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  boxActive: { borderColor: Colors.brand.accent, ...Shadows.cardPressed },
  boxFilled: { backgroundColor: Colors.brand.accentSoft, borderColor: Colors.brand.accent },
  digit: { fontFamily: Typography.fontFamily.bold, fontSize: 22, color: Colors.text.muted, includeFontPadding: false },
  digitFilled: { color: Colors.brand.accentPressed },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: Spacing[4] },
  errorText: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.semantic.error },
  cta: { width: '100%', maxWidth: 340, alignSelf: 'center' },
  otpField: { position: 'relative', alignSelf: 'center' },
  // Full-size transparent overlay: receives the tap directly so the
  // keyboard always opens; opacity must stay > 0 for Android hit-testing.
  overlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 1,
  },
  helpers: { marginTop: Spacing[6] },
  resendText: { fontFamily: Typography.fontFamily.body, fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  resendPlus: { color: Colors.brand.accent, fontFamily: Typography.fontFamily.semiBold, fontSize: 14 },
});
