import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Image
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS, 
  interpolate,
  Extrapolation,
  withSpring,
  useAnimatedReaction,
  Easing
} from 'react-native-reanimated';
import { Card } from '../types/card';

// Screen dimensions for card animations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const MAX_VISIBLE_CARDS = 3;
const FLY_OFF_DURATION = 600;

interface AnimatedCardStackProps {
  cards: Card[];
  currentCardIndex: number;
  onChangeCard: (newIndex: number) => void;
  isFlipped: boolean;
  toggleFlip: () => void;
  isFavorite: boolean;
  toggleFavorite: () => void;
  showFavoriteModal: () => void;
  renderFrontContent: (card: Card) => React.ReactNode;
  renderBackContent: (card: Card) => React.ReactNode;
}

export default function AnimatedCardStack({
  cards,
  currentCardIndex,
  onChangeCard,
  isFlipped,
  toggleFlip,
  isFavorite,
  toggleFavorite,
  showFavoriteModal,
  renderFrontContent,
  renderBackContent
}: AnimatedCardStackProps) {
  // Animation values
  const animatedValue = useSharedValue(currentCardIndex);
  const [swipedCardIndices, setSwipedCardIndices] = useState<number[]>([]);
  
  // Update animatedValue when currentCardIndex changes
  useEffect(() => {
    animatedValue.value = currentCardIndex;
    // Reset swiped cards when the current index changes (except for the just swiped card)
    setSwipedCardIndices(prev => 
      prev.filter(idx => idx === currentCardIndex - 1)
    );
  }, [currentCardIndex]);

  // Function to go to next card
  const goToNextCard = (index: number) => {
    if (index < cards.length - 1) {
      // Mark the current card as swiped
      setSwipedCardIndices(prev => [...prev, index]);
      // Wait a tiny bit to let the swiped state propagate
      setTimeout(() => {
        onChangeCard(index + 1);
      }, 50);
    }
  };

  // Function to go to previous card
  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      onChangeCard(currentCardIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      {cards.map((item, index) => {
        // Only render cards that are visible and not swiped away
        if (index < currentCardIndex || index > currentCardIndex + MAX_VISIBLE_CARDS - 1) {
          return null;
        }
        
        // Check if this card has been swiped
        const isSwiped = swipedCardIndices.includes(index);
        if (isSwiped) {
          return null;
        }

        return (
          <CardItem
            key={index}
            item={item}
            index={index}
            currentCardIndex={currentCardIndex}
            animatedValue={animatedValue}
            goToNextCard={goToNextCard}
            goToPreviousCard={goToPreviousCard}
            isFlipped={isFlipped && index === currentCardIndex}
            toggleFlip={toggleFlip}
            isFavorite={isFavorite && index === currentCardIndex}
            showFavoriteModal={showFavoriteModal}
            renderFrontContent={renderFrontContent}
            renderBackContent={renderBackContent}
            cardsLength={cards.length}
          />
        );
      })}
    </View>
  );
}

interface CardItemProps {
  item: Card;
  index: number;
  currentCardIndex: number;
  animatedValue: Animated.SharedValue<number>;
  goToNextCard: (index: number) => void;
  goToPreviousCard: () => void;
  isFlipped: boolean;
  toggleFlip: () => void;
  isFavorite: boolean;
  showFavoriteModal: () => void;
  renderFrontContent: (card: Card) => React.ReactNode;
  renderBackContent: (card: Card) => React.ReactNode;
  cardsLength: number;
}

