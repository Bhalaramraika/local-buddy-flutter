import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authService, normalizePhoneNumber } from '@/services/auth';
import { isMockApiEnabled } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; mode?: string; name?: string; email?: string }>();
  const { login, updateProfile, isLoading, error } = useAuth();
  const phone = normalizePhoneNumber(String(params.phone || ''));
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!phone) router.replace('/login');
  }, [phone, router]);

  const verify = async () => {
    if (!/^\d{4,6}$/.test(otp)) {
      setLocalError('Enter the OTP sent to your phone.');
      return;
    }
    try {
      setLocalError(null);
      await login(phone, otp);
      if (params.mode === 'register') {
        await updateProfile({
          name: String(params.name || '').trim() || undefined,
          email: String(params.email || '').trim() || undefined,
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
      await authService.requestOtp(phone);
      setLocalError('A new OTP was sent.');
    } catch (resendError: any) {
      setLocalError(resendError?.message || 'Unable to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="VERIFY PHONE" title="Enter your OTP" subtitle={`We sent a verification code to ${phone || 'your phone'}.`} />
      <FlowInput label="One-time password" value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="123456" maxLength={6} autoComplete="one-time-code" />
      {isMockApiEnabled ? <Text style={{ color: '#B45309', fontSize: 13, marginBottom: 16 }}>Backend is not connected. Development OTP: 123456</Text> : null}
      <ErrorMessage message={localError || error} />
      <PrimaryButton label="Verify and continue" onPress={verify} loading={isLoading} />
      <View style={flowStyles.footer}><TextButton label={resending ? 'Sending...' : 'Resend OTP'} onPress={resend} /></View>
    </FlowScreen>
  );
}
