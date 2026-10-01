import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, Pressable, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authService, normalizeEmail } from '@/services/auth';
import { isMockApiEnabled } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ErrorMessage, FlowHeader, FlowScreen, PrimaryButton, TextButton, Card, flowStyles } from '@/components/FlowUI';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Animation } from '@/constants/design';

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
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  useEffect(() => {
    if (timerActive && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setTimerActive(false);
    }
  }, [timer, timerActive]);

  const startTimer = () => {
    setTimer(60);
    setTimerActive(true);
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setLocalError('Enter the 6-digit OTP sent to your email.');
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
    } catch {
      // AuthContext exposes the error below.
    }
  };

  const resend = async () => {
    try {
      setResending(true);
      await authService.requestOtp(email);
      setLocalError('A new OTP was sent.');
      startTimer();
    } catch (resendError: any) {
      setLocalError(resendError?.message || 'Unable to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    startTimer();
  }, []);

  return (
    <FlowScreen style={styles.container}>
      <View style={styles.backgroundDecor}>
        <View style={styles.decorTop} />
        <View style={styles.decorBottom} />
      </View>

      <View style={styles.contentContainer}>
        <FlowHeader 
          onBack={() => router.back()} 
          eyebrow="VERIFY EMAIL" 
          title="Enter your OTP" 
          subtitle={`We sent a 6-digit code to ${email}.`} 
        />

        <Card style={styles.otpCard}>
          <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpContainer}>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <View key={index} style={[
                styles.otpBox,
                otp.length >= index ? styles.otpBoxFilled : styles.otpBoxEmpty,
                otp.length >= index && styles.otpBoxFocused
              ]}>
                <Text style={styles.otpDigit}>
                  {otp[index - 1] || ''}
                </Text>
              </View>
            ))}
            {/* Invisible full-size input overlaying the boxes: tap anywhere to type */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              autoFocus
              style={styles.hiddenInput}
              accessibilityLabel="One-time password"
            />
          </Pressable>

          {isMockApiEnabled ? (
            <Text style={styles.mockHint}>
              Development OTP: 123456
            </Text>
          ) : null}

          <ErrorMessage message={localError || error} />

          <PrimaryButton 
            label="Verify and continue" 
            onPress={verify} 
            loading={isLoading}
            size="lg"
            variant="primary"
            disabled={otp.length !== 6}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
              <TextButton 
                label={timerActive ? `${timer}s` : 'Resend OTP'} 
                onPress={resend}
                disabled={resending || timerActive}
              />
            </Text>
          </View>
        </Card>

      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.brand.primary + '08',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.brand.secondary + '08',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
    justifyContent: 'center',
  },
  otpCard: {
    padding: Spacing[6],
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[6],
    position: 'relative',
  },
  otpBox: {
    width: 52,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
  },
  otpBoxEmpty: {
    borderColor: Colors.border.light,
    backgroundColor: Colors.surface.secondary,
  },
  otpBoxFilled: {
    borderColor: Colors.brand.primary,
    borderWidth: 3,
    backgroundColor: Colors.brand.primary + '10',
  },
  otpBoxFocused: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  mockHint: {
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: 13,
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  resendContainer: {
    marginTop: Spacing[6],
    alignItems: 'center',
  },
  resendText: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
});

