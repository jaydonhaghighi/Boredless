import React from 'react';
import { View, StyleSheet } from 'react-native';
import EngagingLoadingScreen from './EngagingLoadingScreen';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <EngagingLoadingScreen variant="overlay" showBackground={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    opacity: 0.9,
  },
});

export default LoadingOverlay; 