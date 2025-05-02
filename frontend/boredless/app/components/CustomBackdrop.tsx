import React from 'react';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

export const CustomBackdrop = ({
  animatedIndex,
  style,
}: BottomSheetBackdropProps) => {
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: 'none',
    };
  });

  return <Animated.View style={[style, styles.backdrop, containerAnimatedStyle]} />;
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default CustomBackdrop;