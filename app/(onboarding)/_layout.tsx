/**
 * Onboarding Route Group Layout
 * Stack navigator for onboarding flow
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
      <Stack.Screen name="permissions" options={{ title: 'Permissions' }} />
      <Stack.Screen name="kyc" options={{ title: 'KYC Verification' }} />
      <Stack.Screen name="profile-setup" options={{ title: 'Complete Profile' }} />
      <Stack.Screen name="onboarding-referral" options={{ title: 'Referral Code' }} />
    </Stack>
  );
}