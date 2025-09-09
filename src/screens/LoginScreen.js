import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await YesChefAPI.login(email.trim(), password.trim());
      
      if (result.success) {
        Alert.alert('Success!', 'Logged in successfully!', [
          { text: 'OK', onPress: () => onLoginSuccess(result.user) }
        ]);
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error - check backend connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    Alert.alert(
      'Create Account',
      'Contact your administrator to create a new account or use your existing test credentials.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🍳 YesChef Mobile</Text>
        <Text style={styles.subtitle}>Your intelligent cooking companion</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>🔐 Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateAccount}>
            <Text style={styles.createButtonText}>Need an account?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>What you can do:</Text>
          <Text style={styles.feature}>🛒 Smart grocery lists with offline sync</Text>
          <Text style={styles.feature}>📚 Import recipes from any website</Text>
          <Text style={styles.feature}>👨‍🍳 Step-by-step cooking mode</Text>
          <Text style={styles.feature}>📅 Intelligent meal planning</Text>
        </View>

        <Text style={styles.connectionInfo}>
          Connected to: {YesChefAPI.baseURL}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  loginButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: 'transparent',
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  features: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  connectionInfo: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
