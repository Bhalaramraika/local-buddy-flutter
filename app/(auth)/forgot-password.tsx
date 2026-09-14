import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/services/auth';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    try {
      setLoading(true); setError(null);
      await authService.requestOtp(phone.replace(/\s/g, ''));
      router.push({ pathname: '/reset-password', params: { phone: phone.replace(/\s/g, '') } });
    } catch (requestError: any) {
      setError(requestError?.message || 'Unable to send reset code.');
    } finally { setLoading(false); }
  };

  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="ACCOUNT RECOVERY" title="Reset your password" subtitle="We will send a verification code to your registered phone." />
      <FlowInput label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98765 43210" />
      <ErrorMessage message={error} />
      <PrimaryButton label="Send reset code" onPress={submit} loading={loading} />
      <View style={flowStyles.footer}><TextButton label="Back to sign in" onPress={() => router.replace('/login')} /></View>
    </FlowScreen>
  );
}
