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
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Background images array
  const backgroundImages = [
    require('../../assets/images/backgrounds/login_background_avocado.jpg'),
    require('../../assets/images/backgrounds/login_background_fig.jpg'),
    require('../../assets/images/backgrounds/login_background_lemon.jpg'),
    require('../../assets/images/backgrounds/login_background_pasta.jpg'),
    require('../../assets/images/backgrounds/login_background_tomato.jpg'),
  ];

  // Randomly select a background image ONCE using useState to prevent re-selection on re-renders
  const [randomBackground] = useState(() => 
    backgroundImages[Math.floor(Math.random() * backgroundImages.length)]
  );

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
    <ImageBackground 
      source={randomBackground} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.content}>
          {/* Logo Placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>YC</Text>
            </View>
          </View>

          {/* Floating Login Form */}
          <View style={styles.floatingForm}>
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 1)', // Reduced opacity to match form
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
    logoText: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold', // Use consistent name
    // fontWeight: 'bold', // REMOVED - conflicts with ExtraBold
    color: '#FFFFFF', // Back to white
    textAlign: 'center',
  },
  floatingForm: {
    width: width * 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Back to beautiful transparent white
    borderRadius: 20,
    padding: 25, // Slightly reduced padding since no title
    // Removed shadow properties to eliminate the mystery square
    borderWidth: 0, // Remove debug border
    borderColor: 'transparent',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Nunito-ExtraBold',
  },
  input: {
    backgroundColor: 'transparent', // Clean transparent inputs
    borderWidth: 1.5,
    borderColor: 'rgba(156, 163, 175, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#1F2937',
    fontFamily: 'Nunito-Regular',
  },
  loginButton: {
    backgroundColor: '#AAC6AD', // Ice mint color
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Nunito-ExtraBold',
  },
});
