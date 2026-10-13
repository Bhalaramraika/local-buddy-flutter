/**
 * UI Kit — "Soft Modern" (Warm & Professional)
 * Every component rebuilt for the onboarding-style theme:
 * antique-white background (#FAEBD7), dark cocoa (#1E1209) primary,
 * orange (#F77051) CTA, soft red (negative), success green (#10B981).
 * Extra-rounded corners, soft shadows, Moti entrance animations.
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
  Animated,
  useColorScheme,
} from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '@/store/uiStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Animation } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

// ============================================================
// THEME HOOK — system-aware
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
    primary: Colors.brand.primary,          // dark cocoa
    accent: Colors.brand.accent,            // orange
    coral: Colors.brand.accent,
    background: isDark ? Colors.dark.surface.primary : Colors.surface.primary,
    surface: isDark ? Colors.dark.surface.secondary : Colors.surface.secondary,
    surfaceAlt: isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary,
    cream: isDark ? Colors.dark.surface.tertiary : Colors.surface.creamSoft,
    card: isDark ? Colors.dark.surface.elevated : Colors.surface.elevated,
    text: isDark ? Colors.dark.text.primary : Colors.text.primary,
    textSecondary: isDark ? Colors.dark.text.secondary : Colors.text.secondary,
    textMuted: isDark ? Colors.dark.text.muted : Colors.text.muted,
    textInverse: isDark ? Colors.dark.text.inverse : Colors.text.inverse,
    border: isDark ? Colors.dark.surface.tertiary : Colors.border.light,
    borderStrong: isDark ? '#4A3421' : Colors.border.medium,
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
// BUTTON — filled, soft-rounded, soft-shadowed
// primary = dark cocoa, accent = orange CTA, success = green, danger = soft red
// ============================================================

export type SoftButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'secondary' | 'success' | 'danger';

interface SoftButtonProps {
  label: string;
  onPress: () => void;
  variant?: SoftButtonVariant;
  tone?: 'brand' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  withGlow?: boolean;
}

export function SoftButton({
  label,
  onPress,
  variant = 'primary',
  tone = 'accent',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  withGlow = false,
}: SoftButtonProps) {
  const isDark = useIsDark();
  const scaleAnim = React.useState(() => new Animated.Value(1))[0];

  const pressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, ...Animation.spring, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, ...Animation.spring, useNativeDriver: true }).start();
  };

  const accentColor = tone === 'accent' ? Colors.brand.accent : Colors.brand.primary;

  const bgColor = (() => {
    if (disabled) return isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary;
    switch (variant) {
      case 'primary': return Colors.brand.primary;
      case 'accent': return Colors.brand.accent;
      case 'success': return Colors.semantic.success;
      case 'danger': return Colors.semantic.error;
      case 'secondary': return isDark ? Colors.dark.surface.tertiary : Colors.surface.creamSoft;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return Colors.brand.primary;
    }
  })();

  const textColor = (() => {
    if (disabled) return isDark ? Colors.dark.text.muted : Colors.text.muted;
    switch (variant) {
      case 'primary':
      case 'accent':
      case 'success':
      case 'danger':
        return '#FFFFFF';
      case 'outline': return accentColor;
      case 'secondary': return isDark ? Colors.dark.text.primary : Colors.text.primary;
      case 'ghost': return accentColor;
      default: return '#FFFFFF';
    }
  })();

  const height = size === 'lg' ? 60 : size === 'md' ? 54 : 46;
  const fontSize = size === 'lg' ? 17 : size === 'md' ? 15 : 13;

  const glow =
    withGlow && !disabled
      ? variant === 'accent' || (variant === 'primary' && tone === 'accent')
        ? Shadows.buttonOrange
        : variant === 'success'
          ? { shadowColor: Colors.semantic.success, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 22, elevation: 7 }
          : Shadows.button
      : {};

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        { opacity: disabled ? 0.55 : 1 },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: bgColor,
            // Buttons always carry a background fill + soft shadow (Soft Modern)
            ...(variant === 'ghost' ? {} : variant === 'outline' ? {} : Shadows.button),
          },
          variant === 'outline' ? { borderWidth: 1.5, borderColor: accentColor } : null,
          glow,
        ]}
      >
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
// CARD — white on cream, extra rounded, soft shadow, Moti entrance
// ============================================================

interface SoftCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  padding?: keyof typeof Spacing;
  style?: ViewStyle;
  animated?: boolean;
  delay?: number;
  radius?: keyof typeof BorderRadius;
}

export function SoftCard({
  children,
  onPress,
  elevated = true,
  padding = 5,
  style,
  animated = true,
  delay = 0,
  radius = 'xl',
}: SoftCardProps) {
  const isDark = useIsDark();

  const body = (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: BorderRadius[radius],
          padding: Spacing[padding],
          backgroundColor: isDark ? Colors.dark.surface.elevated : Colors.surface.elevated,
          borderColor: isDark ? Colors.dark.surface.tertiary : Colors.border.light,
        },
        elevated ? (pressed && onPress ? Shadows.cardPressed : Shadows.card) : {},
        pressed && onPress ? { transform: [{ scale: 0.985 }] } : {},
        style,
      ]}
    >
      {children}
    </Pressable>
  );

  if (!animated) return body;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay }}
    >
      {body}
    </MotiView>
  );
}

// ============================================================
// INPUT — soft curved cream field, orange focus ring
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
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
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
  inputStyle,
  containerStyle,
  multiline,
  maxLength,
  editable = true,
}: SoftInputProps) {
  const isDark = useIsDark();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.semantic.error
    : focused
      ? Colors.brand.accent
      : isDark
        ? Colors.dark.surface.tertiary
        : Colors.border.light;

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label ? (
        <Text style={[styles.inputLabel, { color: isDark ? Colors.dark.text.primary : Colors.text.primary }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? Colors.dark.surface.secondary : Colors.surface.secondary,
            borderColor,
          },
          focused ? Shadows.cardPressed : {},
          error ? { borderColor: Colors.semantic.error } : {},
        ]}
      >
        {iconLeft ? (
          <View style={styles.inputIconWrap}>
            <Ionicons name={iconLeft} size={19} color={focused ? Colors.brand.accent : Colors.text.muted} />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          maxLength={maxLength}
          style={[
            styles.input,
            { color: isDark ? Colors.dark.text.primary : Colors.text.primary },
            multiline && { textAlignVertical: 'top', minHeight: 110 },
            inputStyle,
          ]}
          multiline={multiline}
        />
        {iconRight ? (
          <Pressable onPress={onIconRightPress} style={styles.inputIconRight} disabled={!onIconRightPress}>
            <Ionicons name={iconRight} size={19} color={Colors.text.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

// ============================================================
// CHOICE CARD — rounded option card for every pick/choice row
// ============================================================

interface ChoiceCardProps {
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  delay?: number;
}

export function ChoiceCard({
  label,
  description,
  icon,
  emoji,
  selected = false,
  onPress,
  style,
  delay = 0,
}: ChoiceCardProps) {
  const isDark = useIsDark();
  const scale = React.useState(() => new Animated.Value(1))[0];

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, ...Animation.snappy, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, ...Animation.snappy, useNativeDriver: true }).start();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
      style={style}
    >
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={!onPress}>
        <Animated.View
          style={[
            styles.choice,
            {
              backgroundColor: selected
                ? Colors.brand.accent
                : isDark
                  ? Colors.dark.surface.elevated
                  : Colors.surface.elevated,
              borderColor: selected ? Colors.brand.accent : isDark ? Colors.dark.surface.tertiary : Colors.border.light,
              transform: [{ scale }],
            },
            selected ? Shadows.buttonOrange : Shadows.card,
          ]}
        >
          {icon ? (
            <View
              style={[
                styles.choiceIcon,
                {
                  backgroundColor: selected
                    ? 'rgba(255,255,255,0.22)'
                    : Colors.brand.accentSoft,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={22}
                color={selected ? '#FFFFFF' : Colors.brand.accent}
              />
            </View>
          ) : emoji ? (
            <Text style={styles.choiceEmoji}>{emoji}</Text>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.choiceLabel,
                { color: selected ? '#FFFFFF' : isDark ? Colors.dark.text.primary : Colors.text.primary },
              ]}
            >
              {label}
            </Text>
            {description ? (
              <Text
                style={[
                  styles.choiceDesc,
                  { color: selected ? 'rgba(255,255,255,0.85)' : Colors.text.secondary },
                ]}
              >
                {description}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name={selected ? 'checkmark-circle' : 'chevron-forward'}
            size={20}
            color={selected ? '#FFFFFF' : Colors.text.muted}
          />
        </Animated.View>
      </Pressable>
    </MotiView>
  );
}

// ============================================================
// SCREEN HEADER — Playfair headline + Inter subtitle + back button
// ============================================================

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, onBack, right, style }: ScreenHeaderProps) {
  const isDark = useIsDark();
  // Edge-to-edge Android draws under the system status bar — every screen
  // renders its own header (native header is disabled), so the safe-area
  // top padding lives HERE in the shared header.
  const insets = useSafeAreaInsets();
  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350 }}
      style={[styles.header, { paddingTop: insets.top + Spacing[2] }, style]}
    >
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: isDark ? Colors.dark.surface.elevated : Colors.surface.elevated }]} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color={isDark ? Colors.dark.text.primary : Colors.text.primary} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: isDark ? Colors.dark.text.primary : Colors.text.primary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.headerSubtitle, { color: Colors.text.secondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </MotiView>
  );
}

// ============================================================
// BADGE / CHIP
// ============================================================

interface SoftBadgeProps {
  label: string;
  variant?: 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'accent';
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
  const palette = {
    primary: { bg: '#1E120914', text: Colors.brand.primary, border: '#1E120922' },
    accent: { bg: Colors.brand.accentSoft, text: Colors.brand.accentPressed, border: Colors.brand.accent + '55' },
    neutral: { bg: isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary, text: isDark ? Colors.dark.text.primary : Colors.text.primary, border: isDark ? Colors.dark.surface.tertiary : Colors.border.light },
    success: { bg: Colors.semantic.successSoft, text: Colors.semantic.success, border: Colors.semantic.success + '55' },
    warning: { bg: Colors.semantic.warningSoft, text: Colors.semantic.warning, border: Colors.semantic.warning + '55' },
    error: { bg: Colors.semantic.errorSoft, text: Colors.semantic.error, border: Colors.semantic.error + '55' },
  };
  const color = palette[variant];
  const tint = selected ? (variant === 'accent' ? Colors.brand.accent : Colors.brand.primary) : color.bg;
  const labelColor = selected ? '#FFFFFF' : color.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: tint, borderColor: selected ? tint : color.border, borderWidth: 1 },
        pressed && onPress ? { opacity: 0.85 } : {},
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={labelColor} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.badgeText, { color: labelColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================
// AVATAR
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
// SKELETON LOADER — warm shimmer
// ============================================================

export function SoftSkeleton({ width = '100%', height = 20, borderRadius: br = BorderRadius.sm, style }: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}) {
  const isDark = useIsDark();
  return (
    <MotiView
      from={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true } as any}
      style={[
        styles.skeleton,
        { width: width as any, height: height as any, borderRadius: br, backgroundColor: isDark ? Colors.dark.surface.tertiary : Colors.surface.tertiary },
        style,
      ]}
    />
  );
}

export function SoftLineSkeleton({ lines = 3, gap = Spacing[3], style }: {
  lines?: number;
  gap?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.skeletonContainer, { gap }, style]}>
      <SoftSkeleton width="60%" height={16} borderRadius={8} />
      <SoftSkeleton width="100%" height={64} borderRadius={BorderRadius.lg} />
      {lines > 2 ? <SoftSkeleton width="100%" height={64} borderRadius={BorderRadius.lg} /> : null}
      {lines > 3 ? <SoftSkeleton width="100%" height={64} borderRadius={BorderRadius.lg} /> : null}
    </View>
  );
}

/**
 * Task-card skeleton — same outer frame (white bg, 2px orange border,
 * rounded-24, soft shadow) as the real task card, so the card STRUCTURE is
 * visible from the very first frame while data is still loading.
 */
