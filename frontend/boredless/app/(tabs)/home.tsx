import { Text, View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, ActivityIndicator, FlatList, Alert, ImageBackground } from 'react-native';
import { AntDesign, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState, ReactNode, useContext } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { getUserPromptHistory, HistoryEntryData, deckDataEvents, DECK_DATA_CHANGED } from '../../services/firestoreService';
import { useCurrentGeneration, useBottomSheetVisibility } from '../../context/TabContext';
import { Card } from '../../types/card';
import { FilterParams } from '../../utils/cardUtils';
import { CardTypeName } from '../../constants/cardTypes';
import { useFocusEffect } from '@react-navigation/native';

SplashScreen.preventAutoHideAsync();

interface QuickStartItemData {
  id: string;
  title: CardTypeName;
  icon: ReactNode;
  backgroundColor: string;
  color: string;
  apiParams: Omit<FilterParams, 'card_type'>;
}

// Component for the content above the FlatList
const ListHeader = ({ 
  windowWidth, 
  buttonSize, 
  quickStartItems, 
  onItemPress
}: { 
  windowWidth: number, 
  buttonSize: number, 
  quickStartItems: QuickStartItemData[],
  onItemPress: (item: QuickStartItemData) => void
}) => (
  <>
    <Text style={styles.headerText}>Hey, welcome back!</Text>
    <Text style={styles.subText}>Ready to dive into some good conversations? Let's jump in!</Text>
    
    {/* Quick Start Section */}
    <View style={styles.sectionContainer}>
      <Text style={styles.subHeader}>Quick Start</Text>
    </View>
    <FlatList
      data={quickStartItems}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onItemPress(item)} style={{ marginRight: 15 }}>
          <ImageBackground
            source={require('../../assets/images/textures/noisy-background.jpg')}
            style={[styles.quickStartCard, { width: buttonSize * 0.9, height: buttonSize * 1.1, backgroundColor: item.backgroundColor }]}
            imageStyle={{ opacity: 0.70, borderRadius: 5 }}
            borderRadius={5}
          >
            <View style={styles.quickStartIconContainer}>{item.icon}</View>
            <Text style={[styles.quickStartTitle, { color: item.color }]}>{item.title}</Text>
          </ImageBackground>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalListContainer}
    />

    {/* Ongoing Decks Section Title - This will be followed by another FlatList */}
    <View style={styles.sectionContainer}>
      <Text style={styles.subHeader}>Ongoing Decks</Text>
    </View>
  </>
);

