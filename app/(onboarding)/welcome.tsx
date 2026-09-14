import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/design';
import { FlowScreen, PrimaryButton, TextButton, flowStyles } from '@/components/FlowUI';

export default function WelcomeScreen() {
  const router = useRouter();
  const continueToAuth = () => {
    router.replace('/login');
  };
  return (
    <FlowScreen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={flowStyles.iconCircle}><Ionicons name="people" size={32} color={Colors.brand.primary} /></View>
        <Text style={flowStyles.eyebrow}>LOCAL BUDDY</Text>
        <Text style={flowStyles.title}>Small help, close to home.</Text>
        <Text style={flowStyles.subtitle}>Find trusted local help for everyday tasks, or earn by helping people around you.</Text>
        <View style={[flowStyles.card, { marginTop: Spacing[6] }]}>
          <Text style={flowStyles.cardTitle}>One local network</Text>
          <Text style={flowStyles.cardText}>Post a task, discover nearby buddies, and keep everything in one simple place.</Text>
        </View>
        <PrimaryButton label="Get started" onPress={continueToAuth} />
        <TextButton label="I already have an account" onPress={continueToAuth} />
      </View>
    </FlowScreen>
  );
}