export function SoftTaskCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.taskCardSkeleton, style]}>
      <SoftSkeleton width={46} height={46} borderRadius={BorderRadius.md} />
      <View style={{ flex: 1, gap: 8 }}>
        <SoftSkeleton width="70%" height={15} borderRadius={7} />
        <SoftSkeleton width="45%" height={12} borderRadius={6} />
      </View>
      <SoftSkeleton width={54} height={24} borderRadius={BorderRadius.pill} />
    </View>
  );
}

/**
 * Full-screen skeleton: heading line + N card blocks. Use everywhere data
 * loads (lists, profiles, stats) — replaces plain spinners per design rule.
 */
export function SoftScreenSkeleton({ cards = 4, style }: { cards?: number; style?: ViewStyle }) {
  return (
    <View style={[{ padding: Spacing[5], gap: Spacing[3] }, style]}>
      <SoftSkeleton width={170} height={26} borderRadius={10} />
      <SoftSkeleton width="55%" height={14} borderRadius={8} />
      {Array.from({ length: cards }, (_, i) => (
        <SoftSkeleton key={i} height={92} borderRadius={BorderRadius.lg} />
      ))}
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
    <MotiView
      from={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.emptyState}
    >
      <View style={[styles.emptyIcon, { backgroundColor: Colors.brand.accentSoft }]}>
        <Ionicons name={icon} size={44} color={Colors.brand.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: isDark ? Colors.dark.text.primary : Colors.text.primary }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, { color: Colors.text.secondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <SoftButton label={actionLabel} onPress={onAction} variant="accent" fullWidth={false} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[4] }} withGlow />
      ) : null}
    </MotiView>
  );
}

