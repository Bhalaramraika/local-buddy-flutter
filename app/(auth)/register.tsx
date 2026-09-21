import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { authService, normalizePhoneNumber } from '@/services/auth';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!name.trim() || !/^\+91\d{10}$/.test(normalizedPhone)) {
      setLocalError('Name and phone number are required.');
      return;
    }
    try {
      setLoading(true);
      setLocalError(null);
      await authService.requestOtp(normalizedPhone);
      router.push({ pathname: '/otp', params: { phone: normalizedPhone, mode: 'register', name: name.trim(), email: email.trim() } });
    } catch (requestError: any) {
      setLocalError(requestError?.response?.data?.message || requestError?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="CREATE ACCOUNT" title="Join Local Buddy" subtitle="Tell us a little about yourself to get started." />
      <FlowInput label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
      <FlowInput label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98765 43210" />
      <FlowInput label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" autoCapitalize="none" />
      <ErrorMessage message={localError} />
      <PrimaryButton label="Send OTP" onPress={submit} loading={loading} />
      <View style={flowStyles.footer}><TextButton label="Already have an account? Sign in" onPress={() => router.replace('/login')} /></View>
    </FlowScreen>
  );
}
