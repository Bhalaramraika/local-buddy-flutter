import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/services/storage';
import { useAuth } from '@/contexts/AuthContext';
import { STORAGE_KEYS } from '@/constants/app';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function ReferralScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const { updateProfile, isLoading, error } = useAuth();

  const finish = async () => {
    try {
      await updateProfile({ referralCode: code.trim() || undefined, profileCompleted: true });
      await storage.set(STORAGE_KEYS.onboardingComplete, true);
      router.replace('/home');
    } catch {
      // AuthContext exposes the server error.
    }
  };

  return (
    <FlowScreen>
      <FlowHeader eyebrow="ALMOST THERE" title="Have a referral code?" subtitle="Add it now to unlock any rewards linked to your invitation." />
      <FlowInput label="Referral code (optional)" value={code} onChangeText={setCode} placeholder="Enter code" autoCapitalize="characters" />
      <ErrorMessage message={error} />
      <PrimaryButton label="Finish setup" onPress={finish} loading={isLoading} />
      <View style={flowStyles.footer}><TextButton label="Skip this step" onPress={finish} /></View>
    </FlowScreen>
  );
}