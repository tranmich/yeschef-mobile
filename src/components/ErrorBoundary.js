/**
 * 🚨 ERROR BOUNDARY & LOGGING SYSTEM
 * 
 * Captures errors and displays them in a user-friendly way
 * Also logs to terminal for better debugging
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to console for terminal visibility
    console.error('🚨 ERROR BOUNDARY CAUGHT:', error);
    console.error('📍 ERROR STACK:', error.stack);
    console.error('📋 COMPONENT STACK:', errorInfo.componentStack);
    
    // Also log a simplified version
    console.log('\n=== SIMPLIFIED ERROR FOR DEBUGGING ===');
    console.log('Error:', error.message);
    console.log('Location:', error.stack?.split('\n')[1] || 'Unknown');
    console.log('=====================================\n');
  }

  shareError = async () => {
    const errorText = `
YesChef App Error Report
========================
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
========================
    `;
    
    try {
      await Share.share({
        message: errorText,
        title: 'YesChef Error Report'
      });
    } catch (err) {
      console.log('Failed to share error:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <ScrollView contentContainerStyle={styles.errorContent}>
            <Text style={styles.errorTitle}>🚨 Something went wrong</Text>
            
            <Text style={styles.errorSubtitle}>Error Details:</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Unknown error occurred'}
              </Text>
            </View>

            <Text style={styles.errorSubtitle}>Stack Trace:</Text>
            <ScrollView style={styles.stackContainer} horizontal>
              <Text style={styles.stackText}>
                {this.state.error?.stack || 'No stack trace available'}
              </Text>
            </ScrollView>

            <Text style={styles.errorSubtitle}>Component Stack:</Text>
            <ScrollView style={styles.stackContainer}>
              <Text style={styles.stackText}>
                {this.state.errorInfo?.componentStack || 'No component stack available'}
              </Text>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                <Text style={styles.buttonText}>🔄 Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.shareButton]} 
                onPress={this.shareError}
              >
                <Text style={styles.buttonText}>📤 Share Error</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

// Enhanced console logging for better terminal visibility
export const enhanceLogging = () => {
  const originalError = console.error;
  const originalLog = console.log;
  const originalWarn = console.warn;

  console.error = (...args) => {
    originalError('🚨 [ERROR]', ...args);
    // Also send to original to ensure terminal visibility
    originalLog('\n=== ERROR DETAILS ===');
    originalLog(...args);
    originalLog('=====================\n');
  };

  console.warn = (...args) => {
    originalWarn('⚠️ [WARNING]', ...args);
  };

  // Catch unhandled promise rejections - React Native compatible
  const handleUnhandledRejection = (reason, promise) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
  };

  // React Native doesn't have window.addEventListener, use require('ErrorUtils') instead
  if (typeof global !== 'undefined' && global.ErrorUtils) {
    const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('🚨 GLOBAL ERROR:', error.message || error);
      console.error('Stack:', error.stack || 'No stack trace');
      console.error('Fatal:', isFatal);
      
      if (originalGlobalHandler) {
        originalGlobalHandler(error, isFatal);
      }
    });
  }

  // For React Native, we'll rely on the ErrorBoundary component to catch most errors
  console.log('🚀 Enhanced Logging initialized for React Native');
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#fee2e2',
    padding: 20,
  },
  errorContent: {
    flexGrow: 1,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginTop: 15,
    marginBottom: 5,
  },
  errorBox: {
    backgroundColor: '#fecaca',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f87171',
  },
  errorText: {
    fontSize: 14,
    color: '#7f1d1d',
    fontFamily: 'monospace',
  },
  stackContainer: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  stackText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  shareButton: {
    backgroundColor: '#1f2937',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
