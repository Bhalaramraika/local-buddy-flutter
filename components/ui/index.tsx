/**
 * Soft Premium Component Kit
 * Reusable, animated, consistent components replacing FlowUI pieces.
 * Style rules: soft colors, big curvatures, animations everywhere.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  Animated,
  useColorScheme,
} from 'react-native';
import { useUIStore } from '@/store/uiStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Animation } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

// Small helper: always import Emoticons at correct color without nesting theme logic everywhere
const getTextColor = (isDark: boolean) => (isDark ? Colors.dark.text.primary : Colors.text.primary);
const getMutedColor = (isDark: boolean) => (isDark ? Colors.dark.text.secondary : Colors.text.muted);
const getSurfaceColor = (isDark: boolean) => (isDark ? Colors.dark.surface.secondary : Colors.surface.secondary);
const getSurface3Color = (isDark: boolean) => (isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary);

// ============================================================
// THEME HOOK — system-aware
// uiStore.theme may be 'system'; resolve it against the OS scheme so
// text never renders in a color identical to the surface below it.
// ============================================================

export function useIsDark(): boolean {
  const theme = useUIStore((s) => s.theme);
  const systemScheme = useColorScheme();
  return theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
}

export function useAppColors() {
  const isDark = useIsDark();
  return {
    isDark,
    primary: Colors.brand.primary,
    accent: Colors.brand.accent,
    coral: Colors.brand.coral,
    background: isDark ? Colors.dark.surface.primary : Colors.surface.primary,
    surface: isDark ? Colors.dark.surface.secondary : Colors.surface.secondary,
    surfaceAlt: isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary,
    card: isDark ? Colors.dark.surface.elevated : Colors.surface.elevated,
    text: isDark ? Colors.dark.text.primary : Colors.text.primary,
    textSecondary: isDark ? Colors.dark.text.secondary : Colors.text.secondary,
    textMuted: isDark ? Colors.dark.text.muted : Colors.text.muted,
    textInverse: isDark ? Colors.dark.text.inverse : Colors.text.inverse,
    border: isDark ? Colors.dark.surface.tertiary : Colors.border.light,
    borderStrong: isDark ? '#33335A' : Colors.border.medium,
    semantic: Colors.semantic,
  };
}

export function useSoftTheme() {
  const c = useAppColors();
  return {
    isDark: c.isDark,
    colors: Colors,
    surface: c.isDark ? Colors.dark.surface : Colors.surface,
    text: c.isDark ? Colors.dark.text : Colors.text,
    primary: Colors.brand.primary,
    accent: Colors.brand.accent,
  };
}

// ============================================================
// SOFT BUTTON
// ============================================================

interface SoftButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'secondary';
  tone?: 'brand' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  // used for VeryPrimary (animated glow button)
  withGlow?: boolean;
}

export function SoftButton({
  label,
  onPress,
  variant = 'primary',
  tone = 'brand',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  withGlow = false,
}: SoftButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDark = useIsDark();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      ...Animation.spring,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...Animation.spring,
      useNativeDriver: true,
    }).start();
  };

  const bgColor = (() => {
    if (disabled) return isDark ? Colors.dark.surface.tertiary : Colors.border.light;
    switch (variant) {
      case 'primary':
        return tone === 'accent' ? Colors.brand.accent : Colors.brand.primary;
      case 'accent':
        return Colors.brand.accent;
      case 'secondary':
        return isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return Colors.brand.primary;
    }
  })();

  const textColor = (() => {
    if (disabled) return getMutedColor(isDark);
    switch (variant) {
      case 'primary':
      case 'accent':
        return '#FFFFFF'; // brand/accent fills are saturated — always white text
      case 'outline':
        return tone === 'accent' ? Colors.brand.accent : Colors.brand.primary;
      case 'secondary':
      case 'ghost':
        return getTextColor(isDark);
      default:
        return '#FFFFFF';
    }
  })();

  const height = size === 'lg' ? 56 : size === 'md' ? 52 : 44;
  const fontSize = size === 'lg' ? Typography.fontSize['2xl'] : size === 'md' ? Typography.fontSize.base : Typography.fontSize.sm;

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed: isPressed }) => [
        styles.btn,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: bgColor,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'outline' ? { borderWidth: 1.5, borderColor: tone === 'accent' ? Colors.brand.accent : Colors.brand.primary } : null,
        fullWidth && { alignSelf: 'stretch' },
        withGlow && !disabled ? Shadows.button : {},
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.btnContent}>
            {icon ? <Ionicons name={icon} size={20} color={textColor} style={{ marginRight: 8 }} /> : null}
            <Text style={[styles.btnText, { color: textColor, fontSize }]}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================
// SOFT CARD
// ============================================================

interface SoftCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  padding?: keyof typeof Spacing;
  style?: ViewStyle;
  animated?: boolean;
  delay?: number; // stagger delay in ms
}

export function SoftCard({
  children,
  onPress,
  elevated = true,
  padding = 5,
  style,
  animated = true,
  delay = 0,
}: SoftCardProps) {
  const isDark = useIsDark();
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) {
      anim.setValue(1);
      return;
    }
    const t = setTimeout(() => {
      Animated.spring(anim, {
        toValue: 1,
        ...Animation.gentle,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View style={[!onPress && animated ? { opacity: anim, transform: [{ translateY }] } : {}]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.card,
          isDark && { backgroundColor: Colors.dark.surface.elevated, borderColor: Colors.dark.surface.tertiary },
          elevated && !isDark ? Shadows.card : {},
          {
            padding: Spacing[padding],
            ...(pressed && onPress ? { opacity: 0.95, transform: [{ scale: 0.99 }] } : {}),
          },
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// SOFT INPUT
// ============================================================

interface SoftInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  onIconRightPress?: () => void;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  multiline?: boolean;
}

export function SoftInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  iconLeft,
  iconRight,
  onIconRightPress,
  containerStyle,
  multiline,
}: SoftInputProps) {
  const colors = {
    error: Colors.semantic.error,
    primary: Colors.brand.primary,
    muted: getMutedColor(false),
    bg: Colors.surface.secondary,
    border: Colors.border.light,
    inputBg: Colors.surface.secondary,
    inputBorder: Colors.border.light,
    text: Colors.text.primary,
  };
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label ? <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text> : null}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.inputBg,
          borderColor,
          borderWidth: 1.5,
          borderRadius: BorderRadius.lg,
        },
        error ? { borderColor: colors.error } : {},
      ]}>
        {iconLeft ? (
          <Ionicons name={iconLeft} size={20} color={colors.muted} style={styles.inputIcon} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && { textAlignVertical: 'top', minHeight: 100 }]}
          multiline={multiline}
        />
        {iconRight ? (
          <Pressable onPress={onIconRightPress} style={styles.inputIconRight}>
            <Ionicons name={iconRight} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

// ============================================================
// SOFT BADGE
// ============================================================

interface SoftBadgeProps {
  label: string;
  variant?: 'primary' | 'neutral' | 'success' | 'warning' | 'error';
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  selected?: boolean;
}

export function SoftBadge({
  label,
  variant = 'primary',
  icon,
  onPress,
  selected = false,
}: SoftBadgeProps) {
  const isDark = useIsDark();
  const colors = {
    primary: { bg: Colors.brand.primary + '18', text: isDark ? '#B9B4FF' : Colors.brand.primaryDeep, border: Colors.brand.primary + '40' },
    neutral: { bg: getSurface3Color(isDark), text: getTextColor(isDark), border: isDark ? Colors.dark.surface.tertiary : Colors.border.light },
    success: { bg: Colors.semantic.successSoft, text: isDark ? '#22C55E' : Colors.semantic.success, border: Colors.semantic.success + '40' },
    warning: { bg: Colors.semantic.warningSoft, text: isDark ? '#FBBF24' : Colors.semantic.warning, border: Colors.semantic.warning + '40' },
    error: { bg: Colors.semantic.errorSoft, text: Colors.semantic.error, border: Colors.semantic.error + '40' },
  };
  const color = colors[variant];
  const tint = selected ? (variant === 'primary' ? Colors.brand.primary : color.bg) : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: tint, borderColor: color.border, borderWidth: 1 },
        pressed && onPress ? { opacity: 0.85 } : {},
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? Colors.text.inverse : color.text} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.badgeText, { color: selected ? Colors.text.inverse : color.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================
// SOFT AVATAR
// ============================================================

interface SoftAvatarProps {
  name: string;
  size?: number;
  source?: string;
  online?: boolean;
  accent?: string;
}

export function SoftAvatar({ name, size = 48, source, online, accent }: SoftAvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accent || Colors.brand.primary,
      },
    ]}>
      {source ? null : (
        <Text style={[styles.avatarText, { fontSize: size * 0.38, color: Colors.text.inverse }]}>
          {initials}
        </Text>
      )}
      {online ? (
        <View style={[styles.doneBadge, { borderColor: '#fff', backgroundColor: Colors.semantic.success }]} />
      ) : null}
    </View>
  );
}

// ============================================================
// SKELETON LOADER — subtle shimmer
// ============================================================

export function SoftSkeleton({ width = '100%', height = 20, borderRadius: br = BorderRadius.sm, style }: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}) {
  const isDark = useIsDark();
  return (
    <View style={[
      styles.skeleton,
      { width: width as any, height: height as any, borderRadius: br, backgroundColor: isDark ? Colors.dark.surface.tertiary : Colors.border.light },
      style,
    ]} />
  );
}

export function SoftLineSkeleton({ lines = 3, gap = Spacing[3], style }: {
  lines?: number;
  gap?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.skeletonContainer, { gap }, style]}>
      <SoftSkeleton width="60%" height={14} />
      <SoftSkeleton width="80%" height={14} />
      {lines > 2 ? <SoftSkeleton width="50%" height={14} /> : null}
      {lines > 3 ? <SoftSkeleton width="70%" height={14} /> : null}
    </View>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

export function EmptyStateEnhanced({
  icon = 'file-tray-outline',
  title = 'Empty',
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
  const isDark = useIsDark();
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={52} color={Colors.brand.primary + '40'} />
      </View>
      <Text style={[styles.emptyTitle, isDark && { color: Colors.dark.text.primary }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, isDark && { color: Colors.dark.text.secondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={[styles.btn, styles.emptyBtn, { backgroundColor: Colors.brand.primary }]}>
          <Text style={[styles.btnText, { color: Colors.text.inverse }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ============================================================
// SCREEN WRAPPER (handles dark + top padding)
// ============================================================

export function SoftScreen({
  children,
  style,
  contentContainerStyle,
  scrollable = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
}) {
  const isDark = useIsDark();
  const bg = isDark ? Colors.dark.surface.primary : Colors.surface.primary;

  if (!scrollable) {
    return (
      <View style={[styles.screen, { backgroundColor: bg }, style]}>
        {children}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { backgroundColor: bg }, style]}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// ICON WRAPPER — scale-on-press animation
// ============================================================

export function SoftIcon({
  name,
  size = 24,
  color,
  bgColor,
  onPress,
  style,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color: string;
  bgColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.82, ...Animation.pulse, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, ...Animation.pulse, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={onPress ? () => { press(); onPress!(); } : undefined} style={style} disabled={!onPress}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: bgColor || Colors.surface.tertiary,
            width: size * 2,
            height: size * 2,
            borderRadius: size,
          }
        ]}>
          <Ionicons name={name} size={size} color={color} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    overflow: 'hidden',
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontFamily: Typography.fontFamily.semiBold, fontWeight: '700', includeFontPadding: false },
  card: {
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputContainer: { marginBottom: Spacing[5] },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing[2],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    minHeight: 52,
  },
  inputIcon: { marginRight: Spacing[2] },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: Spacing[3],
  },
  inputIconRight: { padding: Spacing[1] },
  inputError: {
    fontSize: Typography.fontSize.xs,
    color: Colors.semantic.error,
    marginTop: Spacing[1],
    fontFamily: Typography.fontFamily.medium,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
  },
  badgeText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Typography.fontFamily.bold },
  doneBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  skeleton: { marginVertical: Spacing[1] },
  skeletonContainer: { padding: Spacing[5] },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: Spacing[12] },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, marginBottom: Spacing[2] },
  emptyMessage: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing[6] },
  emptyBtn: { marginTop: Spacing[4], paddingHorizontal: Spacing[8] },
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: Spacing[24] },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
});
