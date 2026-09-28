/**
 * Toast Component
 * Displays toast notifications from the UI store
 */

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, StyleProp, ViewStyle } from 'react-native';
import { useUIStore } from '@/store/uiStore';
import { ToastMessage } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface ToastItemProps {
  toast: ToastMessage;
  index: number;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, index, onDismiss }) => {
  const { theme } = useTheme();
  const [fadeAnim] = React.useState(() => new Animated.Value(0));
  const [slideAnim] = React.useState(() => new Animated.Value(50));
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const dismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const getToastStyles = () => {
    const baseStyles: StyleProp<ViewStyle>[] = [styles.toast, styles[toast.type]];
    if (theme === 'dark') {
      baseStyles.push(styles.dark);
    }
    return baseStyles;
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    <Animated.View style={[animatedStyle, getToastStyles()]} pointerEvents={isExiting ? 'none' : 'auto'}>
      <View style={styles.toastContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{getIcon()}</Text>
        </View>
        <View style={[styles.textContainer, { flex: 1 }]}>
          <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
          {toast.message && (
            <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
          )}
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeButton} accessibilityLabel="Dismiss">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      {toast.action && (
        <TouchableOpacity 
          onPress={() => {
            toast.action?.onPress();
            dismiss();
          }}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>{toast.action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    overflow: 'hidden',
  },
  success: {
    backgroundColor: '#10B981',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  error: {
    backgroundColor: '#EF4444',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  warning: {
    backgroundColor: '#F59E0B',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  info: {
    backgroundColor: '#3B82F6',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  dark: {
    shadowOpacity: 0.3,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  iconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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