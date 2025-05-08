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
import { Card, CardResponse } from '../types/card';
import { useFontLoader } from '../hooks/useFontLoader';
import { TabBottomSheet } from '../components/TabBottomSheet';

// Create a context for sharing the generate function
type GenerateContextType = {
  setGeneratePrompt: (fn: () => Promise<CardResponse | null>) => void;
  generatePrompt: () => Promise<CardResponse | null>;
};

export const GenerateContext = createContext<GenerateContextType>({
  setGeneratePrompt: () => {},
  generatePrompt: async () => null,
});

export const useGenerateContext = () => useContext(GenerateContext);

// Generate Context Provider
const GenerateContextProvider = ({ children }: { children: React.ReactNode }) => {
  // We'll store the generatePrompt function here
  const [generateFn, setGenerateFn] = useState<() => Promise<CardResponse | null>>(async () => null);

  const setGeneratePrompt = (fn: () => Promise<CardResponse | null>) => {
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

  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
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
