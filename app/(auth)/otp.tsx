/**
 * OTP Verification Screen — Soft Premium ◆ animated boxes
 */

import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Animation } from '@/constants/design';
import { SoftButton, SoftCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { authService, normalizeEmail } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const OTP_LEN = 6;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; mode?: string; name?: string; phone?: string }>();
  const { login, updateProfile, isLoading, error } = useAuth();
  const email = normalizeEmail(String(params.email || ''));

  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(fadeAnim, { toValue: 1, ...Animation.gentle, useNativeDriver: true }).start();
    Animated.spring(scaleAnim, { toValue: 1, damping: 10, stiffness: 150, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  useEffect(() => {
    if (timerActive && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) setTimerActive(false);
  }, [timer, timerActive]);

  // Popsosed
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
      router.replace(currentUser?.profileCompleted || currentUser?.city ? '/home' : '/permissions');
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

  useEffect(() => { startTimer(); }, []);
  useEffect(() => {
    if (otp.length === OTP_LEN) {
      // Small auto-submit delay; no jarring instant feels → we want subtle happiness
      const t = setTimeout(() => verify(), 350);
      return () => clearTimeout(t);
    }
  }, [otp]);

  return (
    <View style={styles.screen}>
      {/* Soft deco */}
      <View style={[styles.blob, styles.blobTop]} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back-outline" size={22} color={Colors.text.secondary} />
          </Pressable>
          <Text style={styles.brand}>Local Buddy</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-half-outline" size={28} color={Colors.brand.primary} />
          </View>
          <Text style={styles.heroTitle}>Check your inbox</Text>
          <Text style={styles.heroSub}>
            We sent a {OTP_LEN}-digit code to{'\n'}
            <Text style={styles.emph}>{email || 'your email'}</Text>
          </Text>
        </View>

        {/* OTP Card */}
        <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <SoftCard padding={0} style={styles.cardInner}>
            {/*
             * The TextInput OVERLAYS the digit boxes (absolute fill, nearly
             * invisible). Taps anywhere on the boxes hit the native input
             * directly, so the keyboard opens reliably on Android + iOS.
             * (The old 1x1px "hidden" input at the corner wasn't focusable,
             * so tapping the boxes never opened the keyboard.)
             */}
            <View style={styles.otpField}>
              <View style={styles.boxes} pointerEvents="none">
                {Array.from({ length: OTP_LEN }, (_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.box,
                      {
                        backgroundColor: otp.length > i ? Colors.brand.primary + '14' : Colors.surface.tertiary,
                        borderColor: otp.length === i ? Colors.brand.primary : Colors.border.light,
                        transform: otp.length >= i ? [{ scale: 1.04 }] : [{ scale: 1 }],
                      },
                    ]}
                  >
                    <Text style={[styles.digit, { color: otp.length > i ? Colors.brand.primary : Colors.text.muted }]}>
                      {otp[i] || ''}
                    </Text>
                  </Animated.View>
                ))}
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
          </SoftCard>

          {localError || error ? (
            <Text style={styles.errorText}>
              <Ionicons name="alert-circle-outline" size={12} color={Colors.semantic.error} /> {localError || error}
            </Text>
          ) : null}

          <SoftButton
            label="Verify & continue"
            onPress={verify}
            loading={isLoading}
            size="lg"
            tone="brand"
            withGlow
            style={styles.cta}
          />

          <View style={styles.helpers}>
            <Text style={styles.resendText}>
              Didn't receive the code?{'\n'}
              <Text style={styles.resendPlus} onPress={resend} disabled={resending || timerActive}>
                {timerActive ? `Resend in ${timer}s` : 'Resend OTP'}
              </Text>
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.primary },
  container: { flex: 1, paddingHorizontal: Spacing[6], paddingTop: Spacing[2] },
  blob: {
    position: 'absolute', borderRadius: BorderRadius.pill,
    top: -100, right: -120, width: 300, height: 300,
    backgroundColor: Colors.brand.primary + '08',
  },
  blobTop: { top: -120, right: -130, width: 310, height: 310 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[8] },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.secondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.light, marginRight: Spacing[3],
  },
  brand: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13, color: Colors.text.muted, letterSpacing: 1 },
  hero: { alignItems: 'center', marginBottom: Spacing[7] },
  heroBadge: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.brand.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  heroTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 26, color: Colors.text.primary, marginBottom: Spacing[2], letterSpacing: -0.3 },
  heroSub: { fontFamily: Typography.fontFamily.regular, fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  emph: { fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.primary },
  cardWrap: { marginBottom: Spacing[6] },
  cardInner: { borderRadius: BorderRadius.xl, padding: Spacing[6], alignItems: 'center', marginBottom: Spacing[5] },
  boxes: { flexDirection: 'row', gap: Spacing[3], justifyContent: 'center', flexWrap: 'wrap' },
  box: {
    width: 48, height: 58, borderRadius: BorderRadius.lg, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  digit: { fontFamily: Typography.fontFamily.bold, fontSize: 22, includeFontPadding: false },
  errorText: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.semantic.error, textAlign: 'center', marginBottom: Spacing[4] },
  cta: { width: '100%', maxWidth: 320 },
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
  resendText: { fontFamily: Typography.fontFamily.regular, fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  resendPlus: { color: Colors.brand.accent, fontFamily: Typography.fontFamily.semiBold, fontSize: 14 },
});
