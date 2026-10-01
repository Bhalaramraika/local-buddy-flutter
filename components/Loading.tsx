import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/design';

export function LoadingState({ message = 'Loading...', style }: { message?: string; style?: any }) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={Colors.brand.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={Colors.text.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  retryLabel = 'Retry',
}: {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: Colors.semantic.error + '12' }]}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.semantic.error} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.action}>
          <Text style={styles.actionText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[12],
    paddingHorizontal: Spacing[6],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing[2],
  },
  message: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  action: {
    marginTop: Spacing[5],
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
  },
  actionText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
});
