import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import axios from 'axios';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';

// API base URL - replace with your actual backend URL
const API_BASE_URL = 'http://localhost:8000';

// Default prompt categories to show when opened from tab bar
const DEFAULT_PROMPT_CATEGORIES = [
  { title: "Conversation Starters", icon: "chatbubbles-outline" },
  { title: "Interactive Games", icon: "game-controller-outline" },
  { title: "Quizzes", icon: "help-circle-outline" },
  { title: "Friendly Debates", icon: "people-outline" },
  { title: "Icebreakers", icon: "ice-cream-outline" },
  { title: "Thought-provoking Questions", icon: "bulb-outline" }
];

// Screen dimensions for card animations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_ROTATION_ANGLE = 60;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Define types for the card data structure
interface Card {
  title?: string;
  instructions?: string;
  question?: string;
  options?: string[];
  stances?: string[];
  followups?: string[];
}

export default function PromptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract stable values from params to use in dependencies
  const promptId = params.id as string | undefined;
  const promptText = params.prompt as string | undefined;
  const promptTitle = params.title as string | undefined;
  const promptFollowups = params.followups as string | undefined; 
  const promptInstructions = params.instructions as string | undefined;
  const promptOptions = params.options as string | undefined;
  const promptStances = params.stances as string | undefined;
  const promptCards = params.cards as string | undefined;
  const interactionType = params.interaction_type as string | undefined;
  const theme = params.theme as string | undefined;
  const mood = params.mood as string | undefined;
  const participants = params.participants as string | undefined;
  const relationship = params.relationship as string | undefined;

  // State for the prompt data - either a single card or list of cards
  const [promptData, setPromptData] = useState<Card | null>(null);
  // State for all cards received from the API
  const [cards, setCards] = useState<Card[]>([]);
  // Current card index being displayed
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  // State to track if all cards have been swiped
  const [isFinished, setIsFinished] = useState<boolean>(false);
  // State to determine if we're showing categories or cards
  const [showCategories, setShowCategories] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState<boolean>(true);

  // Animation values for swiping
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  
  // Function to handle when a card is swiped away
  const removeCard = useCallback(() => {
    if (currentCardIndex < cards.length - 1) {
      // Move to next card
      setCurrentCardIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        setPromptData(cards[newIndex]);
        return newIndex;
      });
    } else {
      // No more cards
      setIsFinished(true);
    }
    
    // Reset animation values
    translateX.value = 0;
    translateY.value = 0;
    cardOpacity.value = 1;
  }, [currentCardIndex, cards, translateX, translateY, cardOpacity]);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset state to initial values when the screen is focused
      setPromptData(null);
      setCards([]);
      setCurrentCardIndex(0);
      setIsLoading(true);
      setError(null);
      setShouldLoad(true);
      
      // If we don't have any params, show categories view
      const hasParams = promptId || promptText || promptCards || 
                       (theme && mood && interactionType && participants && relationship);
      setShowCategories(!hasParams);
      
      return () => {
        // This cleanup function runs when the screen loses focus
        setShouldLoad(false);
      };
    }, [promptId, promptText, promptCards, theme, mood, interactionType, participants, relationship])
  );

  // Load the prompt data based on the ID or parameters
  useEffect(() => {
    // If we're showing categories or shouldn't load, exit early
    if (showCategories || !shouldLoad) return;
    
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
          if (isMounted) {
            if (response.data.cards && Array.isArray(response.data.cards)) {
              setCards(response.data.cards);
              if (response.data.cards.length > 0) {
                setPromptData(response.data.cards[0]);
              }
            } else {
              // Fallback for old format
              setPromptData(response.data);
            }
          }
        }
        // If we have the full cards array
        else if (promptCards) {
          try {
            const parsedCards = JSON.parse(promptCards);
            if (Array.isArray(parsedCards) && parsedCards.length > 0) {
              setCards(parsedCards);
              setPromptData(parsedCards[0]);
            }
          } catch (err) {
            console.error('Error parsing cards array:', err);
            // If we fail to parse the cards array, fallback to single card approach
            constructSingleCard();
          }
        }
        // If we have prompt data passed directly with all parameters
        else if (promptText) {
          constructSingleCard();
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
          
          if (isMounted) {
            if (response.data.cards && Array.isArray(response.data.cards)) {
              setCards(response.data.cards);
              if (response.data.cards.length > 0) {
                setPromptData(response.data.cards[0]);
              }
            } else {
              // Fallback for old format
              setPromptData(response.data);
            }
          }
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

    // Helper function to construct a single card from individual parameters
    const constructSingleCard = () => {
      if (!isMounted) return;

      // Parse followups from JSON if available
      let followups: string[] = [];
      if (promptFollowups) {
        try {
          followups = JSON.parse(promptFollowups);
        } catch (err) {
          console.error('Error parsing followups:', err);
        }
      }

      // Parse options from JSON if available
      let options: string[] = [];
      if (promptOptions) {
        try {
          options = JSON.parse(promptOptions);
        } catch (err) {
          console.error('Error parsing options:', err);
        }
      }

      // Parse stances from JSON if available
      let stances: string[] = [];
      if (promptStances) {
        try {
          stances = JSON.parse(promptStances);
        } catch (err) {
          console.error('Error parsing stances:', err);
        }
      }
      
      const card: Card = {
        title: promptTitle || interactionType || "Prompt",
        question: promptText || "",
        instructions: promptInstructions,
        options,
        stances,
        followups
      };
      
      setPromptData(card);
      setCards([card]);
    };

    loadPrompt();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [promptId, promptText, promptTitle, promptFollowups, promptInstructions, promptOptions, promptStances, promptCards, interactionType, theme, mood, participants, relationship, shouldLoad, showCategories]);

  // Generate prompts for the selected category
  const generatePromptsForCategory = (category: string) => {
    setShowCategories(false);
    setIsLoading(true);
    
    // Call the API to generate prompts for this category
    axios.post(`${API_BASE_URL}/generator/`, {
      interaction_type: category
    })
    .then(response => {
      if (response.data.cards && Array.isArray(response.data.cards)) {
        setCards(response.data.cards);
        if (response.data.cards.length > 0) {
          setPromptData(response.data.cards[0]);
        }
      } else {
        // Fallback for old format
        setPromptData(response.data);
        setCards([response.data]);
      }
      setIsLoading(false);
    })
    .catch(err => {
      console.error('Error generating prompts:', err);
      setError('Failed to generate prompts. Please try again.');
      setIsLoading(false);
    });
  };

  // Handle generating more cards from the category selection
  const handleGenerateMore = () => {
    setShowCategories(true);
    setIsFinished(false);
  };

  // Navigate to next card
  const nextCard = () => {
    // Simulate a right swipe
    translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      runOnJS(removeCard)();
    });
    cardOpacity.value = withTiming(0, { duration: 300 });
  };

  // Navigate to previous card
  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setPromptData(cards[currentCardIndex - 1]);
    }
  };

  // Define the swipe gesture
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldRemove = 
        Math.abs(event.translationX) > SWIPE_THRESHOLD || 
        Math.abs(event.velocityX) > 800;

      if (shouldRemove) {
        // Swipe the card out of the screen
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(removeCard)();
        });
        cardOpacity.value = withTiming(0, { duration: 300 });
      } else {
        // Return the card to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  // Animated style for the card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Calculate rotation based on horizontal movement
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-CARD_ROTATION_ANGLE, 0, CARD_ROTATION_ANGLE],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Share the prompt
  const sharePrompt = async () => {
    if (!promptData) return;

    try {
      const message = `${promptData.title || ''}\n\n${promptData.question || ''}${
        promptData.instructions ? `\n\nInstructions: ${promptData.instructions}` : ''
      }${
        promptData.options ? `\n\nOptions: ${promptData.options.join(', ')}` : ''
      }${
        promptData.stances ? `\n\nStances: ${promptData.stances.join(', ')}` : ''
      }${
        promptData.followups && promptData.followups.length > 0 
          ? `\n\nFollow-up questions:\n${promptData.followups.join('\n')}` 
          : ''
      }`;
      
      await Share.share({
        message: message,
        title: promptData.title || 'Conversation Prompt'
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
    // If we're showing categories, go back to home
    if (showCategories) {
      router.replace('/');
      return;
    }
    
    // Clear state before navigating back
    setPromptData(null);
    setCards([]);
    setCurrentCardIndex(0);
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

  // Card component to render a swipeable prompt card
  const CardDeck = () => {
    if (!promptData) return null;
    
    return (
      <View style={styles.deckContainer}>
        {/* Card count indicator */}
        <View style={styles.cardCountContainer}>
          <Text style={styles.cardCountText}>
            {currentCardIndex + 1} of {cards.length}
          </Text>
        </View>
        
        {/* Current card (animated and swipeable) */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            {/* Card content */}
            <View style={styles.card}>
              {/* Title */}
              {promptData.title && (
                <View style={styles.cardBadgeContainer}>
                  <Text style={styles.cardBadgeText}>{promptData.title}</Text>
                </View>
              )}

              {/* Instructions if available */}
              {promptData.instructions && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Instructions:</Text>
                  <Text style={styles.cardSectionText}>{promptData.instructions}</Text>
                </View>
              )}

              {/* Main prompt content */}
              {promptData.question && (
                <View style={styles.cardMainContent}>
                  <Text style={styles.cardMainText}>{promptData.question}</Text>
                </View>
              )}
              
              {/* Options if available (for quizzes) */}
              {promptData.options && promptData.options.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Options:</Text>
                  {promptData.options.map((option, index) => (
                    <Text key={index} style={styles.cardListItem}>
                      {String.fromCharCode(65 + index)}. {option}
                    </Text>
                  ))}
                </View>
              )}

              {/* Stances if available (for debates) */}
              {promptData.stances && promptData.stances.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Perspectives:</Text>
                  {promptData.stances.map((stance, index) => (
                    <Text key={index} style={styles.cardListItem}>• {stance}</Text>
                  ))}
                </View>
              )}
              
              {/* Follow-up questions */}
              {promptData.followups && promptData.followups.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Follow-up Questions:</Text>
                  {promptData.followups.map((followup, index) => (
                    <Text key={index} style={styles.cardListItem}>• {followup}</Text>
                  ))}
                </View>
              )}
            </View>
            
            {/* Swipe instruction overlay */}
            <View style={styles.swipeInstructions}>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={styles.swipeIcon} />
              <Text style={styles.swipeText}>Swipe to see next</Text>
            </View>
          </Animated.View>
        </GestureDetector>
        
        {/* Action buttons below the card */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={saveToFavorites}>
            <Ionicons name="heart-outline" size={24} color="#5D5FEF" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={sharePrompt}>
            <Ionicons name="share-outline" size={24} color="#5D5FEF" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={nextCard}>
            <Ionicons name="chevron-forward-outline" size={24} color="#5D5FEF" />
            <Text style={styles.actionButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Categories view component
  const CategoriesView = () => (
    <ScrollView style={styles.categoriesScrollView}>
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Choose a Category</Text>
        <Text style={styles.categoriesSubtitle}>Select a category to explore conversation prompts</Text>
        
        <View style={styles.categoriesGrid}>
          {DEFAULT_PROMPT_CATEGORIES.map((category, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.categoryCard}
              onPress={() => generatePromptsForCategory(category.title)}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons name={category.icon as any} size={24} color="#5D5FEF" />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Empty deck view when all cards are swiped
  const EmptyDeck = () => (
    <View style={styles.emptyDeckContainer}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#5D5FEF" />
      <Text style={styles.emptyDeckTitle}>All Done!</Text>
      <Text style={styles.emptyDeckText}>You've gone through all the prompts.</Text>
      <TouchableOpacity style={styles.generateMoreButton} onPress={handleGenerateMore}>
        <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.generateMoreButtonText}>Generate More</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showCategories ? "Prompt Categories" : "Your Prompt"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.mainContainer}>
        {showCategories ? (
          <CategoriesView />
        ) : isLoading ? (
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
        ) : isFinished ? (
          <EmptyDeck />
        ) : promptData ? (
          <CardDeck />
        ) : null}
      </View>
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
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 100,
  },
  // Card deck styles
  deckContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cardCountContainer: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 10,
  },
  cardCountText: {
    fontSize: 14,
    color: '#5F5F5F',
    fontWeight: '500',
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardBadgeText: {
    color: '#5D5FEF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Petrona-Bold',
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 16,
  },
  cardMainText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#333333',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
  },
  cardSection: {
    marginVertical: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
  },
  cardSectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333333',
    fontFamily: 'Petrona-Regular',
  },
  cardListItem: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Petrona-Regular',
    marginBottom: 6,
    paddingLeft: 8,
  },
  swipeInstructions: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(93, 95, 239, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeIcon: {
    marginRight: 4,
  },
  swipeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 20,
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
  // Empty deck styles
  emptyDeckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyDeckTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
  },
  emptyDeckText: {
    fontSize: 16,
    color: '#5F5F5F',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Petrona-Regular',
  },
  generateMoreButton: {
    backgroundColor: '#5D5FEF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  generateMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  // Loading styles
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
  // Error styles
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
  
  // Keep existing styles for backward compatibility
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavButton: {
    borderColor: '#F0F0F0',
  },
  navText: {
    fontSize: 14,
    color: '#5F5F5F',
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
  instructionsContainer: {
    backgroundColor: '#FFFBF2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD166',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333333',
    fontFamily: 'Petrona-Regular',
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
  optionsContainer: {
    backgroundColor: '#F0FEFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#66D4FF',
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    fontFamily: 'Petrona-Bold',
  },
  optionItem: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  optionText: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Petrona-Regular',
    flex: 1,
  },
  stancesContainer: {
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#9F66FF',
  },
  stancesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    fontFamily: 'Petrona-Bold',
  },
  stanceItem: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  stanceText: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Petrona-Regular',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
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
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesContainer: {
    padding: 24,
  },
  categoriesTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
  },
  categoriesSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    fontFamily: 'Petrona-Regular',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Petrona-Bold',
  },
});
