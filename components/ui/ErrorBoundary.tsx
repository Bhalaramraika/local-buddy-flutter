/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays them as toasts instead of crashing the app
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUIStore } from '@/store/uiStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Show error as toast - use getState() to access store outside React lifecycle
    const { showToast } = useUIStore.getState();
    showToast({
      type: 'error',
      title: 'Something went wrong',
      message: error.message || 'An unexpected error occurred',
      duration: 8000,
    });

    // In production, you might want to send this to an error reporting service
    // e.g., Sentry, Bugsnag, etc.
    if (__DEV__) {
      console.log('Error caught by ErrorBoundary:', error);
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, render it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Something went wrong</Text>
          <Text style={styles.fallbackMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.fallbackHint}>
            The error has been reported. Please try again.
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
  return (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  fallbackHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ErrorBoundary;