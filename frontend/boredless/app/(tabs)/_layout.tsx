import { Tabs } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#A97C63',
        tabBarInactiveTintColor: '#402E22',
        headerShown: false,
        tabBarStyle: {
        backgroundColor: '#FAFAFC',
        paddingTop: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/nav/home.png')}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/nav/generate.png')}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/nav/favourite.png')}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prompt"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={24} color={color} />
          ),
          href: null, // Hide from tab bar but keep accessible via direct navigation
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/nav/profile.png')}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  }
});
