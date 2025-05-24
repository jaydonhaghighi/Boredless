import { Tabs } from 'expo-router';
import { StyleSheet, View, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { BottomSheetProvider } from '../../context/BottomSheetContext';
import { useFontLoader } from '../../hooks/useFontLoader';
import { TabBottomSheet } from '../../components/TabBottomSheet';
import { CurrentGenerationProvider, BottomSheetVisibilityProvider } from '../../context/TabContext';

export default function TabLayout() {
  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <CurrentGenerationProvider>
        <BottomSheetProvider>
          <BottomSheetVisibilityProvider>
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
            
            {/* Bottom Sheet */}
            <TabBottomSheet />
          </BottomSheetVisibilityProvider>
        </BottomSheetProvider>
      </CurrentGenerationProvider>
    </GestureHandlerRootView>
  );
}

// Component to render tab icons
const TabIcon = ({ source }: { source: any }) => {
  return (
    <Image
      source={source}
      style={styles.icon}
    />
  );
};

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
