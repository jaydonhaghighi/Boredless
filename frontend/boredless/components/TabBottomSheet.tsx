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
import { updateHistoryCardIndex, deckDataEvents, DECK_DATA_CHANGED, doesHistoryEntryExist, updateDeckCardIndex, doesDeckExist } from '../services/firestoreService';

/**
 * Gets the preview text to display in the bottom sheet based on card type
 */
const getCardPreviewText = (card: Card | undefined): string => {
  if (!card) return '';
  
  // Access question safely with type guarding
  const question = 'question' in card ? card.question : '';
  
  switch(card.card_type) {
    case 'deep_conversations':
    case 'light_conversation':
    case 'hot_takes':
    case 'personality_quizzes':
      return question;
      
    case 'fun_challenges':
      return ('twist' in card ? card.twist : '') || question;
      
    case 'creative_prompts':
      return question;
      
    default:
      return question;
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
  const [deckId, setDeckId] = useState<string | null>(null);
  const [isSavedDeck, setIsSavedDeck] = useState(false);
  
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 55;
  const snapPoints = useMemo(() => [`12%`, `100%`], [screenHeight]);

  // Helper function to determine if we're dealing with a saved deck or history entry
  const determineCollectionType = (id: string, cards: Card[]) => {
    // If cards have deckId property, it's likely a saved deck
    // If cards come from history, they won't have deckId
    if (cards && cards.length > 0 && 'deckId' in cards[0] && cards[0].deckId) {
      return 'deck';
    }
    // If the ID looks like a Firestore auto-generated ID (20 chars), it's likely a history entry
    if (id && id.length === 20) {
      return 'history';
    }
    // Default to history for backward compatibility
    return 'history';
  };

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

    console.log('TabBottomSheet - initialCardIndexInSheet:', initialCardIndexInSheet);
    console.log('TabBottomSheet - cardsInSheet length:', cardsInSheet?.length || 0);
    
    // If a deckId property exists on the first card, store it for use in saving index
    // This will come from the history entry ID that was attached in home.tsx
    let newDeckId = null;
    let collectionType = 'history';
    
    if (cardsInSheet && cardsInSheet.length > 0 && 'deckId' in cardsInSheet[0] && cardsInSheet[0].deckId) {
      console.log('TabBottomSheet - Setting deckId:', cardsInSheet[0].deckId);
      newDeckId = cardsInSheet[0].deckId;
      collectionType = 'deck';
      setDeckId(newDeckId);
      setIsSavedDeck(true);
    } else {
      // For history entries, we need to get the ID from the context or props
      // This is a bit tricky since we don't have direct access to the history ID
      // For now, we'll set it to null and handle it differently
      setDeckId(null);
      setIsSavedDeck(false);
    }

    // Determine target snap index and card index based on available data
    let targetSnapIndex = 0; // Default to 12% (preview)
    let newCardIndex = initialCardIndexInSheet;
    let effectivelyDisplayingCards = false;

    if (cardsInSheet && cardsInSheet.length > 0) {
      // Ensure the initial card index is valid for this deck
      if (initialCardIndexInSheet >= 0 && initialCardIndexInSheet < cardsInSheet.length) {
        newCardIndex = initialCardIndexInSheet;
      } else {
        newCardIndex = 0;
      }
      
      console.log('TabBottomSheet - Setting currentCardIndex to:', newCardIndex);
      setCurrentCardIndex(newCardIndex);
      
      // If this is a saved deck and we're opening at a specific index, update the state in Firestore
      // This ensures that simply viewing a card (without changing it) will still save the position
      if (newDeckId && newCardIndex > 0) {
        console.log(`Opening at saved position: index ${newCardIndex} for deck ${newDeckId}`);
        
        if (isSavedDeck) {
          // For saved decks, update the deck collection
          doesDeckExist(newDeckId).then(exists => {
            if (exists) {
              updateDeckCardIndex(newDeckId, newCardIndex)
                .catch(err => console.error('Failed to update initial deck card index:', err));
            } else {
              console.warn(`Deck ${newDeckId} does not exist, skipping card index update`);
            }
          }).catch(err => console.error('Failed to check if deck exists:', err));
        } else {
          // For history entries, update the history collection
          doesHistoryEntryExist(newDeckId).then(exists => {
            if (exists) {
              updateHistoryCardIndex(newDeckId, newCardIndex)
                .catch(err => console.error('Failed to update initial card index:', err));
            } else {
              console.warn(`History entry ${newDeckId} does not exist, skipping card index update`);
            }
          }).catch(err => console.error('Failed to check if history entry exists:', err));
        }
      }
      
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

  // Save card index on sheet close if needed
  useEffect(() => {
    // When sheet becomes not visible
    if (!isVisible && deckId && currentCardIndex > 0) {
      console.log(`Sheet closed - saving final position at index ${currentCardIndex} for deck ${deckId}`);
      
      if (isSavedDeck) {
        // For saved decks, update the deck collection
        doesDeckExist(deckId).then(exists => {
          if (exists) {
            updateDeckCardIndex(deckId, currentCardIndex)
              .then(success => {
                if (success) {
                  // Emit an event to notify that deck data has changed when sheet is closed
                  deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex });
                }
              })
              .catch(err => console.error('Failed to save final deck card position:', err));
          } else {
            console.warn(`Deck ${deckId} does not exist, skipping final card position save`);
          }
        }).catch(err => console.error('Failed to check if deck exists:', err));
      } else {
        // For history entries, update the history collection
        doesHistoryEntryExist(deckId).then(exists => {
          if (exists) {
            updateHistoryCardIndex(deckId, currentCardIndex)
              .then(success => {
                if (success) {
                  // Emit an event to notify that deck data has changed when sheet is closed
                  deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex });
                }
              })
              .catch(err => console.error('Failed to save final card position:', err));
          } else {
            console.warn(`History entry ${deckId} does not exist, skipping final card position save`);
          }
        }).catch(err => console.error('Failed to check if history entry exists:', err));
      }
    }
  }, [isVisible, deckId, currentCardIndex, isSavedDeck]);
  
  // Cleanup function for when component unmounts
  useEffect(() => {
    return () => {
      console.log('TabBottomSheet component cleanup');
      // Any final cleanup if needed
    };
  }, []);

  const handleChangeCard = React.useCallback((newIndex: number) => {
    console.log(`Changing card index to ${newIndex}`);
    setCurrentCardIndex(newIndex);
    
    // If this card is from a history entry, save the index
    if (deckId) {
      console.log(`Saving card index ${newIndex} for deck ${deckId}`);
      
      if (isSavedDeck) {
        // For saved decks, update the deck collection
        doesDeckExist(deckId).then(exists => {
          if (exists) {
            updateDeckCardIndex(deckId, newIndex)
              .then(success => {
                if (success) {
                  console.log(`Successfully saved card index ${newIndex} for deck ${deckId}`);
                  
                  // Emit an event to notify that deck data has changed
                  // This will trigger the home screen to refresh
                  deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex: newIndex });
                  
                  // Update the state in context immediately to help with navigation
                  if (cardsInSheet && cardsInSheet.length > 0 && 'deckId' in cardsInSheet[0] && cardsInSheet[0].deckId) {
                    // This ensures that if the user returns to home, it will show correct index
                    console.log(`Updated card context for deck ${deckId} with index ${newIndex}`);
                  }
                } else {
                  console.error(`Failed to save card index ${newIndex} for deck ${deckId}`);
                }
              })
              .catch(err => 
                console.error('Failed to save deck card index:', err)
              );
          } else {
            console.warn(`Deck ${deckId} does not exist, skipping card index save`);
          }
        }).catch(err => console.error('Failed to check if deck exists:', err));
      } else {
        // For history entries, update the history collection
        doesHistoryEntryExist(deckId).then(exists => {
          if (exists) {
            updateHistoryCardIndex(deckId, newIndex)
              .then(success => {
                if (success) {
                  console.log(`Successfully saved card index ${newIndex} for deck ${deckId}`);
                  
                  // Emit an event to notify that deck data has changed
                  // This will trigger the home screen to refresh
                  deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex: newIndex });
                  
                  // Update the state in context immediately to help with navigation
                  if (cardsInSheet && cardsInSheet.length > 0 && 'deckId' in cardsInSheet[0] && cardsInSheet[0].deckId) {
                    // This ensures that if the user returns to home, it will show correct index
                    console.log(`Updated card context for deck ${deckId} with index ${newIndex}`);
                  }
                } else {
                  console.error(`Failed to save card index ${newIndex} for deck ${deckId}`);
                }
              })
              .catch(err => 
                console.error('Failed to save card index:', err)
              );
          } else {
            console.warn(`History entry ${deckId} does not exist, skipping card index save`);
          }
        }).catch(err => console.error('Failed to check if history entry exists:', err));
      }
    }
  }, [deckId, cardsInSheet, isSavedDeck]);

  const handleClosePromptDisplay = () => {
    // Don't reset currentCardIndex when closing, so it stays saved
    console.log('Closing prompt display - keeping currentCardIndex as:', currentCardIndex);
    
    // Save the current position before minimizing
    if (deckId) {
      console.log(`Saving position at index ${currentCardIndex} before minimizing`);
      
      if (isSavedDeck) {
        // For saved decks, update the deck collection
        doesDeckExist(deckId).then(exists => {
          if (exists) {
            updateDeckCardIndex(deckId, currentCardIndex)
              .then(success => {
                if (success) {
                  // Emit an event to notify that deck data has changed
                  deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex });
                }
              })
              .catch(err => console.error('Failed to save deck position before minimizing:', err));
          } else {
            console.warn(`Deck ${deckId} does not exist, skipping position save before minimizing`);
          }
        }).catch(err => console.error('Failed to check if deck exists:', err));
      } else {
        // For history entries, update the history collection
        doesHistoryEntryExist(deckId).then(exists => {
          if (exists) {
            updateHistoryCardIndex(deckId, currentCardIndex)
              .then(success => {
                if (success) {
                  // Emit an event to notify that deck data has changed
                  deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex });
                }
              })
              .catch(err => console.error('Failed to save position before minimizing:', err));
          } else {
            console.warn(`History entry ${deckId} does not exist, skipping position save before minimizing`);
          }
        }).catch(err => console.error('Failed to check if history entry exists:', err));
      }
    }
    
    // Just minimize the sheet without resetting the current card
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
    padding: 16,
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