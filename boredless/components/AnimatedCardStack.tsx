import React, { useState, useEffect, useRef, useMemo } from 'react';
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
const REVERSE_DURATION = 350; // Duration for reverse animation
const INTERACTION_UNLOCK_PERCENT = 0.6; // Allow interactions after 60% of animation

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

// Animation state type
type AnimationState = {
  type: 'none' | 'forward' | 'backward';
  fromIndex: number;
  toIndex: number;
};

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
  
  // Animation state management
  const [animationState, setAnimationState] = useState<AnimationState>({
    type: 'none',
    fromIndex: 0,
    toIndex: 0
  });
  
  // Separate states for visual animation and interaction blocking
  const [visuallyAnimating, setVisuallyAnimating] = useState(false);
  const [interactionBlocked, setInteractionBlocked] = useState(false);
  
  // Content caching to prevent jumps
  const [cachedPrevCard, setCachedPrevCard] = useState<Card | null>(null);
  const [cachedCurrentCard, setCachedCurrentCard] = useState<Card | null>(null);
  
  // Reset animation state after animation completes, but enable interactions earlier
  useEffect(() => {
    if (animationState.type !== 'none') {
      setVisuallyAnimating(true);
      setInteractionBlocked(true);
      
      // Enable interactions earlier while animations continue
      const interactionTimer = setTimeout(() => {
        setInteractionBlocked(false);
      }, REVERSE_DURATION * INTERACTION_UNLOCK_PERCENT);
      
      const animationTimer = setTimeout(() => {
        setVisuallyAnimating(false);
        setAnimationState({ type: 'none', fromIndex: 0, toIndex: 0 });
        setCachedPrevCard(null);
        setCachedCurrentCard(null);
      }, REVERSE_DURATION + 20); // Reduced from 50ms to 20ms
      
      return () => {
        clearTimeout(interactionTimer);
        clearTimeout(animationTimer);
      };
    }
  }, [animationState]);
  
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
      // Set animation state
      setAnimationState({
        type: 'forward',
        fromIndex: index,
        toIndex: index + 1
      });
      // Reduced delay for better responsiveness
      setTimeout(() => {
        onChangeCard(index + 1);
      }, 30); // Reduced from 50ms to 30ms
    }
  };

  // Function to go to previous card with animation
  const goToPreviousCard = () => {
    if (currentCardIndex > 0 && animationState.type === 'none') {
      // Cache both the previous and current card
      setCachedPrevCard(cards[currentCardIndex - 1]);
      setCachedCurrentCard(cards[currentCardIndex]);
      
      // Start backward animation
      setAnimationState({
        type: 'backward',
        fromIndex: currentCardIndex,
        toIndex: currentCardIndex - 1
      });
      
      // Reduced timing for better responsiveness
      setTimeout(() => {
        onChangeCard(currentCardIndex - 1);
      }, REVERSE_DURATION - 100); // Faster transition: reduced from -50ms to -100ms
    }
  };

  // Use the new state variables to determine animation status
  const isBackAnimation = animationState.type === 'backward';

  return (
    <View style={styles.container}>
      <View style={styles.cardStackContainer}>
        {/* Special case for backward animation */}
        {isBackAnimation && cachedPrevCard && cachedCurrentCard && (
          <>
            <ReverseCard
              card={cachedPrevCard}
              renderFrontContent={renderFrontContent}
              renderBackContent={renderBackContent}
              isFlipped={false}
              isFavorite={isFavorite}
              incomingCard={true}
              index={animationState.toIndex}
            />
            <ExitCard
              card={cachedCurrentCard}
              renderFrontContent={renderFrontContent}
              renderBackContent={renderBackContent}
              isFlipped={isFlipped}
              isFavorite={isFavorite}
            />
          </>
        )}
        
        {/* Render the regular cards */}
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

          // If we're animating backward and this is the current or target card, don't render it
          if (isBackAnimation && (index === currentCardIndex || index === animationState.toIndex)) {
            return null;
          }

          // If we're animating backward and this card is behind the animation cards, adjust positioning
          const shouldAdjustForAnimation = isBackAnimation && index > currentCardIndex;

          return (
            <CardItem
              key={index}
              item={item}
              index={shouldAdjustForAnimation ? index + 1 : index}
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
              visuallyAnimating={visuallyAnimating}
              interactionBlocked={interactionBlocked}
            />
          );
        })}
      </View>
    </View>
  );
}

