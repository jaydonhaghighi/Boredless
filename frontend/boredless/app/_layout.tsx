import { Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import EngagingLoadingScreen from '../components/EngagingLoadingScreen';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <EngagingLoadingScreen variant="fullscreen" showBackground={true} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack>
        <Stack.Screen name="(auth)/signIn" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      {/* Redirect based on authentication status */}
      {isAuthenticated ? (
        <Redirect href="/(tabs)/home" />
      ) : (
        <Redirect href="/(auth)/signIn" />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
