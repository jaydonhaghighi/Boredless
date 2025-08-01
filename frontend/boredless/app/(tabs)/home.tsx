import { Text, View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, FlatList, ImageBackground, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState, ReactNode, useContext } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getUserPromptHistory, HistoryEntryData, deckDataEvents, DECK_DATA_CHANGED } from '../../services/firestoreService';
import { useCurrentGeneration, useBottomSheetVisibility, useCurrentTab } from '../../context/TabContext';
import { useToast } from '../../context/ToastContext';
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
  description: string;
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
    {/* Hero Section */}
    <View style={styles.heroSection}>
      <Text style={styles.heroTitle}>Never run out of things to talk about</Text>
      <Text style={styles.heroSubtitle}>Spark engaging conversations and transform awkward silences into memorable moments</Text>
    </View>
    
    {/* Quick Start Section */}
    <View style={styles.sectionContainer}>
      <View>
        <Text style={styles.sectionTitle}>Start a Conversation</Text>
        <Text style={styles.sectionSubtitle}>Choose your vibe and let's get talking</Text>
      </View>
    </View>
    
    <FlatList
      data={quickStartItems}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onItemPress(item)} style={styles.quickStartItem}>
          <View style={[styles.quickStartCard, { backgroundColor: item.backgroundColor }]}>
            <View style={styles.iconContainer}>
              {item.icon}
            </View>
            <Text style={[styles.quickStartTitle, { color: item.color }]}>{item.title}</Text>
            <Text style={styles.quickStartDescription}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalListContainer}
    />

    {/* Ongoing Conversations Section */}
    <View style={styles.sectionContainer}>
      <View>
        <Text style={styles.sectionTitle}>Your Conversations</Text>
        <Text style={styles.sectionSubtitle}>Continue where you left off</Text>
      </View>
    </View>
  </>
);

