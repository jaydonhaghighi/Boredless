import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, 
  Dimensions, Alert, Pressable, ActivityIndicator, ImageBackground
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import Animated, { 
  useSharedValue,
  useAnimatedStyle, 
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useBottomSheet } from '../context/BottomSheetContext';
import { useCurrentGeneration, useBottomSheetVisibility } from '../context/TabContext';
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
  const { bottomSheetRef } = useBottomSheet();
  const { generationState } = useCurrentGeneration();
  const { 
    isVisible, 
    bottomSheetRef: visibilitySheetRef, 
    setIsGeneratingSheetState,
    cardsInSheet,
    initialCardIndexInSheet
  } = useBottomSheetVisibility();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 55;
  const snapPoints = useMemo(() => [`12%`, `100%`], [screenHeight]);

  const animatedPosition = useSharedValue(0);
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animatedPosition.value, [screenHeight * 0.79, screenHeight * 0.81], [1, 0], Extrapolation.CLAMP);
    return { backgroundColor: `rgba(255, 255, 255, ${opacity})`, borderRadius: 24 };
  });
  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animatedPosition.value, [screenHeight * 0.79, screenHeight * 0.81], [0, 1], Extrapolation.CLAMP);
    return { opacity, flex: 1, width: '100%' };
  });
  
  useEffect(() => {
    if (!isVisible) {
      // If sheet becomes not visible, ensure cards from deck view are cleared from TabContext
      // This is already handled by hideBottomSheet in TabContext, but good to be aware
      return;
    }

    // Reset current card index when new cards are loaded
    setCurrentCardIndex(initialCardIndexInSheet);

    // Determine target snap index and card index based on available data
    let targetSnapIndex = 0; // Default to 12% (preview)
    let newCardIndex = initialCardIndexInSheet;
    let effectivelyDisplayingCards = false;

    if (cardsInSheet && cardsInSheet.length > 0) {
      newCardIndex = initialCardIndexInSheet;
      targetSnapIndex = 1; // 100%
      effectivelyDisplayingCards = true;
      setIsGeneratingSheetState(false);
    } else if (generationState.isGeneratingCards) {
      targetSnapIndex = 0; // 12% - Show loading in handle
      effectivelyDisplayingCards = false; // Or true if PromptComponent shows its own loader
      // setIsGeneratingSheetState(true); // This is set by CurrentGenerationProvider
    } else if (generationState.generatedCards && generationState.generatedCards.length > 0) {
      newCardIndex = 0;
      targetSnapIndex = 1; // 100%
      effectivelyDisplayingCards = true;
      setIsGeneratingSheetState(false);
    } else {
      // No cards from deck, not generating, and no AI cards - stay at 12% or show error preview
      targetSnapIndex = 0;
      effectivelyDisplayingCards = false;
      setIsGeneratingSheetState(false);
      if (generationState.error) {
        // Alerting error here might be redundant if PromptComponent also shows it.
        // Consider if Alert is needed or if UI just reflects error state.
        // Alert.alert('Generation Error', generationState.error);
      }
    }
    
    setCurrentCardIndex(newCardIndex);
    
    // Snap to the determined index
    // Using a small timeout can sometimes help prevent race conditions with sheet rendering
    setTimeout(() => {
        if (visibilitySheetRef.current) {
            visibilitySheetRef.current.snapToIndex(targetSnapIndex);
        }
    }, 50); // Reduced timeout slightly

  }, [
    isVisible, 
    cardsInSheet, 
    initialCardIndexInSheet, 
    generationState.isGeneratingCards, 
    generationState.generatedCards, 
    generationState.error, 
    // visibilitySheetRef, // Ref usually doesn't need to be in dep array
    // setIsGeneratingSheetState // Setter usually doesn't need to be in dep array
  ]);

  const handleChangeCard = React.useCallback((newIndex: number) => {
    setCurrentCardIndex(newIndex);
  }, []);

  const handleClosePromptDisplay = () => {
    setCurrentCardIndex(0);
    if (visibilitySheetRef.current) {
      visibilitySheetRef.current.snapToIndex(0);
    }
  };

  const finalCardsToDisplay = cardsInSheet && cardsInSheet.length > 0 
    ? cardsInSheet 
    : generationState.generatedCards || [];

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheet
      ref={visibilitySheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      index={0}
      backdropComponent={CustomBackdrop}
      backgroundComponent={(props: BottomSheetBackgroundProps) => (
        <Animated.View style={[props.style, animatedBackgroundStyle]} />
      )}
      handleStyle={styles.sheetHandleStyle}
      enableDynamicSizing={false}
      bottomInset={TAB_BAR_HEIGHT}
      detached={false}
      handleComponent={() => (
        <View style={styles.customHandleContainer}>
          <Animated.View style={[animatedContentStyle, {width: '100%'}]}>
            {generationState.isGeneratingCards ? (
              <View style={styles.loadingContainer}>
                <ImageBackground
                  source={require('../assets/images/textures/noisy-background.jpg')}
                  style={styles.loadingBackgroundSmall}
                  imageStyle={{ opacity: 0.25, borderRadius: 5 }}
                >
                  <ActivityIndicator size="small" color="#A97C63" />
                  <Text style={styles.loadingText}>Generating your cards...</Text>
                </ImageBackground>
              </View>
            ) : finalCardsToDisplay.length > 0 ? (
              <Pressable style={styles.bottomSheetButton} onPress={() => {
                if (visibilitySheetRef.current && finalCardsToDisplay.length > 0) {
                  visibilitySheetRef.current.snapToIndex(1);
                }
              }}>
                <ImageBackground
                  source={require('../assets/images/textures/noisy-background.jpg')}
                  style={styles.cardPreviewContainer}
                  imageStyle={{ opacity: 0.25, borderRadius: 16 }}
                >
                  <View style={styles.cardPreviewInfoSection}>
                    <View style={styles.cardPreviewHeaderRow}>
                    <Text style={styles.cardPreviewTitle}>
                        {finalCardsToDisplay[currentCardIndex]?.title || 'Prompt'}
                      </Text>
                      <Text style={styles.cardPreviewCount}>
                        {currentCardIndex + 1} of {finalCardsToDisplay.length}
                      </Text>
                    </View>
                    <Text style={styles.cardPreviewText} numberOfLines={1} ellipsizeMode="tail">
                      {getCardPreviewText(finalCardsToDisplay[currentCardIndex])}
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>
            ) : (
              <View style={styles.emptyContainer}>
                <ImageBackground
                  source={require('../assets/images/textures/noisy-background.jpg')}
                  style={styles.emptyBackgroundSmall}
                  imageStyle={{ opacity: 0.25, borderRadius: 5 }}
                >
                  <Text style={styles.emptyPreviewText}>Tap 'Generate' to start</Text>
                </ImageBackground>
              </View>
            )}
          </Animated.View>
        </View>
      )}
      animatedPosition={animatedPosition}
      enableOverDrag={false}
      enableContentPanningGesture={finalCardsToDisplay.length > 0}
      enableHandlePanningGesture={finalCardsToDisplay.length > 0}
      animationConfigs={{
        duration: 300,
      }}
      onClose={() => {
      }}
    >
      <BottomSheetView style={styles.sheetContainer}>
        {finalCardsToDisplay.length > 0 && !generationState.isGeneratingCards ? (
          <PromptComponent
            cards={finalCardsToDisplay}
            currentCardIndex={currentCardIndex}
            onClose={handleClosePromptDisplay}
            onChangeCard={handleChangeCard}
          />
        ) : generationState.isGeneratingCards ? (
          <View style={styles.expandedLoadingContainer}>
            <ImageBackground
              source={require('../assets/images/textures/noisy-background.jpg')}
              style={styles.loadingBackground}
              imageStyle={{ opacity: 0.25, borderRadius: 5 }}
            >
              <ActivityIndicator size="large" color="#A97C63" />
              <Text style={styles.expandedLoadingText}>Loading cards...</Text>
            </ImageBackground>
          </View>
        ) : (
          <View style={styles.emptyContentContainer}>
            <Text style={styles.emptyContentText}>
              {generationState.error ? generationState.error : 'Use the generate button to create conversation decks'}
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
  },
  sheetHandleStyle: {
  },
  customHandleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.0)',
    height: 60,
    justifyContent: 'center',
  },
  bottomSheetButton: {
    flex: 1,
    justifyContent: 'center',
  },
  cardPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  cardPreviewInfoSection: {
    flex: 1,
  },
  cardPreviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    fontFamily: 'Petrona-Bold',
  },
  cardPreviewCount: {
    fontSize: 12,
    color: '#6C757D',
    fontFamily: 'Petrona-Regular',
  },
  cardPreviewText: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'Petrona-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  emptyPreviewText: {
    fontSize: 14,
    color: '#6C757D',
    fontFamily: 'Nunito_600SemiBold',
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContentText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    fontFamily: 'Petrona-Regular',
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#495057',
    fontFamily: 'Nunito_600SemiBold',
  },
  expandedLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#495057',
    fontFamily: 'Nunito_600SemiBold',
  },
  loadingBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingBackgroundSmall: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 8,
  },
  emptyBackgroundSmall: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 8,
  },
}); 