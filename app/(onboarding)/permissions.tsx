import React, { useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/app';
import { Colors, Spacing } from '@/constants/design';
import { ErrorMessage, FlowHeader, FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function PermissionsScreen() {
  const router = useRouter();
  const { requestPermission } = useLocation();
  const { updateProfile, isLoading: profileLoading, error: profileError } = useAuth();
  const [role, setRole] = useState<'customer' | 'buddy'>('customer');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const allow = async () => {
    try {
      setLoading(true); setError(null);
      await updateProfile({ role, language });
      try { await requestPermission(); await storage.set(STORAGE_KEYS.locationPermissionGranted, true); } catch { /* Location can be enabled later. */ }
      router.replace('/kyc');
    } catch { setError('Profile setup could not be saved. Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <FlowScreen>
      <FlowHeader onBack={() => router.back()} eyebrow="SET UP YOUR EXPERIENCE" title="Use your location" subtitle="Location helps us show nearby tasks and buddies in your area." />
      <Text style={flowStyles.cardTitle}>How will you use Local Buddy?</Text>
      <View style={{ flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[5] }}>
        {(['customer', 'buddy'] as const).map((option) => <Pressable key={option} onPress={() => setRole(option)} style={[flowStyles.card, { flex: 1, borderColor: role === option ? Colors.brand.primary : Colors.border.light, borderWidth: 1 }]}><Text style={flowStyles.cardTitle}>{option === 'buddy' ? 'Help others' : 'Get help'}</Text><Text style={flowStyles.cardText}>{option === 'buddy' ? 'Earn by completing tasks.' : 'Post tasks in your area.'}</Text></Pressable>)}
      </View>
      <Text style={flowStyles.cardTitle}>Preferred language</Text>
      <View style={{ flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[5] }}>
        {(['en', 'hi'] as const).map((option) => <Pressable key={option} onPress={() => setLanguage(option)} style={[flowStyles.card, { flex: 1, borderColor: language === option ? Colors.brand.primary : Colors.border.light, borderWidth: 1 }]}><Text style={flowStyles.cardTitle}>{option === 'hi' ? 'हिंदी' : 'English'}</Text></Pressable>)}
      </View>
      <View style={flowStyles.card}><Ionicons name="location-outline" size={30} color={Colors.brand.primary} /><Text style={[flowStyles.cardTitle, { marginTop: Spacing[3] }]}>Use your location</Text><Text style={flowStyles.cardText}>Location helps us show nearby tasks and buddies. You can skip this and enable it later.</Text></View>
      <ErrorMessage message={error || profileError} />
      <PrimaryButton label="Continue" onPress={allow} loading={loading || profileLoading} />
      <TextButton label="Skip location" onPress={async () => { await updateProfile({ role, language }); router.replace('/kyc'); }} />
    </FlowScreen>
  );
}
