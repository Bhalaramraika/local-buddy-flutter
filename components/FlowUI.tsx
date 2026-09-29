import React, { useState } from 'react';
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
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/design';

export function FlowScreen({ children, style, contentContainerStyle }: { children: React.ReactNode; style?: any; contentContainerStyle?: any }) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={[styles.screen, style]} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
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
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function FlowInput({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={Colors.text.muted}
        style={[styles.input, error && styles.inputError]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  size = 'lg',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [pressed, setPressed] = useState(false);
  
  const baseStyle = [
    styles.buttonBase,
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    fullWidth && styles.fullWidth,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={({ pressed: pressedProp }) => [
        ...baseStyle,
        (pressedProp || disabled || loading) && styles.buttonMuted,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.brand.primary : Colors.text.inverse} size="small" />
      ) : (
        <Text style={[
          styles.buttonText,
          styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
          styles[`buttonText${size.charAt(0).toUpperCase() + size.slice(1)}`],
        ]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
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
  return <PrimaryButton label={label} onPress={onPress} loading={loading} disabled={disabled} variant="secondary" />;
}

export function OutlineButton({
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
  return <PrimaryButton label={label} onPress={onPress} loading={loading} disabled={disabled} variant="outline" />;
}

export function TextButton({ label, onPress, style }: { label: string; onPress: () => void; style?: any }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.textButton, style]}>
      <Text style={styles.textButtonLabel}>{label}</Text>
    </Pressable>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  const Component = onPress ? Pressable : View;
  return (
    <Component
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.card, styles.cardElevated, style]}
    >
      {children}
    </Component>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  // Base layout
  flex: { flex: 1 },
  screen: {
    flexGrow: 1,
    padding: Spacing[6],
    backgroundColor: Colors.surface.primary,
  },
  header: { marginBottom: Spacing[6] },
  back: { alignSelf: 'flex-start', padding: Spacing[2], marginBottom: Spacing[4], marginLeft: -Spacing[2] },
  eyebrow: { color: Colors.brand.primary, fontSize: 13, fontWeight: '700', marginBottom: Spacing[2], letterSpacing: 1 },
  title: { color: Colors.text.primary, fontSize: 32, fontWeight: '700', lineHeight: 40 },
  subtitle: { color: Colors.text.secondary, fontSize: 16, lineHeight: 24, marginTop: Spacing[2] },
  
  // Form fields
  field: { marginBottom: Spacing[5] },
  label: { color: Colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: Spacing[2] },
  input: {
    backgroundColor: Colors.surface.secondary,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    color: Colors.text.primary,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  inputError: {
    borderColor: Colors.semantic.error,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
    marginTop: Spacing[1],
    fontWeight: '500',
  },
  error: { color: Colors.semantic.error, fontSize: 13, lineHeight: 19, marginBottom: Spacing[4] },
  footer: { marginTop: 'auto', paddingTop: Spacing[6] },
  
  // Cards
  card: { 
    backgroundColor: Colors.surface.secondary, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing[6], 
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardElevated: {
    ...Shadows.card,
  },
  cardTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: Spacing[2] },
  cardText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 21 },
  iconCircle: { 
    alignItems: 'center', 
    backgroundColor: Colors.brand.primary + '15', 
    borderRadius: 48, 
    height: 96, 
    justifyContent: 'center', 
    marginBottom: Spacing[6], 
    width: 96 
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing[4],
  },
  
  // Button styles
  flex: { flex: 1 },
  buttonBase: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  buttonSm: {
    minHeight: 44,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  buttonMd: {
    minHeight: 52,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
  },
  buttonLg: {
    minHeight: 56,
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[4],
  },
  buttonPrimary: {
    backgroundColor: Colors.brand.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.brand.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },
  buttonMuted: { opacity: 0.6 },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextPrimary: { color: Colors.text.inverse },
  buttonTextSecondary: { color: Colors.text.inverse },
  buttonTextOutline: { color: Colors.brand.primary },
  buttonTextSm: { fontSize: 14 },
  buttonTextMd: { fontSize: 16 },
  buttonTextLg: { fontSize: 18 },
  fullWidth: { width: '100%' },
  
  // Button variants
  buttonPrimary: { backgroundColor: Colors.brand.primary },
  buttonSecondary: { backgroundColor: Colors.brand.secondary },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.brand.primary },
  buttonMuted: { opacity: 0.6 },
  
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonTextPrimary: { color: Colors.text.inverse },
  buttonTextSecondary: { color: Colors.text.inverse },
  buttonTextOutline: { color: Colors.brand.primary },
  buttonTextSm: { fontSize: 14 },
  buttonTextMd: { fontSize: 16 },
  buttonTextLg: { fontSize: 18 },
  fullWidth: { width: '100%' },
  
  // Button sizes
  buttonSm: { minHeight: 44, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  buttonMd: { minHeight: 52, paddingHorizontal: Spacing[6], paddingVertical: Spacing[3] },
  buttonLg: { minHeight: 56, paddingHorizontal: Spacing[8], paddingVertical: Spacing[4] },
  
  // Button variants
  buttonPrimary: { backgroundColor: Colors.brand.primary },
  buttonSecondary: { backgroundColor: Colors.brand.secondary },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.brand.primary },
  buttonMuted: { opacity: 0.6 },
  
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonTextPrimary: { color: Colors.text.inverse },
  buttonTextSecondary: { color: Colors.text.inverse },
  buttonTextOutline: { color: Colors.brand.primary },
  buttonTextSm: { fontSize: 14 },
  buttonTextMd: { fontSize: 16 },
  buttonTextLg: { fontSize: 18 },
  fullWidth: { width: '100%' },
  
  // Legacy styles (backward compatibility)
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: Spacing[6],
  },
  buttonMuted: { opacity: 0.6 },
  primaryText: { color: Colors.text.inverse, fontSize: 18, fontWeight: '700' },
  textButton: { alignSelf: 'center', padding: Spacing[3] },
  textButtonLabel: { color: Colors.brand.primary, fontSize: 14, fontWeight: '600' },
  error: { color: Colors.semantic.error, fontSize: 13, lineHeight: 19, marginBottom: Spacing[4] },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
    marginTop: Spacing[1],
    fontWeight: '500',
  },
  footer: { marginTop: 'auto', paddingTop: Spacing[6] },
  card: { 
    backgroundColor: Colors.surface.secondary, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing[6], 
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardElevated: {
    ...Shadows.card,
  },
  cardTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: Spacing[2] },
  cardText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 21 },
  iconCircle: { 
    alignItems: 'center', 
    backgroundColor: Colors.brand.primary + '15', 
    borderRadius: 48, 
    height: 96, 
    justifyContent: 'center', 
    marginBottom: Spacing[6], 
    width: 96 
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing[4],
  },
  flex: { flex: 1 },
  screen: {
    flexGrow: 1,
    padding: Spacing[6],
    backgroundColor: Colors.surface.primary,
  },
  header: { marginBottom: Spacing[8] },
  back: { alignSelf: 'flex-start', padding: Spacing[2], marginBottom: Spacing[4], marginLeft: -Spacing[2] },
  eyebrow: { color: Colors.brand.primary, fontSize: 13, fontWeight: '700', marginBottom: Spacing[2], letterSpacing: 1 },
  title: { color: Colors.text.primary, fontSize: 32, fontWeight: '700', lineHeight: 40 },
  subtitle: { color: Colors.text.secondary, fontSize: 16, lineHeight: 24, marginTop: Spacing[2] },
  field: { marginBottom: Spacing[5] },
  label: { color: Colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: Spacing[2] },
  input: {
    backgroundColor: Colors.surface.secondary,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    color: Colors.text.primary,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  inputError: {
    borderColor: Colors.semantic.error,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
    marginTop: Spacing[1],
    fontWeight: '500',
  },
  error: { color: Colors.semantic.error, fontSize: 13, lineHeight: 19, marginBottom: Spacing[4] },
  footer: { marginTop: 'auto', paddingTop: Spacing[6] },
  card: { 
    backgroundColor: Colors.surface.secondary, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing[6], 
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardElevated: {
    ...Shadows.card,
  },
  cardTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: Spacing[2] },
  cardText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 21 },
  iconCircle: { 
    alignItems: 'center', 
    backgroundColor: Colors.brand.primary + '15', 
    borderRadius: 48, 
    height: 96, 
    justifyContent: 'center', 
    marginBottom: Spacing[6], 
    width: 96 
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing[4],
  },
});

export const flowStyles = styles;