export default function Index() {
  const { width: windowWidth } = useWindowDimensions();
  const outerPadding = 24;
  const availableWidth = windowWidth - (outerPadding * 2);
  const buttonSize = Math.min(Math.max((availableWidth - 20) / 2.2, 140), 160);
  
  const { generationState, triggerCardGeneration } = useCurrentGeneration();
  const { showBottomSheet } = useBottomSheetVisibility();
  const { showToast } = useToast();
  const { setCurrentTab } = useCurrentTab();

  // Set current tab when home screen is focused
  useFocusEffect(
    useCallback(() => {
      setCurrentTab('home');
    }, [setCurrentTab])
  );

  const quickStartItemsData: QuickStartItemData[] = [
    {
      id: 'table-for-two', 
      title: 'Table for Two', 
      icon: <Image source={require('../../assets/images/home/tablefortwo.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Perfect for dates',
      apiParams: { topic: "Relationships & Dating", tone: "Romantic", participants: "2", relationship: "Romantic Partners" }
    },
    {
      id: 'real-talk', 
      title: 'Real Talk',
      icon: <Image source={require('../../assets/images/home/realtalk.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Deep conversations',
      apiParams: { topic: "Personality & Self-discovery", tone: "Reflective", participants: "2", relationship: "Close Friends" }
    },
    {
      id: 'last-call', 
      title: 'Last Call', 
      icon: <Image source={require('../../assets/images/home/lastcall.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Party vibes',
      apiParams: { topic: "Pop Culture & Entertainment", tone: "Energetic", participants: "6+", relationship: "Friends" }
    },
    {
      id: 'icebreakers', 
      title: 'Icebreakers', 
      icon: <Image source={require('../../assets/images/home/icebreaker.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Break the ice',
      apiParams: { topic: "Casual Chat", tone: "Friendly", participants: "3-5", relationship: "Aquaintances" }
    },
    {
      id: 'true-self', 
      title: 'True Self', 
      icon: <Image source={require('../../assets/images/home/trueself.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Personality reveals',
      apiParams: { topic: "Personality & Self-discovery", tone: "Playful", participants: "3-5", relationship: "Mixed Group" }
    },
    {
      id: 'hot-seat', 
      title: 'Hot Seat', 
      icon: <Image source={require('../../assets/images/home/hotseat.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Spicy questions',
      apiParams: { topic: "Personality & Self-discovery", tone: "Serious", participants: "3-5", relationship: "Close Friends" }
    },
    {
      id: 'face-off', 
      title: 'Face-Off',
      icon: <Image source={require('../../assets/images/home/faceoff.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Friendly debates',
      apiParams: { topic: "Debates & Opinions", tone: "Thoughtful", participants: "3-5", relationship: "Mixed Group" }
    },
    {
      id: 'deep-cuts', 
      title: 'Deep Cuts', 
      icon: <Image source={require('../../assets/images/home/deepcuts.png')} style={{ width: 50, height: 50 }} />,
      backgroundColor: '#FFF', 
      color: '#2D3748',
      description: 'Philosophical talks',
      apiParams: { topic: "Philosophy & Big Questions", tone: "Reflective", participants: "2", relationship: "Close Friends" }
    },
  ];

  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../../assets/fonts/Petrona-Regular.ttf'),
  });

  const { userId, isAuthenticated } = useAuth();
  const [promptHistory, setPromptHistory] = useState<HistoryEntryData[]>([]);

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
    if (generationState.generatedCards && generationState.generatedCards.length > 0 && !generationState.isGeneratingCards && !generationState.error) {
      showBottomSheet(generationState.generatedCards, 0);
    }
    if (generationState.error && !generationState.isGeneratingCards) {
      showToast(generationState.error, "error");
    }
  }, [generationState.generatedCards, generationState.isGeneratingCards, generationState.error, showBottomSheet]);

  // Function to fetch history data
  const fetchHistory = useCallback(async () => {
    if (isAuthenticated && userId) {
      const history = await getUserPromptHistory(userId, 5);
      setPromptHistory(history);
    } else {
      setPromptHistory([]);
    }
  }, [userId, isAuthenticated]);

  // Load history data on initial render
  useEffect(() => {
    fetchHistory();

    // Listen for deck data changes
    const handleDeckDataChanged = (data: { deckId: string, currentCardIndex?: number }) => {
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
      fetchHistory();
      return () => {
        // Cleanup if needed
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
    
    return (
    <TouchableOpacity 
      onPress={() => {
        if (item.generated_cards_data && item.generated_cards_data.length > 0) {
          // Add deck ID to each card to track which history entry this is
          const cardsWithDeckId = item.generated_cards_data.map(card => ({
            ...card,
            deckId: item.id, // Set the history entry ID as the deckId on each card
            isHistoryEntry: true // Flag to indicate this is from history, not a saved deck
          }));
          
          // Use the saved currentCardIndex if available, otherwise default to 0
          const startIndex = item.currentCardIndex !== undefined ? item.currentCardIndex : 0;
          
          showBottomSheet(cardsWithDeckId, startIndex);
        } else {
          showToast("This deck doesn't contain any cards.", "warning");
        }
      }}
    >
      <View style={styles.conversationCard}>
        <View style={styles.conversationCardHeader}>
          
          <Text style={styles.conversationTitle}>{item.filters?.topic || "General Topics"}</Text>
        </View>
        <Text style={styles.conversationSubtitle} numberOfLines={1}>
          {item.generated_cards_data?.[0]?.title || 'View Cards'}
        </Text>
        <View style={styles.conversationFooter}>
          <Text style={styles.conversationProgress}>{item.generated_cards_data?.length || 0} cards</Text>
          {item.currentCardIndex !== undefined && item.currentCardIndex > 0 && (
            <View style={styles.resumeIndicator}>
              <AntDesign name="playcircleo" size={12} color="#A97C63" />
              <Text style={styles.resumeText}>Resume</Text>
            </View>
          )}
        </View>
      </View>
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
        
        {/* Ongoing Conversations */}
        {promptHistory.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
              <AntDesign name="message1" size={32} color="#CBD5E0" />
            </View>
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtitle}>Start your first conversation above to see it here</Text>
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
    backgroundColor: '#FAFAFC',
  },
  mainScrollContainer: {
    paddingBottom: 24,
  },
  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    
  },
  heroTitle: {
    fontSize: 28,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 8,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Petrona-Regular',
    lineHeight: 24,
  },
  // Section Headers
  sectionContainer: {
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  // Quick Start Items
  horizontalListContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 8,
  },
  quickStartItem: {
    marginRight: 16,
  },
  quickStartCard: {
    width: 140,
    height: 160,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
  },
  quickStartTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickStartDescription: {
    fontFamily: 'Petrona-Regular',
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  // Conversation Cards
  conversationCard: {
    width: 160,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conversationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  conversationTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 14,
    color: '#1A202C',
    flex: 1,
  },
  conversationSubtitle: {
    fontFamily: 'Petrona-Regular',
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationProgress: {
    fontFamily: 'Petrona-Regular',
    fontSize: 11,
    color: '#A0AEC0',
  },
  resumeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumeText: {
    fontFamily: 'Petrona-Regular',
    fontSize: 10,
    color: '#A97C63',
    marginLeft: 4,
  },
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 18,
    color: '#2D3748',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontFamily: 'Petrona-Regular',
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },

});
