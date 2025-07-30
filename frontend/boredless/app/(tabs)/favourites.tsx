import React, { useEffect, useState, useCallback } from "react";
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { useBottomSheetVisibility } from "@/context/TabContext";
import { useAuth } from "../../hooks/useAuth";
import { getUserDecks, getDeckCards, Deck, deckDataEvents, DECK_DATA_CHANGED } from "../../services/firestoreService";
import { Card } from "../../types/card";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import EngagingLoadingScreen from '../../components/EngagingLoadingScreen';
import { AntDesign } from '@expo/vector-icons';

export default function FavouritesScreen() {
  const { showBottomSheet } = useBottomSheetVisibility();
  const { userId, isAuthenticated } = useAuth();
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isLoadingDeckCards, setIsLoadingDeckCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDecks = async () => {
    if (isAuthenticated && userId) {
      setIsLoadingDecks(true);
      const decks = await getUserDecks(userId);
      setUserDecks(decks);
      setIsLoadingDecks(false);
      setRefreshing(false);
    } else {
      setUserDecks([]);
      setIsLoadingDecks(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchDecks();
  }, [userId, isAuthenticated]);

  // Listen for deck data changes
  useEffect(() => {
    const handleDeckDataChanged = () => {
      fetchDecks();
    };

    // Add event listener
    deckDataEvents.on(DECK_DATA_CHANGED, handleDeckDataChanged);

    // Clean up
    return () => {
      deckDataEvents.off(DECK_DATA_CHANGED, handleDeckDataChanged);
    };
  }, [userId, isAuthenticated]);

  // Refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchDecks();
    }, [userId, isAuthenticated])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDecks();
  }, []);

  const handleDeckPress = async (deckId: string) => {
    if (!deckId) return;
    setIsLoadingDeckCards(true);
    try {
      const cards = await getDeckCards(deckId);
      if (cards && cards.length > 0) {
        // Add deckId to each card so TabBottomSheet knows which deck to update
        const cardsWithDeckId = cards.map(card => ({
          ...card,
          deckId: deckId
        }));
        showBottomSheet(cardsWithDeckId, 0);
      } else {
        Alert.alert("Empty Deck", "This deck doesn't have any cards.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not load cards for this deck.");
    }
    setIsLoadingDeckCards(false);
  };

  const renderDeckItem = ({ item }: { item: Deck }) => (
    <TouchableOpacity 
      style={styles.deckCard} 
      onPress={() => handleDeckPress(item.id)}
      disabled={isLoadingDeckCards}
    >
      <View style={styles.deckCardHeader}>
        <View style={styles.deckIcon}>
          <AntDesign name="book" size={20} color="#374151" />
        </View>
        <View style={styles.deckInfo}>
          <Text style={styles.deckTitle}>{item.name}</Text>
          <Text style={styles.deckSubtitle}>{item.cardCount || 0} cards</Text>
        </View>
        {isLoadingDeckCards && (
          <View style={styles.loadingContainer}>
            <EngagingLoadingScreen variant="mini" showBackground={false} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hero Section - matching home.tsx */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Your saved decks</Text>
        <Text style={styles.heroSubtitle}>Access your favorite conversation collections anytime</Text>
      </View>

      {/* Main Content */}
      {isLoadingDecks && !refreshing ? (
        <View style={styles.loadingContainer}>
          <EngagingLoadingScreen variant="fullscreen" showBackground={false} />
        </View>
      ) : userDecks.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <AntDesign name="book" size={32} color="#CBD5E0" />
          </View>
          <Text style={styles.emptyStateTitle}>No saved decks yet</Text>
          <Text style={styles.emptyStateSubtitle}>Save conversation decks from your generated cards to access them here</Text>
        </View>
      ) : (
        <>
          {/* Section Header */}
          <View style={styles.sectionContainer}>
            <View>
              <Text style={styles.sectionTitle}>Your Collections</Text>
              <Text style={styles.sectionSubtitle}>Tap any deck to start using it</Text>
            </View>
          </View>

          {/* Deck List */}
          <FlatList
            data={userDecks}
            renderItem={renderDeckItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#374151"]}
                tintColor="#374151"
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  // Hero Section - matching home.tsx
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
  // Section Headers - matching home.tsx
  sectionContainer: {
    width: '100%',
    marginVertical: 12,
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
  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  // Empty State - matching home.tsx
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 280,
  },
  // List Container
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // Deck Cards - matching conversation cards from home.tsx
  deckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deckCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deckInfo: {
    flex: 1,
  },
  deckTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 2,
  },
  deckSubtitle: {
    fontFamily: 'Petrona-Regular',
    fontSize: 14,
    color: '#718096',
  },
}); 