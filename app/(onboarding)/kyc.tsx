import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorMessage, FlowHeader, FlowInput, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function KycOnboardingScreen() {
  const router = useRouter();
  const { updateProfile, isLoading, error } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const saveAge = async () => {
    const birth = new Date(dateOfBirth);
    const age = new Date().getFullYear() - birth.getFullYear() - (new Date() < new Date(new Date().getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (Number.isNaN(birth.getTime()) || age < 14) { setLocalError('Enter a valid date. You must be at least 14 years old.'); return; }
    try { setLocalError(null); await updateProfile({ dateOfBirth }); router.replace('/profile-setup'); } catch { /* Context exposes the server error. */ }
  };
  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="TRUST & SAFETY" title="Verify when you are ready" subtitle="Verified profiles help the community feel safer and build trust faster." />
      <View style={flowStyles.card}><Ionicons name="shield-checkmark-outline" size={30} color={Colors.semantic.success} /><Text style={[flowStyles.cardTitle, { marginTop: Spacing[3] }]}>Age and identity</Text><Text style={flowStyles.cardText}>We use your date of birth to keep the community safe. Identity documents can be submitted after setup.</Text></View>
      <FlowInput label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
      <ErrorMessage message={localError || error} />
      <PrimaryButton label="Continue to profile" onPress={saveAge} loading={isLoading} />
      <TextButton label="Open KYC documents later" onPress={() => router.push('/kyc-documents')} />
    </FlowScreen>
  );
}
