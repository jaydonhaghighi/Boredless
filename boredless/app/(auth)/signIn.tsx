import { Text, StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth } from '../../FirebaseConfig'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useFontLoader } from '../../hooks/useFontLoader'
import { Feather, AntDesign } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

const index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, loading]);

  const handleSuccess = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setIsSignUp(false);
    router.replace('/(tabs)/home');
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Welcome back!', 'success');
      handleSuccess();
    } catch (error: any) {
      console.log('Email auth error:', error);
      showToast('Authentication failed: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with first and last name
      if (userCredential.user) {
        // Note: updateProfile is not available in React Native Firebase
        // The display name will be set when the user profile is created in Firestore
        console.log('User created with display name:', `${firstName} ${lastName}`.trim());
      }
      
      showToast('Account created successfully!', 'success');
      handleSuccess();
    } catch (error: any) {
      console.log('Email signup error:', error);
      showToast('Sign up failed: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      showToast('Google Sign-In will be implemented with the proper React Native package', 'info');
    } catch (error: any) {
      console.log('Google sign-in error:', error);
      showToast('Google Sign-In failed: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset email sent successfully!', 'success');
      setResetEmailSent(true);
    } catch (error: any) {
      console.log('Password reset error:', error);
      showToast('Password reset failed: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setResetEmailSent(false);
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setIsSignUp(false);
  };

  const switchToSignUp = () => {
    setIsSignUp(true);
    setShowForgotPassword(false);
    setPassword('');
  };

  const switchToSignIn = () => {
    setIsSignUp(false);
    setShowForgotPassword(false);
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
  };

  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <ScrollView contentContainerStyle={styles.mainScrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section - matching other pages */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome to Boredless</Text>
          <Text style={styles.heroSubtitle}>Sign in to start creating amazing conversations</Text>
        </View>

        {/* Auth Form Section */}
        <View style={styles.sectionContainer}>
          <View>
            <Text style={styles.sectionTitle}>
              {resetEmailSent ? 'Check Your Email' : 
               showForgotPassword ? 'Reset Password' : 
               isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {resetEmailSent ? 'We\'ve sent a password reset link to your email' :
               showForgotPassword ? 'Enter your email to receive a reset link' :
               isSignUp ? 'Join us to save your conversations' : 'Welcome back! Sign in to continue'}
            </Text>
          </View>
        </View>

        {resetEmailSent ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Feather name="mail" size={32} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to {'\n'}<Text style={styles.emailText}>{email}</Text>
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={backToLogin}>
              <Text style={styles.primaryButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : showForgotPassword ? (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Email address" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handlePasswordReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Feather name="loader" size={16} color="#FFFFFF" />
                  <Text style={styles.loadingText}>Sending...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={backToLogin}
              disabled={isLoading}
            >
              <Text style={styles.toggleButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : isSignUp ? (
          <View style={styles.formContainer}>
            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Feather name="user" size={20} color="#718096" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="First Name" 
                  value={firstName} 
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Feather name="user" size={20} color="#718096" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Last Name" 
                  value={lastName} 
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Email address" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Password (min 6 characters)" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handleEmailSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Feather name="loader" size={16} color="#FFFFFF" />
                  <Text style={styles.loadingText}>Creating Account...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={switchToSignIn}
              disabled={isLoading}
            >
              <Text style={styles.toggleButtonText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Email address" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Password" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPasswordButton} 
              onPress={toggleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handleEmailSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Feather name="loader" size={16} color="#FFFFFF" />
                  <Text style={styles.loadingText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={switchToSignUp}
              disabled={isLoading}
            >
              <Text style={styles.toggleButtonText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Divider */}
        {!showForgotPassword && !resetEmailSent && (
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Google Sign-In Button */}
        {!showForgotPassword && !resetEmailSent && (
          <View style={styles.googleContainer}>
            <TouchableOpacity 
              style={[styles.googleButton, isLoading && styles.disabledButton]} 
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <AntDesign name="google" size={20} color="#374151" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  mainScrollContainer: {
    paddingBottom: 24,
  },
  // Hero Section - matching other pages
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 8,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Petrona-Regular',
    lineHeight: 24,
  },
  // Section Headers - matching other pages
  sectionContainer: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  // Form Container
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    color: '#1A202C',
  },
  // Primary Button - matching other pages
  primaryButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#374151',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Petrona-Bold',
  },
  // Toggle Button
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#5C6BC0',
    fontFamily: 'Petrona-Regular',
  },
  // Forgot Password Button
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#5C6BC0',
    fontFamily: 'Petrona-Regular',
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  // Google Button
  googleContainer: {
    paddingHorizontal: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Petrona-Bold',
  },
  // Success Container
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 20,
    color: '#1A202C',
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: 'Petrona-Regular',
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailText: {
    fontFamily: 'Petrona-Bold',
    color: '#1A202C',
  },
  // Loading States
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
  },
  // Disabled States
  disabledButton: {
    backgroundColor: '#CBD5E0',
    opacity: 0.7,
  },
});