import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useMemo, createContext, useContext, useState } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BottomSheetProvider, useBottomSheet } from '../context/BottomSheetContext';
import { useRouter } from 'expo-router';

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
  
  // Get screen dimensions to calculate the height excluding the tab bar
  const screenHeight = Dimensions.get('window').height;
  // Approximate height of the tab bar (adjust if needed)
  const TAB_BAR_HEIGHT = 65;
  
  // Set snap points to percentages that leave space for the tab bar
  // The calculation ensures the bottom sheet doesn't cover the tab bar
  const snapPoints = useMemo(() => {
    const availableHeight = screenHeight - TAB_BAR_HEIGHT;
    // Convert to percentages of the screen
    const smallSnapPoint = Math.floor((availableHeight * 0.25) / screenHeight * 100);
    const largeSnapPoint = Math.floor((availableHeight * 0.9) / screenHeight * 100);
    
    return [`${smallSnapPoint}%`, `${largeSnapPoint}%`];
  }, []);

  // Render backdrop
  const renderBackdrop = useMemo(
    () => (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

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
      index={-1}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.sheetBackgroundStyle}
      handleStyle={styles.sheetHandleStyle}
      bottomInset={TAB_BAR_HEIGHT}
      detached={true}
    >
      <BottomSheetView style={styles.sheetContainer}>
        <Text style={styles.sheetTitle}>Generate Prompt</Text>
        <Text style={styles.sheetText}>
          Generate a conversation prompt based on your selected filters. This will create a prompt that you can share with others.
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={closeBottomSheet}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.confirmButton, isLoading && styles.disabledButton]} 
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.confirmButtonText}>
              {isLoading ? 'Loading...' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
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
    marginTop: 16,
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
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
  },
});
