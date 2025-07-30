import React, { useEffect, useState, useCallback } from "react";
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, TextInput, Modal } from 'react-native';
import { useBottomSheetVisibility } from "@/context/TabContext";
import { useAuth } from "../../hooks/useAuth";
import { getUserDecks, getDeckCards, Deck, deckDataEvents, DECK_DATA_CHANGED, createEmptyDeck } from "../../services/firestoreService";
import { Card } from "../../types/card";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import EngagingLoadingScreen from '../../components/EngagingLoadingScreen';
import { AntDesign, Ionicons, Feather } from '@expo/vector-icons';

export default function FavouritesScreen() {
  const { showBottomSheet } = useBottomSheetVisibility();
  const { userId, isAuthenticated } = useAuth();
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isLoadingDeckCards, setIsLoadingDeckCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'cards'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Add deck modal states
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

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

  // Filter and sort decks based on search query and sort options
  useEffect(() => {
    let filtered = [...userDecks];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(deck => 
        deck.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = a.createdAt?.toDate?.() || new Date(0);
          bValue = b.createdAt?.toDate?.() || new Date(0);
          break;
        case 'cards':
          aValue = a.cardCount || 0;
          bValue = b.cardCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredDecks(filtered);
  }, [userDecks, searchQuery, sortBy, sortOrder]);

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

  const handleCreateEmptyDeck = async () => {
    if (!isAuthenticated || !userId) {
      Alert.alert("Authentication Required", "Please log in to create a deck.");
      return;
    }
    
    if (!newDeckName.trim()) {
      Alert.alert("Invalid Name", "Please enter a name for your deck.");
      return;
    }

    setIsCreatingDeck(true);
    const successId = await createEmptyDeck(userId, newDeckName.trim());
    setIsCreatingDeck(false);

    if (successId) {
      Alert.alert("Success!", `Empty deck "${newDeckName.trim()}" created successfully.`);
      setShowAddDeckModal(false);
      setNewDeckName('');
      fetchDecks(); // Refresh the list
    } else {
      Alert.alert("Error", "Could not create the empty deck. Please try again.");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortIcon = () => {
    return sortOrder === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'name': return 'Name';
      case 'date': return 'Date';
      case 'cards': return 'Cards';
      default: return 'Date';
    }
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

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchToggle}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Feather name={showSearch ? "x" : "search"} size={20} color="#718096" />
          </TouchableOpacity>
          
          {showSearch && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search decks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          )}
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              const sortOptions = ['name', 'date', 'cards'];
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setSortBy(sortOptions[nextIndex] as 'name' | 'date' | 'cards');
            }}
          >
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
            <Feather name="chevron-down" size={16} color="#718096" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortOrderButton}
            onPress={toggleSortOrder}
          >
            <Feather name={getSortIcon()} size={16} color="#718096" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {isLoadingDecks && !refreshing ? (
        <View style={styles.loadingContainer}>
          <EngagingLoadingScreen variant="fullscreen" showBackground={false} />
        </View>
      ) : filteredDecks.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <AntDesign name="book" size={32} color="#CBD5E0" />
          </View>
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'No decks found' : 'No saved decks yet'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {searchQuery 
              ? 'Try adjusting your search or filters'
              : 'Save conversation decks from your generated cards to access them here'
            }
          </Text>
        </View>
      ) : (
        <>
          {/* Section Header */}
          <View style={styles.sectionContainer}>
            <View>
              <Text style={styles.sectionTitle}>Your Collections</Text>
              <Text style={styles.sectionSubtitle}>
                {searchQuery 
                  ? `Found ${filteredDecks.length} deck${filteredDecks.length !== 1 ? 's' : ''}`
                  : 'Tap any deck to start using it'
                }
              </Text>
            </View>
          </View>

          {/* Deck List */}
          <FlatList
            data={filteredDecks}
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddDeckModal(true)}
      >
        <AntDesign name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Deck Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddDeckModal}
        onRequestClose={() => setShowAddDeckModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowAddDeckModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Deck</Text>
                <Text style={styles.modalSubtitle}>Give your new deck a memorable name</Text>
              </View>
              
              <TextInput
                style={styles.textInput}
                placeholder="Enter deck name..."
                value={newDeckName}
                onChangeText={setNewDeckName}
                autoFocus
                maxLength={50}
              />
              
              <TouchableOpacity 
                style={[styles.modalPrimaryButton, isCreatingDeck && styles.disabledButton]} 
                onPress={handleCreateEmptyDeck}
                disabled={isCreatingDeck}
              >
                {isCreatingDeck ? (
                  <EngagingLoadingScreen variant="mini" showBackground={false} />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Create Deck</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowAddDeckModal(false)}
                disabled={isCreatingDeck}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  // Search and Filter Container
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchToggle: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    color: '#1A202C',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: 'Petrona-Regular',
    color: '#374151',
  },
  sortOrderButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 80, // Increased from 24 to account for bottom sheet (12% of screen + some padding)
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000, // Ensure FAB stays above bottom sheet
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  textInput: {
    width: '100%',
    padding: 16,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    backgroundColor: '#FFFFFF',
    color: '#1A202C',
  },
  modalPrimaryButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#374151',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Petrona-Bold',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Petrona-Regular',
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
    opacity: 0.7,
  },
}); 