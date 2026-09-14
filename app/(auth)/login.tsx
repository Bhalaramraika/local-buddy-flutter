import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { authService, normalizePhoneNumber } from '@/services/auth';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async () => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^\+91\d{10}$/.test(normalizedPhone)) {
      setError('Enter a valid phone number.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.requestOtp(normalizedPhone);
      router.push({ pathname: '/otp', params: { phone: normalizedPhone, mode: 'login' } });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlowScreen>
      <FlowHeader eyebrow="LOCAL BUDDY" title="Welcome back" subtitle="Sign in with your phone number to continue." />
      <FlowInput label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98765 43210" autoComplete="tel" />
      <ErrorMessage message={error} />
      <PrimaryButton label="Continue with OTP" onPress={requestOtp} loading={loading} />
      <View style={flowStyles.footer}>
        <TextButton label="Create a new account" onPress={() => router.push('/register')} />
        <TextButton label="Forgot password?" onPress={() => router.push('/forgot-password')} />
        <TextButton label="Back to welcome" onPress={() => router.replace('/welcome')} />
      </View>
    </FlowScreen>
  );
}
