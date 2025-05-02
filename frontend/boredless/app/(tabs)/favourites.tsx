import React from "react";
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useBottomSheetVisibility } from './_layout';

export default function FavouritesScreen() {
  const { showBottomSheet } = useBottomSheetVisibility();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Favourites screen</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={showBottomSheet}
        >
          <Text style={styles.buttonText}>Open Bottom Sheet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#000',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  }
}); 