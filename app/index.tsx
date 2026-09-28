import React from 'react';
import { Redirect } from 'expo-router';
import WelcomeScreen from './(onboarding)/welcome';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profileCompleted = useAuthStore((state) => state.user?.profileCompleted);

  if (isAuthenticated && profileCompleted) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <WelcomeScreen />;
}
