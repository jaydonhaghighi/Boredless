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
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  }
});
