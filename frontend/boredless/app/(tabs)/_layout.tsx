import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useMemo, createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetProvider, useBottomSheet } from '../context/BottomSheetContext';
import { useRouter } from 'expo-router';
import { CustomBackdrop } from '../components/CustomBackdrop';
import Animated, { 
  useSharedValue, 
  useAnimatedReaction, 
  runOnJS, 
  useAnimatedStyle, 
  interpolate,
  Extrapolation,
  withTiming,
  Easing 
} from 'react-native-reanimated';
import PromptComponent from '../components/PromptComponent';

// Create a context for sharing the generate function
type GenerateContextType = {
  setGeneratePrompt: (fn: () => Promise<{
    question: string;
    title: string;
    followups: string[];
    cards?: Array<{
      question: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
      card_type?: string;
      instructions?: string;
      options?: string[];
      stances?: string[];
      action_prompt?: string;
      correct_answer_index?: number;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
    card_type?: string;
    instructions?: string;
    options?: string[];
    stances?: string[];
    action_prompt?: string;
    correct_answer_index?: number;
  } | null>) => void;
  generatePrompt: () => Promise<{
    question: string;
    title: string;
    followups: string[];
    cards?: Array<{
      question: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
      card_type?: string;
      instructions?: string;
      options?: string[];
      stances?: string[];
      action_prompt?: string;
      correct_answer_index?: number;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
    card_type?: string;
    instructions?: string;
    options?: string[];
    stances?: string[];
    action_prompt?: string;
    correct_answer_index?: number;
  } | null>;
};

export const GenerateContext = createContext<GenerateContextType>({
  setGeneratePrompt: () => {},
  generatePrompt: async () => null,
});

export const useGenerateContext = () => useContext(GenerateContext);

// Generate Context Provider
const GenerateContextProvider = ({ children }: { children: React.ReactNode }) => {
  // We'll store the generatePrompt function here
  const [generateFn, setGenerateFn] = useState<() => Promise<{
    question: string;
    title: string;
    followups: string[];
    cards?: Array<{
      question: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
      card_type?: string;
      instructions?: string;
      options?: string[];
      stances?: string[];
      action_prompt?: string;
      correct_answer_index?: number;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
    card_type?: string;
    instructions?: string;
    options?: string[];
    stances?: string[];
    action_prompt?: string;
    correct_answer_index?: number;
  } | null>>(async () => null);

  const setGeneratePrompt = (fn: () => Promise<{
    question: string;
    title: string;
    followups: string[];
    cards?: Array<{
      question: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
      card_type?: string;
      instructions?: string;
      options?: string[];
      stances?: string[];
      action_prompt?: string;
      correct_answer_index?: number;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
    card_type?: string;
    instructions?: string;
    options?: string[];
    stances?: string[];
    action_prompt?: string;
    correct_answer_index?: number;
  } | null>) => {
    setGenerateFn(() => fn);
  };

  const generatePrompt = async () => {
    return await generateFn();
  };

  return (
    <GenerateContext.Provider value={{ setGeneratePrompt, generatePrompt }}>
      {children}
    </GenerateContext.Provider>
  );
};

// Bottom Sheet component
function TabBottomSheet() {
  const { bottomSheetRef, closeBottomSheet } = useBottomSheet();
  const router = useRouter();
  const { generatePrompt } = useGenerateContext();
  const { isVisible, isGenerating, setIsGenerating } = useBottomSheetVisibility();
  const [cards, setCards] = useState<{
    question: string;
    title: string;
    followups: string[];
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
    card_type?: string;
    instructions?: string;
    options?: string[];
    stances?: string[];
    action_prompt?: string;
    correct_answer_index?: number;
  }[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
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
  useEffect(() => {
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

  const handleChangeCard = useCallback((newIndex: number) => {
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
                      {cards[currentCardIndex]?.question || cards[currentCardIndex]?.action_prompt || ''}
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
}

// Create a context for bottom sheet visibility control
type BottomSheetVisibilityContextType = {
  showBottomSheet: () => void;
  hideBottomSheet: () => void;
  bottomSheetRef: React.RefObject<BottomSheet>;
  isVisible: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  isGenerating: boolean;
};

const BottomSheetVisibilityContext = createContext<BottomSheetVisibilityContextType | null>(null);

export const useBottomSheetVisibility = () => {
  const context = useContext(BottomSheetVisibilityContext);
  if (!context) {
    throw new Error('useBottomSheetVisibility must be used within a BottomSheetVisibilityProvider');
  }
  return context;
};

export default function TabLayout() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const showBottomSheet = useCallback(() => {
    setIsVisible(true);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  }, []);

  const hideBottomSheet = useCallback(() => {
    setIsVisible(false);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <GenerateContextProvider>
        <BottomSheetProvider>
          <BottomSheetVisibilityContext.Provider
            value={{
              showBottomSheet,
              hideBottomSheet,
              bottomSheetRef,
              isVisible,
              setIsGenerating,
              isGenerating,
            }}
          >
            <Tabs
              screenOptions={{
                tabBarActiveTintColor: '#A97C63',
                tabBarInactiveTintColor: '#402E22',
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
              }}
            >
              <Tabs.Screen
                name="index"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <Image
                      source={focused 
                        ? require('../../assets/images/nav/home_select.png')
                        : require('../../assets/images/nav/home_unselect.png')}
                      style={styles.icon}
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="generate"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <Image
                      source={focused 
                        ? require('../../assets/images/nav/generate_select.png')
                        : require('../../assets/images/nav/generate_unselect.png')}
                      style={styles.icon}
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="favourites"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <Image
                      source={focused 
                        ? require('../../assets/images/nav/bookmark_select.png')
                        : require('../../assets/images/nav/bookmark_unselect.png')}
                      style={styles.icon}
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="profile"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <Image
                      source={focused 
                        ? require('../../assets/images/nav/profile_select.png')
                        : require('../../assets/images/nav/profile_unselect.png')}
                      style={styles.icon}
                    />
                  ),
                }}
              />
            </Tabs>
            
            {/* Bottom Sheet */}
            <TabBottomSheet />
          </BottomSheetVisibilityContext.Provider>
        </BottomSheetProvider>
      </GenerateContextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#FAFAFC',
    paddingTop: 12,
    zIndex: 1,
    elevation: 1,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  sheetContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  sheetText: {
    fontSize: 16,
    color: '#5F5F5F',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  
  cancelButtonText: {
    color: '#5F5F5F',
    fontWeight: '500',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  indicator: {
    backgroundColor: '#000',
    width: 40,
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
  positionIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    width: '100%',
  },
  positionIndicator: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  customHandleContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: -10,
  },
  handlePositionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  cardPreviewCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  swipeHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontWeight: '400',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
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
  animatedContentStyle: {
    opacity: 1,
    flex: 1,
    width: '100%',
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
  cardPreviewText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
});
