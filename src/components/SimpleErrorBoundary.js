/**
 * 🚨 SIMPLIFIED ERROR BOUNDARY FOR REACT NATIVE
 * 
 * A React Native-compatible error boundary without web dependencies
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error: error });

    // React Native compatible logging
    console.error('🚨 ERROR BOUNDARY CAUGHT:', error.message || error);
    console.error('📍 ERROR STACK:', error.stack || 'No stack');
    console.error('📋 COMPONENT STACK:', errorInfo.componentStack || 'No component stack');
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>🚨 Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>🔄 Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#7f1d1d',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SimpleErrorBoundary;
