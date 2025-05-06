import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Dimensions, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import { Card } from '../types/card';
import { CardTitle, CardSection, CardMainContent, CardListItem } from './CardElements';
import { useFontLoader } from '../hooks/useFontLoader';

// Screen dimensions for card animations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_ROTATION_ANGLE = 60;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface PromptComponentProps {
  cards: Card[];
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const router = useRouter();

  // Animation values for swiping
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const direction = useSharedValue(0);
  
  // Shared value for card stack animation
  const stackAnimValue = useSharedValue(0);
  
  // Track if we're currently animating a swipe
  const isSwipeAnimating = useSharedValue(false);

  // Get the current card safely, with fallback
  const currentCard = cards[currentCardIndex] || {
    question: 'No question available',
    title: 'Prompt',
    followups: []
  };
  
  // Get the next card (if available)
  const nextCard = currentCardIndex < cards.length - 1 
    ? cards[currentCardIndex + 1] 
    : null;

  // Reset animations when currentCardIndex changes
  useEffect(() => {
    if (!isSwipeAnimating.value) {
      translateX.value = 0;
      translateY.value = 0;
      cardOpacity.value = 1;
      stackAnimValue.value = 0;
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
    
    // Show confirmation
    Alert.alert('New Deck', 'Started creating a new deck with this card!');
  }, [cards, currentCardIndex]);

  // Enhanced swipe gesture based on the Card Swipe implementation
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      // Don't allow swiping when flipped
      if (isFlipped) return false;
      
      // Make sure we're at full opacity when starting a pan
      cardOpacity.value = 1;
      isSwipeAnimating.value = false;
      return true;
    })
    .onUpdate((e) => {
      // Only allow swipe when card isn't flipped
      if (!isFlipped) {
        // Set direction based on swipe direction (positive = right, negative = left)
        const isSwipeRight = e.translationX > 0;
        direction.value = isSwipeRight ? 1 : -1;
        
        // Allow movement in any direction
        translateX.value = e.translationX;
        translateY.value = e.translationY;
        
        // Update stack animation value based on swipe progress
        stackAnimValue.value = Math.min(
          1, 
          Math.abs(e.translationX) / (SCREEN_WIDTH * 0.6)
        );
      }
    })
    .onEnd((e) => {
      // Only process swipe end when card isn't flipped
      if (isFlipped) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        stackAnimValue.value = withTiming(0);
        return;
      }
      
      // Determine if the swipe should complete based on distance or velocity
      // This logic is enhanced from Card.tsx implementation
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 1000) {
        if (currentCardIndex < cards.length - 1) {
          isSwipeAnimating.value = true;
          
          // Animate the stack card to move forward
          stackAnimValue.value = withTiming(1, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          });
          
          // Animate the card flying off in the direction of the swipe
          // Using width as the target for consistent animation regardless of actual swipe distance
          translateX.value = withTiming(SCREEN_WIDTH * 1.5 * direction.value, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          });
          
          // Add a slight vertical component to the animation for a more natural feel
          translateY.value = withTiming(direction.value * 50, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          });
          
          // Fade out the card
          cardOpacity.value = withTiming(0, { 
            duration: 200 
          }, (finished) => {
            if (finished) {
              // Reset position and navigate
              translateX.value = 0;
              translateY.value = 0;
              cardOpacity.value = 1;
              stackAnimValue.value = 0;
              isSwipeAnimating.value = false;
              runOnJS(goToNextCard)();
            }
          });
        } else {
          // If it's the last card, bounce back
          translateX.value = withSpring(0, {
            stiffness: 200,
            damping: 20
          });
          translateY.value = withSpring(0, {
            stiffness: 200,
            damping: 20
          });
          stackAnimValue.value = withTiming(0);
        }
      } else {
        // Return the card to center with a spring effect if the swipe wasn't far enough
        translateX.value = withSpring(0, {
          stiffness: 200,
          damping: 20
        });
        translateY.value = withSpring(0, {
          stiffness: 200,
          damping: 20
        });
        stackAnimValue.value = withTiming(0);
      }
    });

  // Enhanced animated style for the card - based on Card Swipe implementation
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Calculate rotation based on horizontal movement
    // This provides a more natural rotation effect similar to Card.tsx
    const rotateZ = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-CARD_ROTATION_ANGLE / 3, 0, CARD_ROTATION_ANGLE / 3],
      Extrapolation.CLAMP
    );

    // Add subtle scale effect based on movement distance
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH / 4],
      [1, 0.97],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
        { scale },
      ],
      opacity: cardOpacity.value,
      zIndex: 2,
    };
  });
  
  // Animated style for the next card in the stack
  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    // As the current card moves away, the next card should:
    // 1. Scale up to become the new primary card
    // 2. Move up slightly to take the position of the current card
    const scale = interpolate(
      stackAnimValue.value,
      [0, 1],
      [0.92, 1],
      Extrapolation.CLAMP
    );
    
    const translateY = interpolate(
      stackAnimValue.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { scale },
        { translateY },
      ],
      opacity: nextCard ? 1 : 0, // Only show if there's a next card
      zIndex: 1,
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
  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Render card content based on card type
  const renderCardContent = (card: Card | null, isFront = true) => {
    if (!card) return null;
    
    if (isFront) {
      switch(card.card_type) {
        case 'deep_conversations':
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
        
        case 'fun_challenges':
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
          
        case 'creative_prompts':
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
          
        case 'light_conversation':
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
          
        case 'hot_takes':
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
          
        case 'personality_quizzes':
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
          
        default:
          // Fallback for legacy cards or unknown types
          return (
            <>
              <CardTitle title={card.title} />
              <CardMainContent text={card.question} />
            </>
          );
      }
    } else {
      // Back side content
      switch(card.card_type) {
        case 'deep_conversations':
          return (
            <>
              <CardTitle title={card.title} />
              <CardSection title="Reflection">
                <Text style={styles.cardSectionText}>{card.reflection}</Text>
              </CardSection>
              
              {card.followups && card.followups.length > 0 && (
                <CardSection title="Follow-up Questions">
                  {card.followups.map((followup: string, index: number) => (
                    <CardListItem key={index} text={followup} />
                  ))}
                </CardSection>
              )}
            </>
          );
        
        case 'fun_challenges':
          return (
            <>
              <CardTitle title={card.title} />
              <CardSection title="Twist">
                <Text style={styles.cardSectionText}>{card.twist}</Text>
              </CardSection>
            </>
          );
        
        case 'creative_prompts':
          return (
            <>
              <CardTitle title={card.title} />
              <CardSection title="Bonus">
                <Text style={styles.cardSectionText}>{card.bonus}</Text>
              </CardSection>
            </>
          );
        
        case 'light_conversation':
          return (
            <>
              <CardTitle title={card.title} />
              {card.bonus && (
                <CardSection title="Bonus">
                  <Text style={styles.cardSectionText}>{card.bonus}</Text>
                </CardSection>
              )}
            </>
          );
        
        case 'hot_takes':
          return (
            <>
              <CardTitle title={card.title} />
              <CardSection title="Perspectives">
                <CardListItem text={card.perspective1 || ''} />
                <CardListItem text={card.perspective2 || ''} />
              </CardSection>
              
              {card.debate_twist && (
                <CardSection title="Debate Twist">
                  <Text style={styles.cardSectionText}>{card.debate_twist}</Text>
                </CardSection>
              )}
            </>
          );
        
        case 'personality_quizzes':
          return (
            <>
              <CardTitle title={card.title} />
              <CardSection title="Group Vote">
                <Text style={styles.cardSectionText}>{card.group_vote}</Text>
              </CardSection>
              <CardSection title="Reveal">
                <Text style={styles.cardSectionText}>{card.reveal}</Text>
              </CardSection>
            </>
          );
        
        default:
          // Fallback for legacy cards or unknown types
          return (
            <>
              <CardTitle title={card.title} />
              
              {card.followups && card.followups.length > 0 && (
                <CardSection title="Follow-up Questions">
                  {card.followups.map((followup: string, index: number) => (
                    <CardListItem key={index} text={followup} />
                  ))}
                </CardSection>
              )}
            </>
          );
      }
    }
  };

  // Determine what content to show based on card type for the current card
  const renderFrontContent = () => renderCardContent(currentCard, true);
  
  // Determine what content to show on the back based on card type for the current card
  const renderBackContent = () => renderCardContent(currentCard, false);

  // Add a hint text for user guidance
  const renderSwipeHint = () => {
    if (currentCardIndex < cards.length - 1 && !isFlipped) {
      return (
        <View style={styles.swipeHintContainer}>
          <Text style={styles.swipeHintText}>Swipe to see next prompt</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <View style={styles.mainContainer}>
        {/* Stack Card (Next Card) */}
        {nextCard && !isFlipped && (
          <Animated.View style={[styles.nextCardContainer, nextCardAnimatedStyle]}>
            <View style={styles.nextCard}>
              {renderCardContent(nextCard, true)}
            </View>
          </Animated.View>
        )}
        
        {/* Current Card with Gesture */}
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
                </TouchableOpacity>
              )}
              
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
        
        {/* Swipe hint */}
        {renderSwipeHint()}
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
    borderColor: '#E0E0E0',
  },
  nextCardContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -SCREEN_HEIGHT * 0.1,
  },
  nextCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  swipeHintContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  swipeHintText: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Petrona-Regular',
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
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
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
  correctAnswer: {
    fontWeight: 'bold',
  },
}); 