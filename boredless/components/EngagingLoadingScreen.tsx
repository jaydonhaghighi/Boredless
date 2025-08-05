import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';

/**
 * EngagingLoadingScreen - A simple loading component with fun fading phrases
 */
interface EngagingLoadingScreenProps {
  message?: string;
  variant?: 'fullscreen' | 'overlay' | 'compact' | 'mini';
  showBackground?: boolean;
}

const EngagingLoadingScreen: React.FC<EngagingLoadingScreenProps> = ({ 
  message = "Creating magic...", 
  variant = 'fullscreen',
  showBackground = true 
}) => {
  const opacity = useSharedValue(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const messages = [
    "✨ Brewing conversation magic...",
    "🎭 Crafting the perfect questions...",
    "🌟 Sprinkling some sparkle...",
    "🎪 Preparing your conversation circus...",
    "🎨 Painting words with personality...",
    "🎯 Sharpening the perfect questions...",
    "🎪 Setting up your chat stage...",
    "🎭 Dressing up your dialogue...",
    "✨ Adding that special touch...",
    "🎨 Mixing colors of conversation..."
  ];

  useEffect(() => {
    // Start with fade in
    opacity.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });

    // Rotate messages with fade effect
    const messageInterval = setInterval(() => {
      // Fade out
      opacity.value = withTiming(0, { 
        duration: 300, 
        easing: Easing.inOut(Easing.ease) 
      });
      
      // Change message after fade out
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        // Fade in new message
        opacity.value = withTiming(1, { 
          duration: 500, 
          easing: Easing.inOut(Easing.ease) 
        });
      }, 300);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderLoadingContent = () => (
    <View style={styles.loadingContent}>
      <Animated.Text style={[styles.loadingText, animatedTextStyle]}>
        {messages[currentMessageIndex]}
      </Animated.Text>
    </View>
  );

  if (variant === 'fullscreen') {
    return (
      <View style={styles.fullscreenContainer}>
        {showBackground && <View style={styles.backgroundGradient} />}
        {renderLoadingContent()}
      </View>
    );
  }

  if (variant === 'overlay') {
    return (
      <View style={styles.overlayContainer}>
        {showBackground && <View style={styles.overlayBackground} />}
        {renderLoadingContent()}
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        {renderLoadingContent()}
      </View>
    );
  }

  // Mini variant for very small spaces
  if (variant === 'mini') {
    return (
      <View style={styles.miniContainer}>
        <Animated.Text style={[styles.miniText, animatedTextStyle]}>
          ✨
        </Animated.Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  compactContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  miniContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFAFC',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    color: '#4A5568',
    textAlign: 'center',
    maxWidth: 250,
  },
  miniText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default EngagingLoadingScreen; 