export default function Index() {
  const { width: windowWidth } = useWindowDimensions();
  const outerPadding = 32;
  const availableWidth = windowWidth - (outerPadding * 2);
  const buttonSize = Math.min(Math.max((availableWidth - 24) / 2, 130), 170);
  
  const { generationState, triggerCardGeneration } = useCurrentGeneration();
  const { showBottomSheet } = useBottomSheetVisibility();

  const quickStartItemsData: QuickStartItemData[] = [
    {
      id: 'table-for-two', title: 'Table for Two', 
      icon: <AntDesign name="heart" size={Math.floor(buttonSize/2.5)} color="#D43434" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Relationships & Dating", tone: "Romantic", participants: "2", relationship: "Romantic Partners" }
    },
    {
      id: 'real-talk', title: 'Real Talk',
      icon: <Ionicons name="chatbubble-ellipses-outline" size={Math.floor(buttonSize/2.5)} color="#2466D4" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Personality & Self-discovery", tone: "Reflective", participants: "2", relationship: "Close Friends" }
    },
    {
      id: 'last-call', title: 'Last Call', 
      icon: <FontAwesome5 name="cocktail" size={Math.floor(buttonSize/2.5)} color="#069200" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Pop Culture & Entertainment", tone: "Energetic", participants: "6+", relationship: "Friends" }
    },
    {
      id: 'icebreakers', title: 'Icebreakers', 
      icon: <AntDesign name="questioncircleo" size={Math.floor(buttonSize/2.5)} color="#301C11" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Casual Chat", tone: "Friendly", participants: "3-5", relationship: "Aquaintances" }
    },
    {
      id: 'true-self', title: 'True Self', 
      icon: <Entypo name="emoji-happy" size={Math.floor(buttonSize/2.5)} color="#301C11" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Personality & Self-discovery", tone: "Playful", participants: "3-5", relationship: "Mixed Group" }
    },
    {
      id: 'hot-seat', title: 'Hot Seat', 
      icon: <FontAwesome5 name="coffee" size={Math.floor(buttonSize/2.5)} color="#301C11" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Personality & Self-discovery", tone: "Serious", participants: "3-5", relationship: "Close Friends" }
    },
    {
      id: 'face-off', title: 'Face-Off',
      icon: <FontAwesome5 name="coffee" size={Math.floor(buttonSize/2.5)} color="#301C11" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Debates & Opinions", tone: "Thoughtful", participants: "3-5", relationship: "Mixed Group" }
    },
    {
      id: 'deep-cuts', title: 'Deep Cuts', 
      icon: <FontAwesome5 name="coffee" size={Math.floor(buttonSize/2.5)} color="#301C11" />,
      backgroundColor: '#FFF', color: '#301C11',
      apiParams: { topic: "Philosophy & Big Questions", tone: "Reflective", participants: "2", relationship: "Close Friends" }
    },
  ];

  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../../assets/fonts/Petrona-Regular.ttf'),
  });

  const { userId, isAuthenticated } = useAuth();
  const [promptHistory, setPromptHistory] = useState<HistoryEntryData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const handleQuickStartPress = async (item: QuickStartItemData) => {
    const filters: FilterParams = {
      card_type: item.title,
      topic: item.apiParams.topic,
      tone: item.apiParams.tone,
      participants: item.apiParams.participants,
      relationship: item.apiParams.relationship,
    };
    
    await triggerCardGeneration(filters);
  };

  useEffect(() => {
    if (generationState.generatedCards && generationState.generatedCards.length > 0 && generationState.isGeneratingCards === false && !generationState.error) {
      showBottomSheet(generationState.generatedCards, 0);
    }
    if (generationState.error && !generationState.isGeneratingCards) {
      Alert.alert("Error Generating Cards", generationState.error);
    }
  }, [generationState.generatedCards, generationState.isGeneratingCards, generationState.error, showBottomSheet]);

  // Function to fetch history data
  const fetchHistory = useCallback(async () => {
    if (isAuthenticated && userId) {
      console.log("Fetching updated history data...");
      setIsLoadingHistory(true);
      const history = await getUserPromptHistory(userId, 5);
      setPromptHistory(history);
      setIsLoadingHistory(false);
    } else {
      setPromptHistory([]);
      setIsLoadingHistory(false);
    }
  }, [userId, isAuthenticated]);

  // Load history data on initial render
  useEffect(() => {
    console.log("Initial load - fetching history data");
    fetchHistory();

    // Listen for deck data changes
    const handleDeckDataChanged = (data: { deckId: string, currentCardIndex?: number }) => {
      console.log(`Deck data changed event for deck ${data.deckId}, index: ${data.currentCardIndex}. Refreshing history data.`);
      fetchHistory();
    };

    // Add event listener
    deckDataEvents.addListener(DECK_DATA_CHANGED, handleDeckDataChanged);

    // Clean up event listener when component unmounts
    return () => {
      deckDataEvents.removeListener(DECK_DATA_CHANGED, handleDeckDataChanged);
    };
  }, [fetchHistory]);
  
  // Reload history data when the home tab becomes focused
  useFocusEffect(
    useCallback(() => {
      console.log("Home tab focused - reloading history data");
      fetchHistory();
      return () => {
        console.log("Home tab unfocused");
      };
    }, [fetchHistory])
  );

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Render function for history items (Ongoing Decks)
  const renderHistoryItem = ({ item }: { item: HistoryEntryData }) => {
    // Add debug logging for the currentCardIndex
    console.log(`History item ${item.id} - currentCardIndex:`, item.currentCardIndex);
    
    return (
    <TouchableOpacity 
      onPress={() => {
        if (item.generated_cards_data && item.generated_cards_data.length > 0) {
          // Add deck ID to each card to track which history entry this is
          const cardsWithDeckId = item.generated_cards_data.map(card => ({
            ...card,
            deckId: item.id // Set the history entry ID as the deckId on each card
          }));
          
          // Use the saved currentCardIndex if available, otherwise default to 0
          const startIndex = item.currentCardIndex !== undefined ? item.currentCardIndex : 0;
          
          console.log(`Opening deck ${item.id} at index ${startIndex}`);
          showBottomSheet(cardsWithDeckId, startIndex);
        } else {
          Alert.alert("Empty Deck", "This deck doesn't contain any cards.");
        }
      }}
    >
      <ImageBackground
        source={require('../../assets/images/textures/noisy-background.jpg')}
        style={styles.ongoingDeckCard}
        imageStyle={{ opacity: 0.70, borderRadius: 5 }}
        borderRadius={5} // Ensures the ImageBackground itself clips content and respects border radius
      >
        <View style={styles.ongoingDeckCardColorTop} />
        <View style={styles.ongoingDeckCardContent}>
          <Text style={styles.ongoingDeckTitle}>{item.filters?.topic || "General Topics"}</Text>
          <Text style={styles.ongoingDeckSubtitle} numberOfLines={1}>{item.generated_cards_data?.[0]?.title || 'View Cards'}</Text>
          <Text style={styles.ongoingDeckProgress}>{item.generated_cards_data?.length || 0} cards</Text>
          {item.currentCardIndex !== undefined && item.currentCardIndex > 0 && (
            <View style={styles.bookmarkContainer}>
              <AntDesign name="pushpin" size={10} color="#A97C63" style={styles.bookmarkIcon} />
              <Text style={styles.ongoingDeckBookmark}>
                Resume at card {item.currentCardIndex + 1}
              </Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <ScrollView contentContainerStyle={styles.mainScrollContainer} showsVerticalScrollIndicator={false}>
        <ListHeader 
          windowWidth={windowWidth} 
          buttonSize={buttonSize} 
          quickStartItems={quickStartItemsData}
          onItemPress={handleQuickStartPress}
        />
        
        {/* Loading indicator for QuickPicks now uses context's loading state */}
        {generationState.isGeneratingCards && 
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#A97C63" />
            <Text style={styles.loadingText}>Summoning brilliance...</Text>
          </View>
        }

        {/* Ongoing Decks (Prompt History) */}
        {isLoadingHistory ? (
          <ActivityIndicator size="large" color="#A97C63" style={{ marginTop: 20, alignSelf: 'center' }} />
        ) : promptHistory.length === 0 ? (
          <View style={styles.centeredMessageContainerHorizontalList}>
            <Text style={styles.placeholderText}>No ongoing decks to show.</Text>
          </View>
        ) : (
          <FlatList
            data={promptHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id || String(item.createdAt.seconds)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC', // Match image background more closely
  },
  mainScrollContainer: {
    paddingBottom: 24,
  },
  headerText: {
    fontSize: 32,
    color: '#301C11',
    fontFamily: 'Petrona-Bold',
    marginBottom: 8,
    paddingHorizontal: 20, // Adjusted padding
    marginTop: 20,
  },
  subText: {
    fontSize: 14, // Slightly larger
    color: '#5F5F5F',
    fontFamily: 'Petrona-Regular',
    textAlign: 'left',
    paddingHorizontal: 20, // Adjusted padding
    marginBottom: 20, // Added margin
  },
  sectionContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 15, // Adjusted margin
    paddingHorizontal: 20, // Adjusted padding
  },
  subHeader: {
    fontSize: 22, // Slightly larger
    marginTop: 18,
    color: '#301C11',
    fontFamily: 'Petrona-Bold',
  },
  horizontalListContainer: {
    paddingLeft: 20, // Start first item from edge
    paddingRight: 5, // Allow last item to not be cut off if it's wider than paddingRight of main container
    paddingVertical: 10,
  },
  // Quick Start Card Styles
  quickStartCard: {
    borderRadius: 5,
    padding: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStartIconContainer: {
    marginBottom: 10, // Space between icon and title
  },
  quickStartTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 18, // Example size, adjust as needed
    textAlign: 'center',
  },
  // Ongoing Deck Card Styles (mimicking image)
  ongoingDeckCard: {
    width: 150, // Adjust as needed
    height: 180, // Adjust as needed
    borderRadius: 5,
    backgroundColor: '#FFFFFF', // This will be the base color under the texture
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', // To clip the color top part
  },
  ongoingDeckCardColorTop: {
    height: '40%', // Adjust percentage for color block
    backgroundColor: '#FFD44C', // Yellow color from image
  },
  ongoingDeckCardContent: {
    padding: 12,
    position: 'relative', // For star positioning
    flex: 1, // Take remaining space
    justifyContent: 'center', // Center content vertically in the remaining space
  },
  
  ongoingDeckTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 16,
    color: '#301C11',
    textAlign: 'center',
    marginBottom: 4,
  },
  ongoingDeckSubtitle: {
    fontFamily: 'Petrona-Regular',
    fontSize: 12,
    color: '#5F5F5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  ongoingDeckProgress: {
    fontFamily: 'Petrona-Regular',
    fontSize: 11,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  ongoingDeckBookmark: {
    fontFamily: 'Petrona-Regular',
    fontSize: 10,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 4,
  },
  // Styles for History List (Previously full width items)
  centeredMessageContainerHorizontalList: { // For when horizontal list is empty
    paddingVertical: 20,
    paddingHorizontal: 20, 
    alignItems: 'flex-start', // Align with the start of where the list would be
  },
  placeholderText: {
    fontSize: 16,
    color: '#5F5F5F',
    fontFamily: 'Petrona-Regular',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 250, 252, 0.8)', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's on top
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    color: '#301C11'
  },
  bookmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    marginRight: 4,
  },
});
