import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import axios from 'axios';

// API base URL - replace with your actual backend URL
const API_BASE_URL = 'http://localhost:8000';

export default function PromptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract stable values from params to use in dependencies
  const promptId = params.id as string | undefined;
  const promptText = params.prompt as string | undefined;
  const promptTitle = params.title as string | undefined;
  const promptFollowups = params.followups as string | undefined; 
  const interactionType = params.interaction_type as string | undefined;
  const theme = params.theme as string | undefined;
  const mood = params.mood as string | undefined;
  const participants = params.participants as string | undefined;
  const relationship = params.relationship as string | undefined;

  // State for the prompt data
  const [promptData, setPromptData] = useState<{
    title: string;
    question: string;
    followups: string[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState<boolean>(true);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset state to initial values when the screen is focused
      setPromptData(null);
      setIsLoading(true);
      setError(null);
      setShouldLoad(true);
      
      return () => {
        // This cleanup function runs when the screen loses focus
        setShouldLoad(false);
      };
    }, [])
  );

  // Load the prompt data based on the ID or parameters
  useEffect(() => {
    // If we shouldn't load, exit early
    if (!shouldLoad) return;
    
    // Flag to prevent state updates if the component unmounts
    let isMounted = true;

    const loadPrompt = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);

      try {
        // If we have a prompt ID, fetch it from the server
        if (promptId) {
          const response = await axios.get(`${API_BASE_URL}/generator/${promptId}`);
          if (isMounted) setPromptData(response.data);
        }
        // If we have prompt data passed directly with all parameters
        else if (promptText && promptTitle) {
          if (isMounted) {
            // Parse followups from JSON if available
            let followups: string[] = [];
            if (promptFollowups) {
              try {
                followups = JSON.parse(promptFollowups);
              } catch (err) {
                console.error('Error parsing followups:', err);
              }
            }
            
            setPromptData({
              title: promptTitle,
              question: promptText,
              followups
            });
          }
        }
        // If we have just prompt text
        else if (promptText) {
          if (isMounted) {
            setPromptData({
              title: interactionType || "Prompt",
              question: promptText,
              followups: []
            });
          }
        }
        // If we have filter parameters, generate a new prompt
        else if (theme || mood || interactionType || participants || relationship) {
          const response = await axios.post(`${API_BASE_URL}/generator/`, {
            theme,
            interaction_type: interactionType,
            mood,
            participants,
            relationship
          });
          if (isMounted) setPromptData(response.data);
        }
        // No parameters provided
        else {
          if (isMounted) setError('No prompt data or parameters provided');
        }
      } catch (err) {
        console.error('Error loading prompt:', err);
        if (isMounted) setError('Failed to load prompt. Please try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPrompt();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [promptId, promptText, promptTitle, promptFollowups, interactionType, theme, mood, participants, relationship, shouldLoad]);

  // Share the prompt
  const sharePrompt = async () => {
    if (!promptData) return;

    try {
      const message = `${promptData.title}\n\n${promptData.question}${
        promptData.followups.length > 0 
          ? `\n\nFollow-up questions:\n${promptData.followups.join('\n')}` 
          : ''
      }`;
      
      await Share.share({
        message: message,
        title: promptData.title
      });
    } catch (err) {
      console.error('Error sharing prompt:', err);
      Alert.alert('Error', 'Failed to share the prompt. Please try again.');
    }
  };

  // Save to favorites (placeholder function)
  const saveToFavorites = () => {
    // Implement saving to favorites functionality
    console.log('Saving to favorites:', promptData);
    // You would typically store this in AsyncStorage or your backend
  };

  // Go back to the generator
  const goBack = () => {
    // Clear state before navigating back
    setPromptData(null);
    setIsLoading(true);
    setError(null);
    setShouldLoad(false);
    
    // Navigate back
    router.back();
  };

  // Font loading
  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../../assets/fonts/Petrona-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Prompt</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5D5FEF" />
              <Text style={styles.loadingText}>Loading your prompt...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF4D4D" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={goBack}>
                <Text style={styles.retryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : promptData ? (
            <>
              {/* Title */}
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{promptData.title}</Text>
                </View>
              </View>

              {/* Main prompt content */}
              <View style={styles.promptCard}>
                <Text style={styles.promptText}>{promptData.question}</Text>
              </View>
              
              {/* Follow-up questions */}
              {promptData.followups && promptData.followups.length > 0 && (
                <View style={styles.followupsContainer}>
                  <Text style={styles.followupsTitle}>Follow-up Questions:</Text>
                  {promptData.followups.map((followup, index) => (
                    <View key={index} style={styles.followupItem}>
                      <Text style={styles.followupText}>• {followup}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={saveToFavorites}>
                  <Ionicons name="heart-outline" size={24} color="#5D5FEF" />
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={sharePrompt}>
                  <Ionicons name="share-outline" size={24} color="#5D5FEF" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Generate another button */}
              <TouchableOpacity style={styles.generateAnotherButton} onPress={goBack}>
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.generateAnotherButtonText}>Generate Another</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerRight: {
    width: 40, // To balance the header
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5F5F5F',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#5F5F5F',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#5D5FEF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#5D5FEF',
    fontSize: 14,
    fontWeight: '500',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  promptText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333333',
    fontFamily: 'Petrona-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    marginTop: 8,
    color: '#5D5FEF',
    fontSize: 14,
  },
  generateAnotherButton: {
    backgroundColor: '#5D5FEF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  generateAnotherButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  followupsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  followupsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    fontFamily: 'Petrona-Bold',
  },
  followupItem: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  followupText: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Petrona-Regular',
    flex: 1,
  }
});
