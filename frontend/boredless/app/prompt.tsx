import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Dimensions, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
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
import { Card } from './types/card';
import { CardTitle, CardSection, CardMainContent, CardListItem } from './components/CardElements';

// API base URL - replace with your actual backend URL
const API_BASE_URL = 'http://localhost:8000';

// Screen dimensions for card animations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_ROTATION_ANGLE = 60;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Define types for the card data structure
// interface Card {
//   card_type: string;
//   title?: string;
//   instructions?: string;
//   question?: string;
//   options?: string[];
//   stances?: string[];
//   followups?: string[];
//   action_prompt?: string;
//   correct_answer_index?: number;
// }

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
  // State to track if no decks exist
  const [noDecksExist, setNoDecksExist] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState<boolean>(true);

  // Animation values for swiping
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  
  // State to track card flip
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State to track if current card is favorited
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  
  // State to track if favorite modal is visible
  const [favoriteModalVisible, setFavoriteModalVisible] = useState<boolean>(false);
  
  // Function to toggle card flip
  const toggleFlip = () => {
    // Reset any swipe translation when flipping
    translateX.value = 0;
    translateY.value = 0;
    
    // Toggle flip state
    setIsFlipped(!isFlipped);
  };

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
      // No more cards, go to generate screen
      router.push('/generate');
    }
    
    // Reset animation values
    translateX.value = 0;
    translateY.value = 0;
    cardOpacity.value = 1;
  }, [currentCardIndex, cards, translateX, translateY, cardOpacity, router]);

  // Reset state and load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset state to initial values when the screen is focused
      setPromptData(null);
      setCards([]);
      setCurrentCardIndex(0);
      setIsLoading(true);
      setError(null);
      setShouldLoad(true);
      setNoDecksExist(false);
      
      // If we don't have any params, check for recent decks
      const hasParams = promptId || promptText || promptCards || 
                       (theme && mood && interactionType && participants && relationship);
      
      if (!hasParams) {
        // Check if any decks exist
        checkForExistingDecks();
      }
      
      return () => {
        // This cleanup function runs when the screen loses focus
        setShouldLoad(false);
      };
    }, [promptId, promptText, promptCards, theme, mood, interactionType, participants, relationship])
  );

  // Check if any previously created decks exist
  const checkForExistingDecks = async () => {
    setIsLoading(true);
    
    try {
      // Here you would normally fetch recent decks from storage or API
      // For now, we'll simulate no decks exist
      
      // This is where you would check AsyncStorage, a database, or your backend
      // For demonstration, we're setting noDecksExist to true
      setNoDecksExist(true);
    } catch (err) {
      console.error('Error checking for existing decks:', err);
      setError('Failed to check for existing conversation decks.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load the prompt data based on the ID or parameters
  useEffect(() => {
    // If we're showing categories, already loaded default prompts, or shouldn't load, exit early
    if (!shouldLoad || (promptData && cards.length > 0)) return;
    
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
      
      // Determine card type based on parameters
      let cardType = 'conversation_starter'; // Default type
      
      if (promptOptions && options.length > 0) {
        cardType = 'quiz';
      } else if (promptStances && stances.length > 0) {
        cardType = 'debate';
      } else if (promptInstructions && promptInstructions.includes("game") || promptInstructions?.includes("activity")) {
        cardType = 'interactive_game';
      } else if (interactionType) {
        // Map interaction type to card type
        switch (interactionType.toLowerCase()) {
          case 'conversation starters':
            cardType = 'conversation_starter';
            break;
          case 'interactive games':
            cardType = 'interactive_game';
            break;
          case 'quizzes':
            cardType = 'quiz';
            break;
          case 'friendly debates':
            cardType = 'debate';
            break;
          case 'icebreakers':
            cardType = 'icebreaker';
            break;
          case 'thought-provoking questions':
            cardType = 'thought_provoking';
            break;
        }
      }
      
      const card: Card = {
        card_type: cardType,
        title: promptTitle || interactionType || "Prompt",
        question: promptText || "",
        instructions: promptInstructions,
        options,
        stances,
        followups,
        action_prompt: "", // Default empty for non-game cards
      };
      
      setPromptData(card);
      setCards([card]);
    };

    loadPrompt();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [promptId, promptText, promptTitle, promptFollowups, promptInstructions, promptOptions, promptStances, promptCards, interactionType, theme, mood, participants, relationship, shouldLoad, promptData, cards]);

  // Handle generating more cards
  const handleGenerateMore = () => {
    // Navigate to generate screen
    router.push('/generate');
  };

  // Navigate to previous card
  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prevIndex => {
        const newIndex = prevIndex - 1;
        setPromptData(cards[newIndex]);
        return newIndex;
      });
      
      // Reset animation values
      translateX.value = 0;
      translateY.value = 0;
      cardOpacity.value = 1;
    }
  };

  // Define the swipe gesture
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swipe when card isn't flipped
      if (!isFlipped) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // Only process swipe end when card isn't flipped
      if (isFlipped) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }
      
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
    const swipeRotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-CARD_ROTATION_ANGLE, 0, CARD_ROTATION_ANGLE],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${swipeRotation}deg` },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Animated style for content on the back of the card
  const backCardContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${isFlipped ? '0deg' : '180deg'}` },
      ],
      opacity: isFlipped ? 1 : 0,
      display: isFlipped ? 'flex' : 'none',
    };
  });

  // Animated style for content on the front of the card
  const frontCardContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${isFlipped ? '180deg' : '0deg'}` },
      ],
      opacity: isFlipped ? 0 : 1,
      display: isFlipped ? 'none' : 'flex',
    };
  });

  // Function to toggle favorite status
  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    // Here you would typically save this state to AsyncStorage or your backend
    console.log(`Card ${currentCardIndex} favorite status: ${!isFavorite}`);
  }, [isFavorite, currentCardIndex]);

  // Function to toggle favorite modal
  const showFavoriteModal = useCallback(() => {
    setFavoriteModalVisible(true);
  }, []);
  
  // Function to handle adding to existing deck
  const handleAddToExistingDeck = useCallback(() => {
    // Logic for adding to existing deck would go here
    console.log('Adding card to existing deck:', promptData);
    setFavoriteModalVisible(false);
    
    // Show confirmation
    Alert.alert('Added', 'Card has been added to existing deck!');
  }, [promptData]);
  
  // Function to handle creating a new deck
  const handleCreateDeck = useCallback(() => {
    // Logic for creating a new deck would go here
    console.log('Creating new deck with card:', promptData);
    setFavoriteModalVisible(false);
    
    // Navigate to create deck screen (this could be a new route)
    // router.push('/create-deck');
    
    // For now, show confirmation
    Alert.alert('New Deck', 'Started creating a new deck with this card!');
  }, [promptData]);

  // Go back to the generator
  const goBack = () => {
    // Navigate to home
    router.replace('/');
  };

  // Font loading
  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../assets/fonts/Petrona-Regular.ttf'),
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
    
    // Determine what content to show based on card type
    const renderFrontContent = () => {
      switch(promptData.card_type) {
        case 'conversation_starter':
        case 'quiz':
        case 'debate':
        case 'icebreaker':
        case 'thought_provoking':
          return (
            <>
              <CardTitle title={promptData.title} />
              <CardMainContent text={promptData.question} />
            </>
          );
        
        case 'interactive_game':
          return (
            <>
              <CardTitle title={promptData.title} />
              <CardMainContent text={promptData.action_prompt} />
            </>
          );
          
        default:
          // Fallback for legacy cards or unknown types
          return (
            <>
              <CardTitle title={promptData.title} />
              {promptData.instructions && (
                <CardSection title="Instructions">
                  <Text style={styles.cardSectionText}>{promptData.instructions}</Text>
                </CardSection>
              )}
              <CardMainContent text={promptData.question} />
            </>
          );
      }
    };
    
    // Determine what content to show on the back based on card type
    const renderBackContent = () => {
      switch(promptData.card_type) {
        case 'conversation_starter':
          return (
            <>
              <CardTitle title={promptData.title} />
              {promptData.followups && promptData.followups.length > 0 ? (
                <CardSection title="Follow-up Questions">
                  {promptData.followups.map((followup, index) => (
                    <CardListItem key={index} text={followup} />
                  ))}
                </CardSection>
              ) : (
                <CardMainContent text="This conversation starter is designed to spark meaningful discussion. Take turns sharing your thoughts!" />
              )}
            </>
          );
        
        case 'interactive_game':
          return (
            <>
              <CardTitle title={promptData.title} />
              <CardSection title="Instructions">
                <Text style={styles.cardSectionText}>{promptData.instructions}</Text>
              </CardSection>
            </>
          );
        
        case 'quiz':
          return (
            <>
              <CardTitle title={promptData.title} />
              {promptData.options && promptData.options.length > 0 && (
                <CardSection title="Options">
                  {promptData.options.map((option, index) => (
                    <CardListItem 
                      key={index} 
                      text={option} 
                      isCorrect={promptData.correct_answer_index === index}
                      index={index}
                      useLetters={true}
                    />
                  ))}
                </CardSection>
              )}
            </>
          );
        
        case 'debate':
          return (
            <>
              <CardTitle title={promptData.title} />
              {promptData.stances && promptData.stances.length > 0 && (
                <CardSection title="Perspectives">
                  {promptData.stances.map((stance, index) => (
                    <CardListItem key={index} text={stance} />
                  ))}
                </CardSection>
              )}
            </>
          );
        
        case 'icebreaker':
          return (
            <>
              <CardTitle title={promptData.title} />
              <CardSection title="Icebreaker Tips">
                <Text style={styles.cardSectionText}>
                  This light question is perfect for starting conversations in a casual setting.
                  Keep responses brief and fun!
                </Text>
              </CardSection>
            </>
          );
        
        case 'thought_provoking':
          return (
            <>
              <CardTitle title={promptData.title} />
              {promptData.followups && promptData.followups.length > 0 && (
                <CardSection title="Deeper Questions">
                  {promptData.followups.map((followup, index) => (
                    <CardListItem key={index} text={followup} />
                  ))}
                </CardSection>
              )}
            </>
          );
          
        default:
          // Fallback for legacy cards or unknown types
          return (
            <>
              <CardTitle title={promptData.title} />
              {promptData.options && promptData.options.length > 0 && (
                <CardSection title="Options">
                  {promptData.options.map((option, index) => (
                    <CardListItem key={index} text={option} index={index} useLetters={true} />
                  ))}
                </CardSection>
              )}
              {promptData.stances && promptData.stances.length > 0 && (
                <CardSection title="Perspectives">
                  {promptData.stances.map((stance, index) => (
                    <CardListItem key={index} text={stance} />
                  ))}
                </CardSection>
              )}
              {promptData.followups && promptData.followups.length > 0 && (
                <CardSection title="Follow-up Questions">
                  {promptData.followups.map((followup, index) => (
                    <CardListItem key={index} text={followup} />
                  ))}
                </CardSection>
              )}
            </>
          );
      }
    };
    
    return (
      <View style={styles.deckContainer}>
        {/* Current card (animated and swipeable) */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.9}
              onPress={toggleFlip}
            >
              {!isFlipped ? (
                // Front of card
                <Animated.View style={[styles.cardContentContainer, frontCardContentStyle]}>
                  {renderFrontContent()}
                </Animated.View>
              ) : (
                // Back of card
                <Animated.View style={[styles.cardContentContainer, backCardContentStyle]}>
                  {renderBackContent()}
                </Animated.View>
              )}
            </TouchableOpacity>
            
            {/* Card count indicator */}
            <View style={styles.cardCountContainer}>
              <Text style={styles.cardCountText}>
                {currentCardIndex + 1} of {cards.length}
              </Text>
            </View>
            
            {/* Favorite button */}
            <TouchableOpacity 
              style={styles.favoriteButton} 
              onPress={showFavoriteModal}
              activeOpacity={0.7}
            >
              {isFavorite ? (
                <Image 
                  source={require('../assets/images/prompt/favourite_select.png')} 
                  style={styles.favoriteIcon} 
                />
              ) : (
                <Image 
                  source={require('../assets/images/prompt/favourite_unselect.png')} 
                  style={styles.favoriteIcon} 
                />
              )}
            </TouchableOpacity>
            
            {/* Back arrow button - only visible if not on first card */}
            {currentCardIndex > 0 && (
              <TouchableOpacity 
                style={styles.backArrowButton} 
                onPress={previousCard}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/images/prompt/back_arrow.png')} 
                  style={styles.backArrowIcon} 
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  // No decks view when no conversation decks exist
  const NoDecksView = () => (
    <View style={styles.noDecksContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#5D5FEF" />
      <Text style={styles.noDecksTitle}>No Conversation Decks</Text>
      <Text style={styles.noDecksText}>You haven't created any conversation decks yet.</Text>
      <TouchableOpacity style={styles.createDeckButton} onPress={handleGenerateMore}>
        <Text style={styles.createDeckButtonText}>Create Deck</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
        <View style={styles.mainContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5D5FEF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF4D4D" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={checkForExistingDecks}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : noDecksExist ? (
            <NoDecksView />
          ) : promptData ? (
            <CardDeck />
          ) : null}
        </View>
        
        {/* Favorite Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={favoriteModalVisible}
          onRequestClose={() => setFavoriteModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setFavoriteModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Save Card</Text>
                
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={handleAddToExistingDeck}
                >
                  <Text style={styles.modalOptionText}>Add to existing deck</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={handleCreateDeck}
                >
                  <Text style={styles.modalOptionText}>Create new deck</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setFavoriteModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card deck styles
  deckContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardCountContainer: {
    position: 'absolute',
    bottom: 10,
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
    marginTop: -SCREEN_HEIGHT * 0.1, // Adjust this value to fine-tune vertical centering
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
    borderWidth: 1,
  },
  cardBadgeContainer: {
    alignSelf: 'center',
  },
  cardBadgeText: {
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
    fontSize: 16,
    lineHeight: 28,
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
  // No decks styles
  noDecksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noDecksTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
  },
  noDecksText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Petrona-Regular',
  },
  createDeckButton: {
    backgroundColor: '#5D5FEF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  createDeckButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  cardContentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    position: 'relative',
    paddingBottom: 40, // Space for tap instructions
  },
  correctAnswer: {
    color: '#38B000',
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
  favoriteIcon: {
    width: 28,
    height: 28,
  },
  backArrowButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 8,
    zIndex: 10,
  },
  backArrowIcon: {
    width: 28,
    height: 28,
  },
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
    width: '80%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
  },
  modalOption: {
    backgroundColor: '#5D5FEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
