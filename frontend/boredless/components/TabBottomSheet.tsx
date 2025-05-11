import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, 
  Dimensions, Alert, Pressable, ActivityIndicator
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
  const { isVisible, bottomSheetRef: visibilitySheetRef, setIsGeneratingSheetState } = useBottomSheetVisibility();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 55;
  const snapPoints = useMemo(() => [`12%`, `95%`], [screenHeight]);

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
    if (!isVisible) return;

    if (generationState.isGeneratingCards) {
      return;
    }

    setIsGeneratingSheetState(false);

    if (generationState.error) {
      Alert.alert('Generation Error', generationState.error);
      visibilitySheetRef.current?.snapToIndex(0);
      return;
    }

    if (generationState.generatedCards && generationState.generatedCards.length > 0) {
      setCurrentCardIndex(0);
      setTimeout(() => {
        if (visibilitySheetRef.current) {
          visibilitySheetRef.current.snapToIndex(1);
        }
      }, 100);
    } else if (!generationState.isGeneratingCards && generationState.currentFilters) {
    }
  }, [generationState.generatedCards, generationState.isGeneratingCards, generationState.error, isVisible, visibilitySheetRef, setIsGeneratingSheetState]);

  const handleChangeCard = React.useCallback((newIndex: number) => {
    setCurrentCardIndex(newIndex);
  }, []);

  const handleClosePromptDisplay = () => {
    setCurrentCardIndex(0);
    if (visibilitySheetRef.current) {
      visibilitySheetRef.current.snapToIndex(0);
    }
  };

  const cardsToDisplay = generationState.generatedCards || [];

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
      bottomInset={TAB_BAR_HEIGHT}
      detached={false}
      handleComponent={() => (
        <View style={styles.customHandleContainer}>
          <Animated.View style={[animatedContentStyle, {width: '100%'}]}>
            {generationState.isGeneratingCards ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A97C63" />
                <Text style={styles.loadingText}>Generating your cards...</Text>
              </View>
            ) : cardsToDisplay.length > 0 ? (
              <Pressable style={styles.bottomSheetButton} onPress={() => {
                if (visibilitySheetRef.current && cardsToDisplay.length > 0) {
                  visibilitySheetRef.current.snapToIndex(1);
                }
              }}>
                <View style={styles.cardPreviewContainer}>
                  <View style={styles.cardPreviewInfoSection}>
                    <View style={styles.cardPreviewHeaderRow}>
                    <Text style={styles.cardPreviewTitle}>
                        {cardsToDisplay[currentCardIndex]?.title || 'Prompt'}
                      </Text>
                      <Text style={styles.cardPreviewCount}>
                        {currentCardIndex + 1} of {cardsToDisplay.length}
                      </Text>
                    </View>
                    <Text style={styles.cardPreviewText} numberOfLines={1} ellipsizeMode="tail">
                      {getCardPreviewText(cardsToDisplay[currentCardIndex])}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <View style={styles.emptyContainer}>
                 <Text style={styles.emptyPreviewText}>Tap 'Generate' to start</Text>
              </View>
            )}
          </Animated.View>
        </View>
      )}
      animatedPosition={animatedPosition}
      enableOverDrag={false}
      enableContentPanningGesture={cardsToDisplay.length > 0}
      enableHandlePanningGesture={cardsToDisplay.length > 0}
      animationConfigs={{
        duration: 300,
      }}
      onClose={() => {
      }}
    >
      <BottomSheetView style={styles.sheetContainer}>
        {cardsToDisplay.length > 0 && !generationState.isGeneratingCards ? (
          <PromptComponent
            cards={cardsToDisplay}
            currentCardIndex={currentCardIndex}
            onClose={handleClosePromptDisplay}
            onChangeCard={handleChangeCard}
          />
        ) : generationState.isGeneratingCards ? (
          <View style={styles.expandedLoadingContainer}>
            <ActivityIndicator size="large" color="#A97C63" />
            <Text style={styles.expandedLoadingText}>Loading cards...</Text>
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
    height: 70,
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
    fontFamily: 'Nunito_700Bold',
  },
  cardPreviewCount: {
    fontSize: 12,
    color: '#6C757D',
    fontFamily: 'Nunito_400Regular',
  },
  cardPreviewText: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'Nunito_400Regular',
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
    fontFamily: 'Nunito_400Regular',
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
}); 