// New component for the card that exits during reverse animation
function ExitCard({
  card, 
  renderFrontContent, 
  renderBackContent, 
  isFlipped,
  isFavorite
}: {
  card: Card,
  renderFrontContent: (card: Card) => React.ReactNode,
  renderBackContent: (card: Card) => React.ReactNode,
  isFlipped: boolean,
  isFavorite: boolean
}) {
  const translateX = useSharedValue(0); // Start in the center
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1); // Start at normal scale
  const opacity = useSharedValue(1); // Start fully visible
  
  // Card exit animation
  useEffect(() => {
    // No horizontal movement
    translateX.value = withTiming(0, {
      duration: REVERSE_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Move upward slightly to match next-card position in stack
    translateY.value = withTiming(-30, {
      duration: REVERSE_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Scale down to match next card in stack appearance
    scale.value = withTiming(0.9, {
      duration: REVERSE_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Maintain full opacity
    opacity.value = 1;
  }, []);
  
  // Card animation styles
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: 500, // Below the incoming card but above other cards
    };
  });
  
  // Memoize card content to prevent re-rendering during animation
  const cardContent = useMemo(() => {
    return (
      <View style={styles.card}>
        {/* Back button */}
        <View style={styles.backButton}>
          <Image 
            source={require('../assets/images/prompt/back_arrow.png')} 
            style={styles.backArrowIcon} 
          />
        </View>

        {/* Card content */}
        <View style={styles.cardContentContainer}>
          {isFlipped ? renderBackContent(card) : renderFrontContent(card)}
        </View>
      </View>
    );
  }, [card.title, card.question, isFlipped]);
  
  return (
    <Animated.View style={[styles.cardContainer, cardStyle]}>
      {cardContent}
      
      {/* Card count indicator */}
      <View style={styles.cardCountContainer}></View>

      {/* Favorite button */}
      <View style={styles.favoriteButton}>
        <Image 
          source={isFavorite 
            ? require('../assets/images/prompt/favourite_select.png')
            : require('../assets/images/prompt/favourite_unselect.png')} 
          style={styles.favoriteIcon} 
        />
      </View>
    </Animated.View>
  );
}

// Component for the reverse card animation
function ReverseCard({
  card, 
  renderFrontContent, 
  renderBackContent, 
  isFlipped,
  isFavorite,
  incomingCard = false,
  index
}: {
  card: Card,
  renderFrontContent: (card: Card) => React.ReactNode,
  renderBackContent: (card: Card) => React.ReactNode,
  isFlipped: boolean,
  isFavorite: boolean,
  incomingCard?: boolean,
  index: number
}) {
  const translateX = useSharedValue(SCREEN_WIDTH * 0.8); // Start from right off-screen
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(5); // Initial rotation
  const scale = useSharedValue(0.95); // Initial scale
  
  // Card entry animation
  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: REVERSE_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    rotation.value = withTiming(0, {
      duration: REVERSE_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    scale.value = withTiming(1, {
      duration: REVERSE_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);
  
  // Card animation styles
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      zIndex: 1000, // Make sure it's above everything else
    };
  });
  
  // Memoize card content to prevent re-rendering during animation
  const cardContent = useMemo(() => {
    // Check if this is the first card (index 0)
    const isFirstCard = index === 0;
    
    return (
      <View style={styles.card}>
        {/* Back button - only show if not the first card */}
        {!isFirstCard && (
          <View style={styles.backButton}>
            <Image 
              source={require('../assets/images/prompt/back_arrow.png')} 
              style={styles.backArrowIcon} 
            />
          </View>
        )}

        {/* Card content - front only for reverse animation */}
        <View style={styles.cardContentContainer}>
          {renderFrontContent(card)}
        </View>
      </View>
    );
  }, [card.title, card.question, index]); // Include index in the dependencies
  
  return (
    <Animated.View style={[styles.cardContainer, cardStyle]}>
      {cardContent}
      
      {/* Card count indicator */}
      <View style={styles.cardCountContainer}></View>

      {/* Favorite button */}
      <View style={styles.favoriteButton}>
        <Image 
          source={isFavorite 
            ? require('../assets/images/prompt/favourite_select.png')
            : require('../assets/images/prompt/favourite_unselect.png')} 
          style={styles.favoriteIcon} 
        />
      </View>
    </Animated.View>
  );
}

// Update CardItemProps to include new animation state props
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
  visuallyAnimating: boolean;
  interactionBlocked: boolean;
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
  cardsLength,
  visuallyAnimating,
  interactionBlocked
}: CardItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const direction = useSharedValue(0);
  const isCurrentCard = index === currentCardIndex;
  const isSwipedOff = useSharedValue(false);
  const cardOpacity = useSharedValue(1);

  // Use interactionBlocked instead of isAnimating for gesture control
  const pan = Gesture.Pan()
    .enabled(!interactionBlocked && isCurrentCard)
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
          onPress={isCurrentCard && !interactionBlocked ? toggleFlip : undefined}
          disabled={interactionBlocked}
        >
          {/* Back button - show on all cards that aren't the first card, only make it interactive on current card */}
          {index > 0 && (
            <TouchableOpacity 
              style={[
                styles.backButton, 
                !isCurrentCard && { opacity: 0.6 }, // Slightly dim for non-current cards
              ]} 
              onPress={isCurrentCard && !interactionBlocked ? goToPreviousCard : undefined}
              activeOpacity={isCurrentCard && !interactionBlocked ? 0.7 : 1}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              disabled={interactionBlocked}
            >
              <Image 
                source={require('../assets/images/prompt/back_arrow.png')} 
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
          onPress={isCurrentCard && !interactionBlocked ? showFavoriteModal : undefined}
          activeOpacity={isCurrentCard && !interactionBlocked ? 0.7 : 1}
          disabled={interactionBlocked}
        >
          <Image 
            source={isFavorite 
              ? require('../assets/images/prompt/favourite_select.png')
              : require('../assets/images/prompt/favourite_unselect.png')} 
            style={[
              styles.favoriteIcon,
              !isCurrentCard && { opacity: 0.6 }, // Slightly dim for non-current cards
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
    width: '100%',
    height: '100%',
    transform: [{translateY: -50}], // Directly shift up to visually center
  },
  cardStackContainer: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center',     // Center content horizontally
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.5, // Reduce card height to 50% of screen
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    // Position is absolute but container is set to full dimensions and centered
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
    zIndex: 20,
  },
  backArrowIcon: {
    width: 28,
    height: 28,
  },
}); 