function CardItem({
  item,
  index,
  currentCardIndex,
  animatedValue,
  goToNextCard,
  goToPreviousCard,
  isFlipped,
  toggleFlip,
  isFavorite,
  showFavoriteModal,
  renderFrontContent,
  renderBackContent,
  cardsLength
}: CardItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const direction = useSharedValue(0);
  const isCurrentCard = index === currentCardIndex;
  const isSwipedOff = useSharedValue(false);
  const cardOpacity = useSharedValue(1);

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

  const pan = Gesture.Pan()
    .onBegin(() => {
      // Allow swiping regardless of flip state
      return true;
    })
    .onUpdate(e => {
      if (isCurrentCard) {
        // Determine swipe direction (1 for right, -1 for left)
        const isSwipeRight = e.translationX > 0;
        direction.value = isSwipeRight ? 1 : -1;

        // Allow translation in any direction
        translateX.value = e.translationX;
        translateY.value = e.translationY;

        // Update animated value for stack effect
        animatedValue.value = interpolate(
          Math.abs(e.translationX),
          [0, SCREEN_WIDTH],
          [index, index + 1],
        );
      }
    })
    .onEnd(e => {
      if (isCurrentCard) {
        // Calculate total swipe distance (Pythagorean theorem)
        const swipeDistance = Math.sqrt(
          Math.pow(e.translationX, 2) + 
          Math.pow(e.translationY, 2)
        );
        
        // Calculate total velocity
        const velocity = Math.sqrt(
          Math.pow(e.velocityX, 2) + 
          Math.pow(e.velocityY, 2)
        );
        
        const shouldSwipe = 
          swipeDistance > SWIPE_THRESHOLD || 
          velocity > 800;

        if (shouldSwipe && currentCardIndex < cardsLength - 1) {
          // If card is flipped, flip it back first then perform the swipe animation
          if (isFlipped) {
            runOnJS(toggleFlip)();
          }

          // Determine the direction for the animation based on the existing movement
          const angle = Math.atan2(e.translationY, e.translationX);
          const distance = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 1.5;
          const targetX = Math.cos(angle) * distance;
          const targetY = Math.sin(angle) * distance;
          
          // Create a smoother fly-off animation
          translateX.value = withTiming(targetX, { 
            duration: FLY_OFF_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1) // Smooth cubic bezier curve
          });
          
          translateY.value = withTiming(targetY, { 
            duration: FLY_OFF_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1) // Smooth cubic bezier curve
          });
          
          // Gradually fade out the card
          cardOpacity.value = withTiming(0, {
            duration: FLY_OFF_DURATION,
            easing: Easing.out(Easing.ease)
          }, () => {
            // Only mark as swiped off after animation completes
            isSwipedOff.value = true;
            runOnJS(goToNextCard)(currentCardIndex);
          });
          
          // Update animated value for stack effect
          animatedValue.value = withTiming(currentCardIndex + 1, {
            duration: FLY_OFF_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          });
        } else {
          // Return to center
          translateX.value = withSpring(0, {
            stiffness: 200,
            damping: 20
          });
          translateY.value = withSpring(0, {
            stiffness: 200,
            damping: 20
          });
          
          // Reset animated value
          animatedValue.value = withTiming(currentCardIndex);
        }
      }
    });

  // Card animation style
  const cardStyle = useAnimatedStyle(() => {
    // If the card has been swiped off, keep it invisible
    if (isSwipedOff.value) {
      return {
        opacity: 0,
        zIndex: -1, // Move it below other cards
      };
    }
    
    // For non-current cards, apply the stack effect
    if (!isCurrentCard) {
      const translateY = interpolate(
        animatedValue.value,
        [index - 1, index, index + 1],
        [-30, 0, 0],
        Extrapolation.CLAMP
      );

      const scale = interpolate(
        animatedValue.value,
        [index - 1, index, index + 1],
        [0.9, 1, 1],
        Extrapolation.CLAMP
      );

      const opacity = interpolate(
        animatedValue.value,
        [index - MAX_VISIBLE_CARDS, index - MAX_VISIBLE_CARDS + 0.5],
        [0, 1],
        Extrapolation.CLAMP
      );

      return {
        transform: [
          { translateY },
          { scale },
        ],
        opacity,
        zIndex: MAX_VISIBLE_CARDS - (index - currentCardIndex),
      };
    }

    // For current card, apply swipe animation
    const rotateZ = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH],
      [0, 20],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${direction.value * rotateZ}deg` },
      ],
      opacity: cardOpacity.value, // Apply the fading effect
      zIndex: MAX_VISIBLE_CARDS,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <TouchableOpacity 
          style={styles.card}
          activeOpacity={1.0}
          onPress={isCurrentCard ? toggleFlip : undefined}
        >
          {/* Back button - show on all cards that aren't the first card, only make it interactive on current card */}
          {index > 0 && (
            <TouchableOpacity 
              style={[
                styles.backButton, 
                !isCurrentCard && { opacity: 0.6 } // Slightly dim for non-current cards
              ]} 
              onPress={isCurrentCard ? goToPreviousCard : undefined}
              activeOpacity={isCurrentCard ? 0.7 : 1}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image 
                source={require('../../assets/images/prompt/back_arrow.png')} 
                style={styles.backArrowIcon} 
              />
            </TouchableOpacity>
          )}

          {/* Front of card */}
          <Animated.View style={[styles.cardContentContainer, frontCardContentStyle]}>
            {renderFrontContent(item)}
          </Animated.View>

          {/* Back of card */}
          <Animated.View style={[styles.cardContentContainer, backCardContentStyle]}>
            {renderBackContent(item)}
          </Animated.View>
        </TouchableOpacity>

        {/* Card count indicator */}
        <View style={styles.cardCountContainer}>
          
        </View>

        {/* Favorite button - show on all cards but only make clickable on current card */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={isCurrentCard ? showFavoriteModal : undefined}
          activeOpacity={isCurrentCard ? 0.7 : 1}
        >
          <Image 
            source={isFavorite 
              ? require('../../assets/images/prompt/favourite_select.png')
              : require('../../assets/images/prompt/favourite_unselect.png')} 
            style={[
              styles.favoriteIcon,
              !isCurrentCard && { opacity: 0.6 } // Slightly dim for non-current cards
            ]} 
          />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
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
    borderColor: '#E5E5E5',
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
    top: 18,
    left: 18,
    zIndex: 10,
  },
  backArrowIcon: {
    width: 28,
    height: 28,
  },
}); 