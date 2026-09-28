/**
 * Wallet Settings Screen - Placeholder
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { FlowHeader, FlowScreen, PrimaryButton } from '@/components/FlowUI';

export default function WalletSettingsScreen() {
  const router = useRouter();

  return (
    <FlowScreen>
      <FlowHeader
        title="Wallet settings"
        subtitle="Wallet preferences are coming soon."
        onBack={() => router.back()}
      />
      <PrimaryButton label="Go back" onPress={() => router.back()} />
    </FlowScreen>
  );
}
