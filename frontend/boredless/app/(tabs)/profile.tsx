import { Text, View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { auth } from '../../FirebaseConfig';
import { signOut, updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFontLoader } from '../../hooks/useFontLoader';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentTab } from '../../context/TabContext';

export default function ProfileScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const { showToast } = useToast();
  const { setCurrentTab } = useCurrentTab();

  // Set current tab when profile screen is focused
  useFocusEffect(
    useCallback(() => {
      setCurrentTab('profile');
    }, [setCurrentTab])
  );

  // Profile edit states
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [newDisplayName, setNewDisplayName] = useState(auth.currentUser?.displayName || '');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut(auth);
              router.replace('/(auth)/signIn');
            } catch (error: any) {
              showToast('Failed to sign out: ' + error.message, 'error');
            } finally {
              setIsSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = async () => {
    if (!auth.currentUser) {
      showToast('No user logged in', 'error');
      return;
    }

    if (!newDisplayName.trim()) {
      showToast('Please enter a display name', 'warning');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName.trim()
      });
      setDisplayName(newDisplayName.trim());
      setShowEditProfileModal(false);
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      showToast('Failed to update profile: ' + error.message, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      showToast('No user logged in', 'error');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Change password
      await updatePassword(auth.currentUser, newPassword);
      
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully', 'success');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        showToast('Current password is incorrect', 'error');
      } else {
        showToast('Failed to change password: ' + error.message, 'error');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resetPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(false);
  };

  const resetProfileModal = () => {
    setNewDisplayName(displayName);
    setShowEditProfileModal(false);
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <ScrollView contentContainerStyle={styles.mainScrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section - matching other screens */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your Profile</Text>
          <Text style={styles.heroSubtitle}>Manage your account settings and preferences</Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {displayName ? displayName.charAt(0).toUpperCase() : auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {displayName || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {auth.currentUser?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionContainer}>
          <View>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <Text style={styles.sectionSubtitle}>Manage your profile and security</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowEditProfileModal(true)}
          >
            <View style={styles.settingIcon}>
              <Feather name="user" size={20} color="#374151" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>Change your display name</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.settingIcon}>
              <Feather name="lock" size={20} color="#374151" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingSubtitle}>Update your password</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              // Placeholder for future functionality
              showToast('Coming soon!', 'info');
            }}
          >
            <View style={styles.settingIcon}>
              <Feather name="bell" size={20} color="#374151" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage your notifications</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CBD5E0" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Section */}
        <View style={styles.sectionContainer}>
          <View>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.sectionSubtitle}>Sign out of your account</Text>
          </View>
        </View>

        <View style={styles.signOutContainer}>
          <TouchableOpacity 
            style={[styles.signOutButton, isSigningOut && styles.disabledButton]} 
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <View style={styles.loadingContainer}>
                <Feather name="loader" size={16} color="#FFFFFF" />
                <Text style={styles.signOutText}>Signing Out...</Text>
              </View>
            ) : (
              <>
                <Feather name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showEditProfileModal}
        onRequestClose={resetProfileModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={resetProfileModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>Update your display name</Text>
              </View>
              
              <TextInput
                style={styles.textInput}
                placeholder="Enter display name..."
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                autoFocus
                maxLength={30}
              />
              
              <TouchableOpacity 
                style={[styles.modalPrimaryButton, isUpdatingProfile && styles.disabledButton]} 
                onPress={handleEditProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <View style={styles.modalLoadingContainer}>
                    <Feather name="loader" size={16} color="#FFFFFF" />
                    <Text style={styles.modalLoadingText}>Updating...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Update Profile</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={resetProfileModal}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showChangePasswordModal}
        onRequestClose={resetPasswordModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={resetPasswordModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.modalSubtitle}>Enter your current and new password</Text>
              </View>
              
              <TextInput
                style={styles.textInput}
                placeholder="Current password..."
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoFocus
              />
              
              <TextInput
                style={styles.textInput}
                placeholder="New password..."
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              
              <TextInput
                style={styles.textInput}
                placeholder="Confirm new password..."
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              
              <TouchableOpacity 
                style={[styles.modalPrimaryButton, isChangingPassword && styles.disabledButton]} 
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <View style={styles.modalLoadingContainer}>
                    <Feather name="loader" size={16} color="#FFFFFF" />
                    <Text style={styles.modalLoadingText}>Changing...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={resetPasswordModal}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  mainScrollContainer: {
    paddingBottom: 24,
  },
  // Hero Section - matching other screens
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
  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Petrona-Bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  // Section Headers - matching other screens
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
  // Settings Container
  settingsContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  // Sign Out Container
  signOutContainer: {
    paddingHorizontal: 24,
  },
  signOutButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Petrona-Bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Modal Styles - matching favourites.tsx
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  textInput: {
    width: '100%',
    padding: 16,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    backgroundColor: '#FFFFFF',
    color: '#1A202C',
  },
  modalPrimaryButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#374151',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Petrona-Bold',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Petrona-Regular',
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalLoadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Petrona-Regular',
  },
}); 