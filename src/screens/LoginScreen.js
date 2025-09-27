import React, { useState, useEffect } from 'react';
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
  Image,
  Linking,
  Modal,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);

  // Listen for deep link returns from Google OAuth
  useEffect(() => {
    const handleURL = (event) => {
      const { url } = event;
      if (url.includes('google-auth-success')) {
        // Extract token from URL parameters
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const token = urlParams.get('token');
        const userString = urlParams.get('user');
        
        if (token && userString) {
          try {
            const user = JSON.parse(decodeURIComponent(userString));
            console.log('🔐 Google Sign-In successful via deep link:', user);
            
            // Store the token and user data
            YesChefAPI.token = token;
            YesChefAPI.user = user;
            YesChefAPI.storeAuthData({ access_token: token, user });
            
            setIsGoogleLoading(false);
            Alert.alert('Welcome!', 'Signed in with Google successfully!', [
              { text: 'OK', onPress: () => onLoginSuccess(user) }
            ]);
          } catch (error) {
            console.error('❌ Error parsing deep link data:', error);
            setIsGoogleLoading(false);
            Alert.alert('Error', 'Google sign-in failed');
          }
        }
      } else if (url.includes('google-auth-error')) {
        setIsGoogleLoading(false);
        Alert.alert('Error', 'Google sign-in was cancelled or failed');
      }
    };

    // Add URL listener
    const subscription = Linking.addEventListener('url', handleURL);

    return () => subscription?.remove();
  }, [onLoginSuccess]);

  // Clean web-based Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Open the backend Google OAuth endpoint
      const googleAuthUrl = `${YesChefAPI.baseURL}/api/auth/google-mobile?redirect_uri=yeschef://google-auth`;
      
      console.log('🔐 Opening Google OAuth URL:', googleAuthUrl);
      
      const supported = await Linking.canOpenURL(googleAuthUrl);
      if (supported) {
        await Linking.openURL(googleAuthUrl);
      } else {
        throw new Error('Cannot open Google OAuth URL');
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Could not start Google sign-in. Please try again.');
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsForgotLoading(true);
    
    try {
      const response = await YesChefAPI.forgotPassword(forgotEmail.trim());
      
      if (response.success) {
        Alert.alert(
          'Reset Link Sent!', 
          'If an account exists with that email, a password reset link has been sent. Check your email and follow the instructions.',
          [{ 
            text: 'OK', 
            onPress: () => {
              setShowForgotPasswordModal(false);
              setForgotEmail('');
            }
          }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to send reset link');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error - please try again');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    const { name, email, password, confirmPassword } = signUpData;
    
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsSignUpLoading(true);
    
    try {
      const response = await YesChefAPI.register(name.trim(), email.trim(), password);
      
      if (response.success) {
        Alert.alert(
          'Account Created!', 
          'Your account has been created successfully. You are now logged in!',
          [{ 
            text: 'OK', 
            onPress: () => {
              setShowSignUpModal(false);
              setSignUpData({ name: '', email: '', password: '', confirmPassword: '' });
              onLoginSuccess(response.user);
            }
          }]
        );
      } else {
        Alert.alert('Sign Up Failed', response.error || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error - please try again');
    } finally {
      setIsSignUpLoading(false);
    }
  };

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
          {/* Beautiful YesChef Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/YesChefLogo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
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

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPasswordLink} 
              onPress={() => setShowForgotPasswordModal(true)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

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

            {/* OR Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#757575" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>🔐</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setShowSignUpModal(true)}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      </SafeAreaView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotPasswordModal}>
            <Text style={styles.forgotPasswordModalTitle}>Reset Password</Text>
            <Text style={styles.forgotPasswordModalDescription}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            <TextInput
              style={styles.forgotPasswordInput}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <View style={styles.forgotPasswordButtons}>
              <TouchableOpacity 
                style={styles.forgotPasswordCancelButton} 
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setForgotEmail('');
                }}
              >
                <Text style={styles.forgotPasswordCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.forgotPasswordSendButton, isForgotLoading && styles.forgotPasswordSendButtonDisabled]} 
                onPress={handleForgotPassword}
                disabled={isForgotLoading}
              >
                {isForgotLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.forgotPasswordSendText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Up Modal */}
      <Modal
        visible={showSignUpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignUpModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.signUpModal}>
            <Text style={styles.signUpModalTitle}>Create Account</Text>
            <Text style={styles.signUpModalDescription}>
              Join YesChef and start discovering amazing recipes!
            </Text>
            
            <TextInput
              style={styles.signUpInput}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={signUpData.name}
              onChangeText={(text) => setSignUpData(prev => ({...prev, name: text}))}
              autoCapitalize="words"
              autoComplete="name"
            />
            
            <TextInput
              style={styles.signUpInput}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={signUpData.email}
              onChangeText={(text) => setSignUpData(prev => ({...prev, email: text}))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <TextInput
              style={styles.signUpInput}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#9CA3AF"
              value={signUpData.password}
              onChangeText={(text) => setSignUpData(prev => ({...prev, password: text}))}
              secureTextEntry
              autoComplete="password"
            />
            
            <TextInput
              style={styles.signUpInput}
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              value={signUpData.confirmPassword}
              onChangeText={(text) => setSignUpData(prev => ({...prev, confirmPassword: text}))}
              secureTextEntry
              autoComplete="password"
            />
            
            <View style={styles.signUpButtons}>
              <TouchableOpacity 
                style={styles.signUpCancelButton} 
                onPress={() => {
                  setShowSignUpModal(false);
                  setSignUpData({ name: '', email: '', password: '', confirmPassword: '' });
                }}
              >
                <Text style={styles.signUpCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.signUpCreateButton, isSignUpLoading && styles.signUpCreateButtonDisabled]} 
                onPress={handleSignUp}
                disabled={isSignUpLoading}
              >
                {isSignUpLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.signUpCreateText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  logo: {
    width: 100,
    height: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
    elevation: 8,
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

  // Forgot Password Link
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#AAC6AD',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textDecorationLine: 'underline',
  },

  // Forgot Password Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  forgotPasswordModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  forgotPasswordModalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  forgotPasswordModalDescription: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  forgotPasswordInput: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  forgotPasswordButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  forgotPasswordCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forgotPasswordCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#374151',
    textAlign: 'center',
  },
  forgotPasswordSendButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#AAC6AD',
    borderRadius: 12,
    shadowColor: '#AAC6AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  forgotPasswordSendButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  forgotPasswordSendText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // Sign Up Link
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signUpPrompt: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  signUpLink: {
    color: '#AAC6AD',
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    textDecorationLine: 'underline',
  },

  // Sign Up Modal
  signUpModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signUpModalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  signUpModalDescription: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  signUpInput: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signUpButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  signUpCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#374151',
    textAlign: 'center',
  },
  signUpCreateButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#AAC6AD',
    borderRadius: 12,
    shadowColor: '#AAC6AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpCreateButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  signUpCreateText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
  },

  // OR Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Nunito-Regular',
  },
  
  // Google Sign-In Styles
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
});
