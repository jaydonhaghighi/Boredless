import { Tabs } from "expo-router";
import { Image, View } from "react-native";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#402E22",
        tabBarInactiveTintColor: "#402E2280",
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingBottom: 12,
          paddingTop: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require("../assets/images/navbar/home.png")} 
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: "Generate",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require("../assets/images/navbar/generate.png")} 
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require("../assets/images/navbar/favourite.png")} 
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
