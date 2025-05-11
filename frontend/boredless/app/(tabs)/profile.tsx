import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../../FirebaseConfig.Example';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { useState } from 'react';

export default function ProfileScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace('/(auth)/signIn');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out: ' + error.message);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{auth.currentUser?.email || 'User'}</Text>
      
      <View style={styles.spacer} />
      
      <TouchableOpacity 
        style={styles.signOutButton} 
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        <Text style={styles.signOutText}>
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#5C6BC0',
    marginBottom: 40,
  },
  spacer: {
    flex: 0.5,
  },
  signOutButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 20,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 