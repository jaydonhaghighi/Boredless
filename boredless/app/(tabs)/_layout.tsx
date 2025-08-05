import { Tabs } from 'expo-router';
import { StyleSheet, View, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState } from 'react';
import { BottomSheetProvider } from '../../context/BottomSheetContext';
import { useFontLoader } from '../../hooks/useFontLoader';
import { TabBottomSheet } from '../../components/TabBottomSheet';
import { CurrentGenerationProvider, BottomSheetVisibilityProvider, useCurrentGeneration, CurrentTabProvider, useCurrentTab } from '../../context/TabContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { ToastProvider, useToast } from '../../context/ToastContext';
import Toast from '../../components/Toast';
import { useFocusEffect } from '@react-navigation/native';

// Component to render tab icons
const TabIcon = ({ source }: { source: any }) => {
  return (
    <Image
      source={source}
      style={styles.icon}
    />
  );
};

// Wrapper component that uses the context and renders the LoadingOverlay
const TabLayoutContent = () => {
  const { isOverlayLoading } = useCurrentGeneration();
  const { toastState, hideToast } = useToast();
  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();
  const { currentTab, setCurrentTab } = useCurrentTab();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#A97C63',
          tabBarInactiveTintColor: '#402E22',
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
        screenListeners={{
          tabPress: (e) => {
            const routeName = e.target?.split('/').pop();
            console.log('Tab pressed:', routeName);
            if (routeName) {
              setCurrentTab(routeName);
            }
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={styles.icon}>
                {focused ? 
                  <TabIcon source={require('../../assets/images/nav/home_select.png')} /> :
                  <TabIcon source={require('../../assets/images/nav/home_unselect.png')} />
                }
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="generate"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={styles.icon}>
                {focused ? 
                  <TabIcon source={require('../../assets/images/nav/generate_select.png')} /> :
                  <TabIcon source={require('../../assets/images/nav/generate_unselect.png')} />
                }
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="favourites"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={styles.icon}>
                {focused ? 
                  <TabIcon source={require('../../assets/images/nav/bookmark_select.png')} /> :
                  <TabIcon source={require('../../assets/images/nav/bookmark_unselect.png')} />
                }
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={styles.icon}>
                {focused ? 
                  <TabIcon source={require('../../assets/images/nav/profile_select.png')} /> :
                  <TabIcon source={require('../../assets/images/nav/profile_unselect.png')} />
                }
              </View>
            ),
          }}
        />
      </Tabs>
      
      {/* Bottom Sheet - Hide on profile tab */}
      <TabBottomSheet hideOnProfile={currentTab === 'profile'} />
      
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isOverlayLoading} />
      
      {/* Toast */}
      <Toast 
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onHide={hideToast}
      />
    </GestureHandlerRootView>
  );
};

export default function TabLayout() {
  return (
    <ToastProvider>
      <CurrentGenerationProvider>
        <CurrentTabProvider>
          <BottomSheetProvider>
            <BottomSheetVisibilityProvider>
              <TabLayoutContent />
            </BottomSheetVisibilityProvider>
          </BottomSheetProvider>
        </CurrentTabProvider>
      </CurrentGenerationProvider>
    </ToastProvider>
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
});
