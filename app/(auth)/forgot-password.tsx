import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { authService, normalizeEmail } from '@/services/auth';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) { setError('Enter your email address.'); return; }
    try {
      setLoading(true); setError(null);
      await authService.requestOtp(normalizedEmail);
      router.push({ pathname: '/reset-password', params: { email: normalizedEmail } });
    } catch (requestError: any) {
      setError(requestError?.message || 'Unable to send reset code.');
    } finally { setLoading(false); }
  };

  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="ACCOUNT RECOVERY" title="Reset your password" subtitle="We will send a verification code to your registered email." />
      <FlowInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <ErrorMessage message={error} />
      <PrimaryButton label="Send reset code" onPress={submit} loading={loading} />
      <View style={flowStyles.footer}><TextButton label="Back to sign in" onPress={() => router.replace('/login')} /></View>
    </FlowScreen>
  );
}
