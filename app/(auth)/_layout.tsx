/**
 * Auth Route Group Layout
 * Stack navigator for authentication screens
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="otp" options={{ title: 'Verify OTP' }} />
    </Stack>
  );
}