import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import screens
import { HomeScreen } from './screens/HomeScreen';
import { GenerateScreen } from './screens/GenerateScreen';
import { FavouritesScreen } from './screens/FavouritesScreen';
import { ProfileScreen } from './screens/ProfileScreen';

// Import Tab Icons
import './global.css';

type TabParamList = {
  Home: undefined;
  Generate: undefined;
  Favourites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, size }) => {
            let iconName;
            // Reduce the icon size to prevent cutting off
            let iconStyle = { 
              width: size, 
              height: size,
              // Apply tint color based on focused state
              tintColor: focused ? '#000000' : '#8e8e8e'  
            };

            if (route.name === 'Home') {
              iconName = require('./assets/home.png');
            } else if (route.name === 'Generate') {
              iconName = require('./assets/generate.png');
            } else if (route.name === 'Favourites') {
              iconName = require('./assets/favourite.png');
            } else if (route.name === 'Profile') {
              iconName = require('./assets/profile.png');
            }

            return <Image 
              source={iconName} 
              style={iconStyle}
              resizeMode="contain" 
            />;
          },
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            height: 80, // Increase the height of the tab bar
            paddingTop: 15, // Add padding to the top
            paddingBottom: 15, // Add padding to the bottom
          }
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Generate" component={GenerateScreen} />
        <Tab.Screen name="Favourites" component={FavouritesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}