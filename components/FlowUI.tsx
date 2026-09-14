import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/design';

export function FlowScreen({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FlowHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </Pressable>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function FlowInput({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={Colors.text.muted}
        style={styles.input}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, (pressed || disabled) && styles.buttonMuted]}
    >
      {loading ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}>
      <Text style={styles.textButtonLabel}>{label}</Text>
    </Pressable>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flexGrow: 1,
    padding: Spacing[6],
    backgroundColor: Colors.surface.primary,
  },
  header: { marginBottom: Spacing[6] },
  back: { alignSelf: 'flex-start', padding: Spacing[2], marginBottom: Spacing[4], marginLeft: -Spacing[2] },
  eyebrow: { color: Colors.brand.primary, fontSize: 13, fontWeight: '700', marginBottom: Spacing[2], letterSpacing: 1 },
  title: { color: Colors.text.primary, fontSize: 30, fontWeight: '700', lineHeight: 38 },
  subtitle: { color: Colors.text.secondary, fontSize: 15, lineHeight: 23, marginTop: Spacing[2] },
  field: { marginBottom: Spacing[4] },
  label: { color: Colors.text.primary, fontSize: 13, fontWeight: '600', marginBottom: Spacing[2] },
  input: {
    backgroundColor: Colors.surface.secondary,
    borderColor: Colors.border.light,
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.text.primary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing[4],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing[5],
  },
  buttonMuted: { opacity: 0.55 },
  primaryText: { color: Colors.text.inverse, fontSize: 16, fontWeight: '700' },
  textButton: { alignSelf: 'center', padding: Spacing[3] },
  textButtonLabel: { color: Colors.brand.primary, fontSize: 14, fontWeight: '600' },
  error: { color: Colors.semantic.error, fontSize: 13, lineHeight: 19, marginBottom: Spacing[4] },
  footer: { marginTop: 'auto', paddingTop: Spacing[6] },
  card: { backgroundColor: Colors.surface.secondary, borderRadius: 12, padding: Spacing[5], marginBottom: Spacing[4] },
  cardTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: '700', marginBottom: Spacing[2] },
  cardText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 21 },
  iconCircle: { alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 32, height: 64, justifyContent: 'center', marginBottom: Spacing[5], width: 64 },
});

export const flowStyles = styles;
