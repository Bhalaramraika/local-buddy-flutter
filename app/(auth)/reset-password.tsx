import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const submit = async () => {
    if (!/^\d{6}$/.test(otp) || !params.phone) {
      setError('Enter the six-digit OTP sent to your phone.');
      return;
    }
    try {
      setError(null);
      await login(String(params.phone), otp);
      router.replace('/home');
    } catch (resetError: any) {
      setError(resetError?.message || 'The verification code is invalid.');
    }
  };

  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="ACCOUNT RECOVERY" title="Choose a new password" subtitle={`For ${String(params.phone || 'your phone')}`} />
      <FlowInput label="Verification code" value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="123456" maxLength={6} />
      <ErrorMessage message={error} />
      <PrimaryButton label="Verify and sign in" onPress={submit} loading={isLoading} />
      <View style={flowStyles.footer}><TextButton label="Use OTP sign in instead" onPress={() => router.replace('/login')} /></View>
    </FlowScreen>
  );
}
