/**
 * Task Filters Screen - Placeholder
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { FlowHeader, FlowScreen, PrimaryButton } from '@/components/FlowUI';

export default function TaskFiltersScreen() {
  const router = useRouter();

  return (
    <FlowScreen>
      <FlowHeader
        title="Task filters"
        subtitle="Advanced task filtering is coming soon."
        onBack={() => router.back()}
      />
      <PrimaryButton label="Go back" onPress={() => router.back()} />
    </FlowScreen>
  );
}
