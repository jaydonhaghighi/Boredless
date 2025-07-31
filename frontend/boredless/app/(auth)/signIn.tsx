import { Text, StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth } from '../../FirebaseConfig'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useFontLoader } from '../../hooks/useFontLoader'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

const index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, loading]);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.log('Email auth error:', error);
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.sectionTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            <Text style={styles.sectionSubtitle}>
              {isSignUp ? 'Join us to save your conversations' : 'Welcome back! Sign in to continue'}
            </Text>
          </View>
        </View>

        {/* Email/Password Form */}
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

          {/* Primary Action Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.disabledButton]} 
            onPress={handleEmailSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Feather name="loader" size={16} color="#FFFFFF" />
                <Text style={styles.loadingText}>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Sign In/Sign Up */}
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
          >
            <Text style={styles.toggleButtonText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Google Sign-In Placeholder */}
        <View style={styles.googleContainer}>
          <View style={styles.googleButton}>
            <Text style={styles.googleButtonText}>Google Sign-In Coming Soon</Text>
          </View>
        </View>

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
  // Google Button
  googleContainer: {
    paddingHorizontal: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
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