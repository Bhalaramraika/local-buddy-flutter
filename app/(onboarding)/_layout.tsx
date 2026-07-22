/**
 * Onboarding Route Group Layout
 * Stack navigator for onboarding flow
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: styles.card,
      }}
    >
      <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
      <Stack.Screen name="permissions" options={{ title: 'Permissions' }} />
      <Stack.Screen name="kyc" options={{ title: 'KYC Verification' }} />
      <Stack.Screen name="profile-setup" options={{ title: 'Complete Profile' }} />
      <Stack.Screen name="referral" options={{ title: 'Referral Code' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
  },
});