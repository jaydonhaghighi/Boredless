import React, { useEffect, useState, useCallback } from "react";
import { Text, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useBottomSheetVisibility } from "@/context/TabContext";
import { useAuth } from "../../hooks/useAuth";
import { getUserDecks, getDeckCards, Deck, deckDataEvents, DECK_DATA_CHANGED } from "../../services/firestoreService";
import { Card } from "../../types/card";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

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
        showBottomSheet(cards, 0);
      } else {
        Alert.alert("Empty Deck", "This deck doesn\'t have any cards.");
      }
    } catch (error) {
      console.error("Error fetching deck cards:", error);
      Alert.alert("Error", "Could not load cards for this deck.");
    }
    setIsLoadingDeckCards(false);
  };

  const renderDeckItem = ({ item }: { item: Deck }) => (
    <TouchableOpacity 
      style={styles.deckItemContainer} 
      onPress={() => handleDeckPress(item.id)}
      disabled={isLoadingDeckCards}
    >
      <View style={styles.deckInfoContainer}>
        <Text style={styles.deckName}>{item.name}</Text>
        <Text style={styles.deckCardCount}>{item.cardCount || 0} cards</Text>
      </View>
      {isLoadingDeckCards && <ActivityIndicator size="small" color="#A97C63" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Your Decks</Text>
      </View>
      {isLoadingDecks && !refreshing ? (
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color="#A97C63" />
        </View>
      ) : userDecks.length === 0 ? (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.placeholderText}>You haven't created any decks yet.</Text>
          <Text style={styles.placeholderSubText}>Go to a card set and save it as a deck!</Text>
        </View>
      ) : (
        <FlatList
          data={userDecks}
          renderItem={renderDeckItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#A97C63"]}
              tintColor="#A97C63"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#301C11',
    fontFamily: 'Petrona-Bold',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#5F5F5F',
    textAlign: 'center',
    fontFamily: 'Petrona-Regular',
    marginBottom: 8,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    fontFamily: 'Petrona-Regular',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  deckItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckInfoContainer: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    color: '#301C11',
    fontFamily: 'Petrona-Bold', 
  },
  deckCardCount: {
    fontSize: 14,
    color: '#5F5F5F',
    fontFamily: 'Petrona-Regular',
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  }
}); 