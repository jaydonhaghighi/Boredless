import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useMemo, createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BottomSheetProvider, useBottomSheet } from '../context/BottomSheetContext';
import { useRouter } from 'expo-router';
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

// Create a context for sharing the generate function
type GenerateContextType = {
  setGeneratePrompt: (fn: () => Promise<void>) => void;
  generatePrompt: () => Promise<void>;
};

export const GenerateContext = createContext<GenerateContextType>({
  setGeneratePrompt: () => {},
  generatePrompt: async () => {},
});

export const useGenerateContext = () => useContext(GenerateContext);

// Generate Context Provider
const GenerateContextProvider = ({ children }: { children: React.ReactNode }) => {
  // We'll store the generatePrompt function here
  const [generateFn, setGenerateFn] = useState<() => Promise<void>>(async () => {});

  const setGeneratePrompt = (fn: () => Promise<void>) => {
    setGenerateFn(() => fn);
  };

  const generatePrompt = async () => {
    await generateFn();
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
  const [currentPosition, setCurrentPosition] = useState(-1);
  
  // For tracking real-time position
  const [swipePosition, setSwipePosition] = useState("0%");
  const swipePositionValue = useSharedValue(0);
  
  // Get screen dimensions to calculate the height excluding the tab bar
  const screenHeight = Dimensions.get('window').height;
  // Approximate height of the tab bar (adjust if needed)
  const TAB_BAR_HEIGHT = 65;
  
  // Set snap points to percentages that leave space for the tab bar
  // The calculation ensures the bottom sheet doesn't cover the tab bar
  const snapPoints = useMemo(() => {
    const availableHeight = screenHeight - TAB_BAR_HEIGHT;
    // Convert to percentages of the screen
    const initialSnapPoint = 9; // 10% initial snap point
    const smallSnapPoint = Math.floor((availableHeight * 0.25) / screenHeight * 100);
    const largeSnapPoint = 100; // Full screen height
    
    return [`${initialSnapPoint}%`, `${smallSnapPoint}%`, `${largeSnapPoint}%`];
  }, []);

  // Render backdrop
  const renderBackdrop = useMemo(
    () => (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0}
      />
    ),
    []
  );

  // Shared value for tracking the sheet position
  const animatedPosition = useSharedValue(0);

  // Animated style for background opacity
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      swipePositionValue.value,
      [17, 19],
      [0, 1],
      { extrapolateRight: 'clamp' }
    );
    
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      borderRadius: 24,
    };
  });
  
  // Animated style for content opacity
  const animatedContentStyle = useAnimatedStyle(() => {
    // Make content visible initially and fade out as sheet opens further
    // Use a wider range for smoother transition (10% to 25%)
    const opacity = interpolate(
      swipePositionValue.value,
      [0, 17, 19],
      [1, 1, 0],
      { extrapolateRight: Extrapolation.CLAMP }
    );
    
    // Apply timing for smoother transitions
    const smoothOpacity = withTiming(opacity, {
      duration: 150,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    return {
      opacity: smoothOpacity,
      flex: 1,
      width: '100%',
    };
  });

  // Track bottom sheet position changes
  const updatePositionState = useCallback((value: number) => {
    // Convert value to percentage of screen height (0 = fully open, screenHeight = fully closed)
    const percentValue = Math.min(
      100, 
      Math.max(
        0, 
        Math.round((1 - value / screenHeight) * 100)
      )
    );
    setSwipePosition(`${percentValue}%`);
    swipePositionValue.value = percentValue;
  }, [screenHeight, swipePositionValue]);

  // Monitor the animated position value and update the state
  useAnimatedReaction(
    () => animatedPosition.value,
    (currentValue) => {
      runOnJS(updatePositionState)(currentValue);
    }
  );

  // Handle sheet position changes when snapping to a point
  const handleSheetChanges = useCallback((index: number) => {
    setCurrentPosition(index);
  }, []);

  // Handle confirmation - this will call the generate function
  const handleConfirm = async () => {
    setIsLoading(true);
    closeBottomSheet();
    
    try {
      await generatePrompt();
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      index={0}
      onChange={handleSheetChanges}
      onClose={() => {
        setSwipePosition("0%");
        swipePositionValue.value = 0;
      }}
      backdropComponent={renderBackdrop}
      backgroundComponent={({ style }) => (
        <Animated.View style={[style, animatedBackgroundStyle]} />
      )}
      handleStyle={styles.sheetHandleStyle}
      bottomInset={TAB_BAR_HEIGHT}
      detached={false}
      handleComponent={() => (
        <View style={styles.customHandleContainer}>
          {/* <View style={styles.indicator} />
          <Text style={styles.handlePositionText}>{swipePosition}</Text> */}
          <Animated.View style={[animatedContentStyle, {width: '100%'}]}>
            <TouchableOpacity 
              style={[styles.confirmButton, isLoading && styles.disabledButton]} 
              onPress={handleConfirm}
              disabled={isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Loading...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      animatedPosition={animatedPosition}
      onAnimate={(fromIndex, toIndex) => {
        // This runs after the sheet has finished animating to a new snap point
        if (toIndex >= 0 && toIndex < snapPoints.length) {
          // Extract percentage value from the snap point string
          const snapPoint = snapPoints[toIndex];
          const percentageStr = snapPoint.replace('%', '');
          setSwipePosition(`${percentageStr}%`);
          swipePositionValue.value = parseFloat(percentageStr);
        } else if (toIndex === -1) {
          setSwipePosition("0%");
          swipePositionValue.value = 0;
        }
      }}
    >
      <Animated.View style={animatedContentStyle}>
        <BottomSheetView style={styles.sheetContainer}>
          <View>
            {/* Button moved to the handle component */}
          </View>
        </BottomSheetView>
      </Animated.View>
    </BottomSheet>
  );
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <GenerateContextProvider>
        <BottomSheetProvider>
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
});
