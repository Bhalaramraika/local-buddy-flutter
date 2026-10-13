/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays them as toasts instead of crashing the app
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useUIStore } from '@/store/uiStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * When any key changes (e.g. logged-in user id, route), the boundary
   * resets its error state — so after a crash + logout/login the user is
   * NOT stuck on the error screen forever (this was the "still shows the
   * error after logout, never returns to welcome" bug).
   */
  resetKeys?: readonly unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  private prevResetKeys: readonly unknown[] = this.props.resetKeys ?? [];

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    // Auto-reset ONLY when a resetKey actually changed (logout → user id
    // becomes undefined → boundary clears, the auth redirect to Welcome runs
    // normally). Guarded by the stored snapshot so it fires exactly once per
    // key change.
    //
    // NOTE: there is intentionally NO "children identity changed → reset"
    // heuristic here. JSX children are new objects on every parent render,
    // so resetting on identity change can spin into
    // setState → render → child throws → componentDidUpdate → setState …
    // which surfaces as "Maximum update depth exceeded" and hides the REAL
    // error. Users recover via resetKeys, route change remount, or Retry.
    const prev = this.prevResetKeys;
    const next = this.props.resetKeys ?? [];
    if (
      prevProps.resetKeys !== this.props.resetKeys &&
      (prev.length !== next.length || next.some((k, i) => !Object.is(k, prev[i])))
    ) {
      this.prevResetKeys = next;
      if (this.state.hasError) this.reset();
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console with full stack trace
    console.error('====================================');
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo?.componentStack);
    console.error('====================================');

    // Show error as toast - use getState() to access store outside React lifecycle
    try {
      const { showToast } = useUIStore.getState();
      showToast({
        type: 'error',
        title: 'Something went wrong',
        message: error.message || 'An unexpected error occurred',
        duration: 8000,
      });
    } catch (toastError) {
      console.error('Failed to show error toast:', toastError);
    }

    if (__DEV__) {
      console.log('Error caught by ErrorBoundary:', error);
    }
  }

  public reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  /** Reset AND navigate home — deterministic escape hatch when the crashing
   *  screen would just crash again on retry (keeps the user out of the
   *  "stuck on the error screen" state). */
  public resetToHome = (): void => {
    this.reset();
    // Imperative navigation works outside of hooks in expo-router.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { router } = require('expo-router');
      // slight delay so the fallback unmounts before the transition
      setTimeout(() => router.replace('/'), 0);
    } catch (navError) {
      console.warn('[ErrorBoundary] navigate-home failed:', navError);
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, render it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI — with a working retry + recovery path
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Something went wrong</Text>
          <Text style={styles.fallbackMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable onPress={this.reset} style={styles.retryButton} accessibilityRole="button" accessibilityLabel="Try again">
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
          <Pressable onPress={this.resetToHome} style={styles.homeButton} accessibilityRole="button" accessibilityLabel="Go to home">
            <Text style={styles.homeButtonText}>Go to home</Text>
          </Pressable>
          <Text style={styles.fallbackHint}>
            The error has been reported. You can also restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use error boundary state in functional components
 * Note: This requires the component to be wrapped in an ErrorBoundary
 */
export const useErrorHandler = () => {
  const { showToast } = useUIStore();
  
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    showToast({
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      duration: 8000,
    });
  }, [showToast]);
};

/**
 * Wrapper component that adds error boundary to a specific part of the tree
 */
export const withErrorBoundary = <T extends React.ComponentType<any>>(
  WrappedComponent: T,
  fallback?: ReactNode
): React.FC<React.ComponentProps<T>> => {
  const WithErrorBoundary: React.FC<React.ComponentProps<T>> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithErrorBoundary;
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAEBD7',
  },
  fallbackTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1E1209',
    marginBottom: 8,
  },
  fallbackMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#E5484D',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F77051',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  homeButton: {
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#1E1209',
    backgroundColor: 'transparent',
  },
  homeButtonText: {
    color: '#1E1209',
    fontSize: 14.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  fallbackHint: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#6B5443',
    textAlign: 'center',
  },
});

export default ErrorBoundary;