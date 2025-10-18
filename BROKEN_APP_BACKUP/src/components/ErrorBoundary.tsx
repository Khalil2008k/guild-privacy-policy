import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { theme: any }, State> {
  constructor(props: Props & { theme: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.error('Production error captured:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={[styles.container, { backgroundColor: this.props.theme.background }]}>
          <View style={[styles.errorCard, { backgroundColor: this.props.theme.surface }]}>
            <Text style={[styles.errorTitle, { color: this.props.theme.error || '#F44336' }]}>
              Oops! Something went wrong
            </Text>
            <Text style={[styles.errorMessage, { color: this.props.theme.textSecondary }]}>
              We encountered an unexpected error. Please try restarting the app.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={[styles.errorDetails, { color: this.props.theme.textSecondary }]}>
                {this.state.error.toString()}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: this.props.theme.primary }]}
              onPress={() => this.setState({ hasError: false, error: undefined })}
            >
              <Text style={[styles.retryButtonText, { color: this.props.theme.surface }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary(props: Props) {
  const { theme } = useTheme();
  return <ErrorBoundaryClass {...props} theme={theme} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 12,
    fontFamily: 'Signika Negative SC',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
  },
});
