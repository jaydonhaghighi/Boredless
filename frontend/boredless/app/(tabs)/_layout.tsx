import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BottomSheetProvider, useBottomSheet } from '../context/BottomSheetContext';

// Bottom Sheet component
function TabBottomSheet() {
  const { bottomSheetRef, closeBottomSheet } = useBottomSheet();
  
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
      // Add bottom inset to leave space for the tab bar
      bottomInset={TAB_BAR_HEIGHT}
      // Don't expand beyond bottom inset
      detached={true}
    >
      <BottomSheetView style={styles.sheetContainer}>
        <Text style={styles.sheetTitle}>Bottom Sheet</Text>
        <Text style={styles.sheetText}>This sheet appears above the tab bar</Text>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={closeBottomSheet}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
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
    // Make sure tab bar is above the bottom sheet content
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
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: '500',
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
