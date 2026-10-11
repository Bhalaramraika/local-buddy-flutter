/**
 * Toast Component — Soft Modern
 * White floating pill cards with tinted icon chips
 * (green success / soft-red error / amber warning / orange info),
 * Poppins labels, spring slide-in.
 */

import React from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { ToastMessage } from '@/types';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';

interface ToastItemProps {
  toast: ToastMessage;
  index: number;
  onDismiss: (id: string) => void;
}

const TYPE_STYLE = {
  success: { icon: 'checkmark-circle' as const, color: Colors.semantic.success, soft: Colors.semantic.successSoft },
  error: { icon: 'close-circle' as const, color: Colors.semantic.error, soft: Colors.semantic.errorSoft },
  warning: { icon: 'warning' as const, color: Colors.semantic.warning, soft: Colors.semantic.warningSoft },
  info: { icon: 'information-circle' as const, color: Colors.brand.accent, soft: Colors.brand.accentSoft },
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, index, onDismiss }) => {
  const [fadeAnim] = React.useState(() => new Animated.Value(0));
  const [slideAnim] = React.useState(() => new Animated.Value(50));
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const dismiss = () => {
    if (isExiting) return;
    setIsExiting(true);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -40, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const tone = TYPE_STYLE[toast.type] || TYPE_STYLE.info;

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    <Animated.View style={[animatedStyle, styles.toast]} pointerEvents={isExiting ? 'none' : 'auto'}>
      <View style={styles.toastContent}>
        <View style={[styles.iconContainer, { backgroundColor: tone.soft }]}>
          <Ionicons name={tone.icon} size={18} color={tone.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
          {toast.message ? (
            <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
          ) : null}
        </View>
        <Pressable onPress={dismiss} style={styles.closeButton} accessibilityLabel="Dismiss" hitSlop={8}>
          <Ionicons name="close" size={16} color={Colors.semantic.error} />
        </Pressable>
      </View>
      {toast.action && (
        <Pressable
          onPress={() => {
            toast.action?.onPress();
            dismiss();
          }}
          style={[styles.actionButton, { backgroundColor: tone.soft }]}
        >
          <Text style={[styles.actionText, { color: tone.color }]}>{toast.action.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[3] + 2,
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.elevated,
    minHeight: 56,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: 1,
  },
  message: {
    color: Colors.text.secondary,
    fontSize: 12.5,
    fontFamily: Typography.fontFamily.body,
    lineHeight: 17,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.semantic.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing[2],
  },
  actionButton: {
    marginTop: Spacing[2],
    paddingVertical: 7,
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12.5,
    fontFamily: Typography.fontFamily.semiBold,
  },
});

/**
 * Toast Container - Renders all active toasts
 * Should be placed at the root of the app
 */
export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const hideToast = useUIStore((state) => state.hideToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View style={containerStyles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={hideToast}
        />
      ))}
    </View>
  );
};

const containerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    pointerEvents: 'box-none',
  },
});

export default ToastContainer;
