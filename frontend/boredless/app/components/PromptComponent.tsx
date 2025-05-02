import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Dimensions, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation,
  Easing
} from 'react-native-reanimated';

// Screen dimensions for card animations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_ROTATION_ANGLE = 60;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface PromptComponentProps {
  cards: {
    prompt: string;
    title: string;
    followups: string[];
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
  }[];
  currentCardIndex: number;
  onClose: () => void;
  onChangeCard?: (newIndex: number) => void;
}

export default function PromptComponent({ 
  cards, 
  currentCardIndex, 
  onClose,
  onChangeCard 
}: PromptComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const router = useRouter();

  // Animation values for swiping
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  
  // Track if we're currently animating a swipe
  const isSwipeAnimating = useSharedValue(false);

  // Get the current card safely, with fallback
  const currentCard = cards[currentCardIndex] || {
    prompt: 'No prompt available',
    title: 'Prompt',
    followups: []
  };

  // Reset animations when currentCardIndex changes
  useEffect(() => {
    if (!isSwipeAnimating.value) {
      translateX.value = 0;
      translateY.value = 0;
      cardOpacity.value = 1;
      setIsFlipped(false);
    }
  }, [currentCardIndex]);

  // Function to go to next card
  const goToNextCard = useCallback(() => {
    if (currentCardIndex < cards.length - 1) {
      onChangeCard?.(currentCardIndex + 1);
    }
  }, [cards.length, currentCardIndex, onChangeCard]);

  // Function to go to previous card
  const goToPreviousCard = useCallback(() => {
    if (currentCardIndex > 0) {
      onChangeCard?.(currentCardIndex - 1);
    }
  }, [currentCardIndex, onChangeCard]);

  // Function to toggle card flip
  const toggleFlip = () => {
    // Only flip if we're not in the middle of a swipe
    if (Math.abs(translateX.value) < 10 && Math.abs(translateY.value) < 10) {
      // Reset any swipe translation when flipping
      translateX.value = 0;
      translateY.value = 0;
      
      // Toggle flip state
      setIsFlipped(!isFlipped);
    }
  };

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
    console.log('Adding card to existing deck:', cards[currentCardIndex]);
    setFavoriteModalVisible(false);
    
    // Show confirmation
    Alert.alert('Added', 'Card has been added to existing deck!');
  }, [cards, currentCardIndex]);
  
  // Function to handle creating a new deck
  const handleCreateDeck = useCallback(() => {
    // Logic for creating a new deck would go here
    console.log('Creating new deck with card:', cards[currentCardIndex]);
    setFavoriteModalVisible(false);
    
    // Navigate to create deck screen (this could be a new route)
    // router.push('/create-deck');
    
    // For now, show confirmation
    Alert.alert('New Deck', 'Started creating a new deck with this card!');
  }, [cards, currentCardIndex]);

  // Define the swipe gesture - swipe in any direction to advance
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      // Don't allow swiping when flipped
      if (isFlipped) return false;
      
      // Make sure we're at full opacity when starting a pan
      cardOpacity.value = 1;
      isSwipeAnimating.value = false;
      return true;
    })
    .onUpdate((event) => {
      // Only allow swipe when card isn't flipped
      if (!isFlipped) {
        // Allow movement in any direction
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
      
      // Calculate total swipe distance (Pythagorean theorem)
      const swipeDistance = Math.sqrt(
        Math.pow(event.translationX, 2) + 
        Math.pow(event.translationY, 2)
      );
      
      // Calculate total velocity
      const velocity = Math.sqrt(
        Math.pow(event.velocityX, 2) + 
        Math.pow(event.velocityY, 2)
      );
      
      const shouldSwipe = 
        swipeDistance > SWIPE_THRESHOLD || 
        velocity > 800;

      if (shouldSwipe && currentCardIndex < cards.length - 1) {
        // Determine the direction for the animation based on the existing movement
        const angle = Math.atan2(event.translationY, event.translationX);
        const distance = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 1.5;
        const targetX = Math.cos(angle) * distance;
        const targetY = Math.sin(angle) * distance;
        
        isSwipeAnimating.value = true;
        
        // Animate the card flying off in the direction of the swipe
        translateX.value = withTiming(targetX, { 
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        
        translateY.value = withTiming(targetY, { 
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        
        cardOpacity.value = withTiming(0, { 
          duration: 200 
        }, (finished) => {
          if (finished) {
            // Reset position and navigate
            translateX.value = 0;
            translateY.value = 0;
            cardOpacity.value = 1;
            isSwipeAnimating.value = false;
            runOnJS(goToNextCard)();
          }
        });
      } else {
        // Return the card to center with a spring effect
        translateX.value = withSpring(0, {
          stiffness: 200,
          damping: 20
        });
        translateY.value = withSpring(0, {
          stiffness: 200,
          damping: 20
        });
      }
    });

  // Animated style for the card - IMPROVED for smoother animation
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Calculate rotation based on horizontal movement - less extreme rotation
    const swipeRotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-CARD_ROTATION_ANGLE / 2, 0, CARD_ROTATION_ANGLE / 2],
      Extrapolation.CLAMP
    );

    // Add subtle scale effect based on movement
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH / 4],
      [1, 0.95],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${swipeRotation}deg` },
        { scale },
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
      <View style={styles.mainContainer}>
        
        
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.9}
              onPress={toggleFlip}
            >
            {/* Back button - only show if we're not on the first card */}
            {currentCardIndex > 0 && (
            <TouchableOpacity 
                style={styles.backButton} 
                onPress={goToPreviousCard}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
                <Image 
                source={require('../../assets/images/prompt/back_arrow.png')} 
                style={styles.backArrowIcon} 
                />
            </TouchableOpacity>)}
              {!isFlipped ? (
                // Front of card
                <Animated.View style={[styles.cardContentContainer, frontCardContentStyle]}>
                  {currentCard.title && (
                    <View style={styles.cardBadgeContainer}>
                      <Text style={styles.cardBadgeText}>{currentCard.title}</Text>
                    </View>
                  )}
                  <View style={styles.cardMainContent}>
                    <Text style={styles.cardMainText}>{currentCard.prompt}</Text>
                  </View>
                </Animated.View>
              ) : (
                // Back of card
                <Animated.View style={[styles.cardContentContainer, backCardContentStyle]}>
                  {currentCard.title && (
                    <View style={styles.cardBadgeContainer}>
                      <Text style={styles.cardBadgeText}>{currentCard.title}</Text>
                    </View>
                  )}
                  {currentCard.followups && currentCard.followups.length > 0 ? (
                    <View style={styles.cardSection}>
                      <Text style={styles.cardSectionTitle}>Follow-up Questions:</Text>
                      {currentCard.followups.map((followup, index) => (
                        <Text key={index} style={styles.cardListItem}>• {followup}</Text>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.cardMainContent}>
                      <Text style={styles.cardMainText}>
                        This conversation starter is designed to spark meaningful discussion. Take turns sharing your thoughts!
                      </Text>
                    </View>
                  )}
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
                  source={require('../../assets/images/prompt/favourite_select.png')} 
                  style={styles.favoriteIcon} 
                />
              ) : (
                <Image 
                  source={require('../../assets/images/prompt/favourite_unselect.png')} 
                  style={styles.favoriteIcon} 
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
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
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: -SCREEN_HEIGHT * 0.1,
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
  cardListItem: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Petrona-Regular',
    marginBottom: 6,
    paddingLeft: 8,
  },
  cardContentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    position: 'relative',
    paddingBottom: 40,
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
    fontFamily: 'Petrona-Bold',
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
    fontFamily: 'Petrona-Regular',
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
    fontFamily: 'Petrona-Regular',
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
  backButton: {
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
}); 