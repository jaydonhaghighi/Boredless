/**
 * Custom hook for loading fonts across the application
 */
import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

/**
 * Hook for loading application fonts and handling the splash screen
 * 
 * @returns An object containing:
 * - fontsLoaded: boolean indicating whether fonts have loaded
 * - fontError: any error that occurred during font loading
 * - onLayoutRootView: callback to attach to the root view's onLayout prop
 */
export const useFontLoader = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../assets/fonts/Petrona-Regular.ttf'),
    'BodoniModa-Regular': require('../assets/fonts/BodoniModa-Regular.ttf'),
    'BodoniModa-SemiBold': require('../assets/fonts/BodoniModa-SemiBold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError, onLayoutRootView };
}; 