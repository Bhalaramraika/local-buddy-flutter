import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading, error } = useAuth();
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState(user?.area || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const submit = async () => {
    if (!city.trim()) { setLocalError('Tell us which city you are in.'); return; }
    try { setLocalError(null); await updateProfile({ city: city.trim(), area: area.trim() || undefined }); router.replace('/onboarding-referral'); }
    catch { /* AuthContext exposes the server error. */ }
  };
  return (
    <FlowScreen>
      <FlowHeader eyebrow="YOUR PROFILE" title="Make it local" subtitle="This helps us personalize tasks and buddies near you." />
      <FlowInput label="City" value={city} onChangeText={setCity} placeholder="For example, Balotra" autoCapitalize="words" />
      <FlowInput label="Area or neighborhood (optional)" value={area} onChangeText={setArea} placeholder="Your area" autoCapitalize="words" />
      <ErrorMessage message={localError || error} />
      <PrimaryButton label="Save and continue" onPress={submit} loading={isLoading} />
      <View style={flowStyles.footer}><TextButton label="Skip for now" onPress={() => router.replace('/onboarding-referral')} /></View>
    </FlowScreen>
  );
}
