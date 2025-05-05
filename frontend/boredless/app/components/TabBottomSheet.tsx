import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue,
  useAnimatedStyle, 
  interpolate,
  Extrapolation,
  withTiming,
  Easing 
} from 'react-native-reanimated';
import { useBottomSheet } from '../context/BottomSheetContext';
import { useGenerateContext } from '../(tabs)/_layout';
import { useBottomSheetVisibility } from '../(tabs)/_layout';
import PromptComponent from './PromptComponent';
import { Card } from '../types/card';
import { CustomBackdrop } from './CustomBackdrop';

/**
 * Gets the preview text to display in the bottom sheet based on card type
 */
const getCardPreviewText = (card: Card): string => {
  if (!card) return '';
  
  switch(card.card_type) {
    case 'deep_conversations':
    case 'light_conversation':
    case 'hot_takes':
    case 'personality_quizzes':
      return card.question || '';
      
    case 'fun_challenges':
      return card.twist || card.question || '';
      
    case 'creative_prompts':
      return card.question || '';
      
    default:
      return card.question || '';
  }
};

/**
 * TabBottomSheet component for displaying generated prompts
 * Extracted from _layout.tsx to improve organization
 */
export const TabBottomSheet = () => {
  const { bottomSheetRef, closeBottomSheet } = useBottomSheet();
  const router = useRouter();
  const { generatePrompt } = useGenerateContext();
  const { isVisible, isGenerating, setIsGenerating } = useBottomSheetVisibility();
  const [cards, setCards] = React.useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  
  // Get screen dimensions to calculate the height excluding the tab bar
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 55;
  
  // Set snap points to percentages that leave space for the tab bar
  const snapPoints = useMemo(() => {
    const availableHeight = screenHeight - TAB_BAR_HEIGHT;
    return [`12%`, `100%`];
  }, [screenHeight]);

  // Shared value for tracking the sheet position
  const animatedPosition = useSharedValue(0);

  // Simplified animated style for background
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedPosition.value,
      [screenHeight * 0.79, screenHeight * 0.81],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      borderRadius: 24,
    };
  });
  
  // Simplified animated style for content
  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedPosition.value,
      [screenHeight * 0.79, screenHeight * 0.81],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      flex: 1,
      width: '100%',
    };
  });
  
  // Update cards data when prompt is generated
  React.useEffect(() => {
    // Listen for result updates from generatePrompt
    const updateCardsFromPrompt = async () => {
      if (isVisible && isGenerating) {
        try {
          // Instead of calling generatePrompt here, we just receive the result
          const result = await generatePrompt();
          
          if (result) {
            console.log('Setting prompt data:', result);
            
            // Extract cards data from response
            let newCards;
            if (result.cards) {
              console.log('Setting all cards from result.cards:', result.cards.length);
              newCards = result.cards;
            } else {
              // If no cards array, create one with the single result
              console.log('Setting single card as array');
              newCards = [result];
            }
            
            // Add a slight delay before snapping the bottom sheet to index 1
            // This ensures the cards are fully rendered before showing them
            setTimeout(() => {
              // Only update the cards and reset the index once we're ready to display them
              setCards(newCards);
              setCurrentCardIndex(0); // Reset to first card
              
              if (bottomSheetRef.current) {
                console.log('Snapping to index 1');
                bottomSheetRef.current.snapToIndex(1);
                
                // Only set isGenerating to false after cards are set and bottom sheet is snapped
                setTimeout(() => {
                  setIsGenerating(false);
                }, 100);
              }
            }, 300);
          } else {
            // If no result, set isGenerating to false immediately
            setIsGenerating(false);
          }
        } catch (error) {
          console.error('Error retrieving prompt data:', error);
          Alert.alert('Error', 'Failed to load prompt data. Please try again.');
          setIsGenerating(false);
        }
      }
    };
    
    updateCardsFromPrompt();
  }, [isVisible, generatePrompt, isGenerating]);

  const handleChangeCard = React.useCallback((newIndex: number) => {
    console.log('Card changed to:', newIndex);
    setCurrentCardIndex(newIndex);
  }, []);

  const handleClosePrompt = () => {
    setCards([]);
    setCurrentCardIndex(0);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      index={0}
      backdropComponent={CustomBackdrop}
      backgroundComponent={({ style }) => (
        <Animated.View style={[style, animatedBackgroundStyle]} />
      )}
      handleStyle={styles.sheetHandleStyle}
      bottomInset={TAB_BAR_HEIGHT}
      detached={false}
      handleComponent={() => (
        <View style={styles.customHandleContainer}>
          <Animated.View style={[animatedContentStyle, {width: '100%'}]}>
            {cards.length > 0 ? (
              <TouchableOpacity style={styles.bottomSheetButton} onPress={() => {
                if (bottomSheetRef.current && cards.length > 0) {
                  bottomSheetRef.current.snapToIndex(1);
                }
              }}>
                <View style={styles.cardPreviewContainer}>
                  <View style={styles.cardPreviewInfoSection}>
                    <View style={styles.cardPreviewHeaderRow}>
                    <Text style={styles.cardPreviewTitle}>
                        {cards[currentCardIndex]?.title || 'Prompt'}
                      </Text>
                      <Text style={styles.cardPreviewCount}>
                        {currentCardIndex + 1} of {cards.length}
                      </Text>
                    </View>
                    <Text style={styles.cardPreviewText} numberOfLines={1} ellipsizeMode="tail">
                      {getCardPreviewText(cards[currentCardIndex])}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyContainer}/>
            )}
          </Animated.View>
        </View>
      )}
      animatedPosition={animatedPosition}
      enableOverDrag={false}
      enableDynamicSizing={false}
      enableContentPanningGesture={cards.length > 0}
      enableHandlePanningGesture={cards.length > 0}
      animationConfigs={{
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }}
      onClose={() => {
        setCards([]);
        setCurrentCardIndex(0);
        if (bottomSheetRef.current) {
          bottomSheetRef.current.snapToIndex(0);
        }
      }}
    >
      <BottomSheetView style={styles.sheetContainer}>
        {cards.length > 0 ? (
          <PromptComponent
            cards={cards}
            currentCardIndex={currentCardIndex}
            onClose={handleClosePrompt}
            onChangeCard={handleChangeCard}
          />
        ) : (
          <View style={styles.emptyContentContainer}>
            <Text style={styles.emptyContentText}>
              Use the Generate button to create conversation prompts
            </Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  sheetBackgroundStyle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  sheetHandleStyle: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: '100%',
  },
  customHandleContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  emptyContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyContentText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  bottomSheetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28282B',
    borderRadius: 12,
    marginBottom: 8,
  },
  cardPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardPreviewInfoSection: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardPreviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  cardPreviewCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  cardPreviewText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
}); 