// ============================================================
// SCREEN WRAPPER — antique white bg, optional scroll
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
  // Keep content below the system status bar (edge-to-edge safe).
  const insets = useSafeAreaInsets();

  if (!scrollable) {
    return (
      <View style={[styles.screen, { backgroundColor: bg, paddingTop: insets.top }, style]}>
        {children}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { backgroundColor: bg, paddingTop: insets.top }, style]}>
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
// ICON — soft circular chip with scale-on-press
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
  color?: string;
  bgColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const scaleAnim = React.useState(() => new Animated.Value(1))[0];

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
            backgroundColor: bgColor || Colors.brand.accentSoft,
            width: size * 2,
            height: size * 2,
            borderRadius: size,
          }
        ]}>
          <Ionicons name={name} size={size} color={color || Colors.brand.accent} />
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
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontFamily: Typography.fontFamily.semiBold, includeFontPadding: false, letterSpacing: 0.2 },
  card: {
    borderWidth: 1,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceEmoji: { fontSize: 26 },
  choiceLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 15,
    includeFontPadding: false,
  },
  choiceDesc: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 12.5,
    marginTop: 2,
  },
  header: { marginBottom: Spacing[6] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  headerTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 26,
    lineHeight: 32,
    includeFontPadding: false,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 13.5,
    marginTop: 3,
    lineHeight: 19,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.cardPressed,
  },
  inputContainer: { marginBottom: Spacing[5] },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing[2],
    marginLeft: Spacing[1],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    minHeight: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  inputIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
    backgroundColor: Colors.surface.creamSoft,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily.body,
    fontSize: 15,
    paddingVertical: Spacing[3],
  },
  inputIconRight: { padding: Spacing[1] },
  inputError: {
    fontSize: Typography.fontSize.xs,
    color: Colors.semantic.error,
    marginTop: Spacing[1],
    marginLeft: Spacing[1],
    fontFamily: Typography.fontFamily.medium,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1] + 2,
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
  },
  badgeText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, includeFontPadding: false },
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
  skeletonContainer: { padding: Spacing[1] },
  // Same outer frame as the real task card — see SoftTaskCardSkeleton.
  taskCardSkeleton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.brand.accent,
    padding: Spacing[4], marginBottom: Spacing[3], ...Shadows.card,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: Spacing[12] },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[5] },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, marginBottom: Spacing[2] },
  emptyMessage: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.body, textAlign: 'center', marginBottom: Spacing[6], lineHeight: 22 },
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: Spacing[24] },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
});

// Disk-cached remote images (expo-image wrapper) — use for ALL remote URIs.
export { CachedImage } from './CachedImage';
