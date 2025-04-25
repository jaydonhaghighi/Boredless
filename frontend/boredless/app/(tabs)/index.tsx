import { Text, View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { AntDesign, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { width: windowWidth } = useWindowDimensions();

  // Calculate dynamic sizes based on screen width
  const outerPadding = 32; // Padding on left and right edges
  const availableWidth = windowWidth - (outerPadding * 2); // Width after accounting for left and right padding
  const buttonSize = Math.min(Math.max((availableWidth - 24) / 2, 130), 170); // 24px is the space between buttons
  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../../assets/fonts/Petrona-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerText}>Welcome Back!</Text>
        <Text style={styles.subText}>Ready for some fun conversations? Let's get started.</Text>
        <View style={styles.sectionContainer}>
          <Text style={styles.subHeader}>Quick Start</Text>
        </View>
        <View style={[styles.gridContainer, { maxWidth: windowWidth, alignItems: 'flex-start' }]}>
            <View style={styles.gridRow}>
              <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
                <View style={[styles.buttonBackground, { backgroundColor: '#F8C4CF' }]} />
                <TouchableOpacity style={styles.gridButton}>
                  <Text style={[styles.buttonText, { color: '#301C11', fontSize: Math.max(windowWidth * 0.03, 12) }]}>Date Night</Text>
                  <AntDesign name="heart" size={Math.floor(buttonSize/3.5)} color="#301C11" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
              <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
                <View style={[styles.buttonBackground, { backgroundColor: '#A8DDEC' }]} />
                <TouchableOpacity style={styles.gridButton}>
                  <Text style={[styles.buttonText, { color: '#301C11', fontSize: Math.max(windowWidth * 0.03, 12) }]}>Friendship Deep Dive</Text>
                  <Ionicons name="chatbubble-ellipses-outline" size={Math.floor(buttonSize/3.5)} color="#301C11" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
                <View style={[styles.buttonBackground, { backgroundColor: '#FFCF94' }]} />
                <TouchableOpacity style={styles.gridButton}>
                  <Text style={[styles.buttonText, { color: '#301C11', fontSize: Math.max(windowWidth * 0.03, 12) }]}>Drinking Games</Text>
                  <FontAwesome5 name="cocktail" size={Math.floor(buttonSize/3.5)} color="#301C11" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
              <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
                <View style={[styles.buttonBackground, { backgroundColor: '#FFF9A6' }]} />
                <TouchableOpacity style={styles.gridButton}>
                  <Text style={[styles.buttonText, { color: '#301C11', fontSize: Math.max(windowWidth * 0.03, 12) }]}>Personality Quizzes</Text>
                  <AntDesign name="questioncircleo" size={Math.floor(buttonSize/3.5)} color="#301C11" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
                <View style={[styles.buttonBackground, { backgroundColor: '#D8F0C6' }]} />
                <TouchableOpacity style={styles.gridButton}>
                  <Text style={[styles.buttonText, { color: '#301C11', fontSize: Math.max(windowWidth * 0.03, 12) }]}>Get to Know Each Other</Text>
                  <Entypo name="emoji-happy" size={Math.floor(buttonSize/3.5)} color="#301C11" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
              <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
                <View style={[styles.buttonBackground, { backgroundColor: '#D8D3F0' }]} />
                <TouchableOpacity style={styles.gridButton}>
                  <Text style={[styles.buttonText, { color: '#301C11', fontSize: Math.max(windowWidth * 0.03, 12) }]}>Debate Time</Text>
                  <FontAwesome5 name="coffee" size={Math.floor(buttonSize/3.5)} color="#301C11" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 24,
    width: '100%',
  },
  headerText: {
    fontSize: 32,
    color: '#301C11',
    fontFamily: 'Petrona-Bold',
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  subText: {
    fontSize: 13,
    color: '#5F5F5F',
    fontFamily: 'Petrona-Regular',
    textAlign: 'left',
    paddingHorizontal: 32,
  },
  subHeader: {
    fontSize: 20,
    color: '#301C11',
    fontFamily: 'Petrona-Bold',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 32,
  },
  gridContainer: {
    width: '100%',
    paddingHorizontal: 32,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 500,
    marginBottom: 24, // Vertical spacing between rows
  },
  buttonWrapper: {
    position: 'relative',
    aspectRatio: 1,
  },
  buttonBackground: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23, // Slightly larger to match the offset
    zIndex: 1,
  },
  gridButton: {
    borderRadius: 20,
    padding: 16,
    width: '100%',
    height: '100%',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#301C11',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  buttonText: {
    fontFamily: 'Petrona-Bold',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 8,
    flexWrap: 'wrap',
    maxWidth: '90%',
  },
  buttonIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
});
