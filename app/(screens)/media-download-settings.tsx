/**
 * Media Download Settings Screen - Placeholder
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { FlowHeader, FlowScreen, PrimaryButton } from '@/components/FlowUI';

export default function MediaDownloadSettingsScreen() {
  const router = useRouter();

  return (
    <FlowScreen>
      <FlowHeader
        title="Media download settings"
        subtitle="Automatic media download preferences are coming soon."
        onBack={() => router.back()}
      />
      <PrimaryButton label="Go back" onPress={() => router.back()} />
    </FlowScreen>
  );
}
