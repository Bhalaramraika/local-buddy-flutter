/**
 * Onboarding Route Group Layout
 * Stack navigator for onboarding flow: welcome → setup wizard
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
      <Stack.Screen name="setup" options={{ title: 'Set up your profile' }} />
    </Stack>
  );
}
