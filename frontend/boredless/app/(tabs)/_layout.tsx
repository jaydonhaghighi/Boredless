import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';

// Create a context for sharing the generate function
type GenerateContextType = {
  setGeneratePrompt: (fn: () => Promise<{
    prompt: string;
    title: string;
    followups: string[];
    cards?: Array<{
      prompt: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
  } | null>) => void;
  generatePrompt: () => Promise<{
    prompt: string;
    title: string;
    followups: string[];
    cards?: Array<{
      prompt: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
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
    prompt: string;
    title: string;
    followups: string[];
    cards?: Array<{
      prompt: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
  } | null>>(async () => null);

  const setGeneratePrompt = (fn: () => Promise<{
    prompt: string;
    title: string;
    followups: string[];
    cards?: Array<{
      prompt: string;
      title: string;
      followups: string[];
      theme?: string;
      interaction_type?: string;
      mood?: string;
      participants?: string;
      relationship?: string;
    }>;
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const { isVisible } = useBottomSheetVisibility();
  const [cards, setCards] = useState<{
    prompt: string;
    title: string;
    followups: string[];
    theme?: string;
    interaction_type?: string;
    mood?: string;
    participants?: string;
    relationship?: string;
  }[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Get screen dimensions to calculate the height excluding the tab bar
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 65;
  
  // Set snap points to percentages that leave space for the tab bar
  const snapPoints = useMemo(() => {
    const availableHeight = screenHeight - TAB_BAR_HEIGHT;
    return [`9%`, `100%`];
  }, [screenHeight]);

  // Shared value for tracking the sheet position
  const animatedPosition = useSharedValue(0);

  // Simplified animated style for background
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedPosition.value,
      [screenHeight * 0.81, screenHeight * 0.83],
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
      [screenHeight * 0.81, screenHeight * 0.83],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      flex: 1,
      width: '100%',
    };
  });

  // Handle confirmation
  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      console.log('Calling generatePrompt...');
      const result = await generatePrompt();
      console.log('generatePrompt result:', result);
      
      if (result) {
        console.log('Setting prompt data:', result);
        
        // Extract cards data from response
        if (result.cards) {
          console.log('Setting all cards from result.cards:', result.cards.length);
          setCards(result.cards);
        } else {
          // If no cards array, create one with the single result
          console.log('Setting single card as array');
          setCards([result]);
        }
        
        setCurrentCardIndex(0); // Reset to first card
        
        if (bottomSheetRef.current) {
          console.log('Snapping to index 1');
          bottomSheetRef.current.snapToIndex(1);
        }
      } else {
        console.log('No result from generatePrompt');
        Alert.alert('Error', 'Failed to generate prompt. Please try again.');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePrompt = () => {
    setCards([]);
    setCurrentCardIndex(0);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  };

  const handleChangeCard = useCallback((newIndex: number) => {
    console.log('Card changed to:', newIndex);
    setCurrentCardIndex(newIndex);
  }, []);

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
            {cards.length === 0 ? (
              <TouchableOpacity 
                style={[styles.confirmButton, isLoading && styles.disabledButton]} 
                onPress={handleConfirm}
                disabled={isLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Loading...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.cardIndicator}>
                <Text style={styles.cardCount}>
                  {currentCardIndex + 1} of {cards.length}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      )}
      animatedPosition={animatedPosition}
      enableOverDrag={false}
      enableDynamicSizing={false}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      animationConfigs={{
        duration: 300,
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
          <View>
            {/* Empty view when no cards */}
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
    // This style is no longer used as we're using an animated background component
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
  },
  handlePositionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  cardCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
});
