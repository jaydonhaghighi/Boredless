import React, { useEffect, useState, useCallback, useRef } from "react";
import { Text, View, StyleSheet, TouchableOpacity, FlatList, RefreshControl, TextInput, Modal, Animated } from 'react-native';
import { useBottomSheetVisibility } from "@/context/TabContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getUserDecks, getDeckCards, Deck, deckDataEvents, DECK_DATA_CHANGED, createEmptyDeck } from "../../services/firestoreService";
import { Card } from "../../types/card";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, Ionicons, Feather } from '@expo/vector-icons';

export default function FavouritesScreen() {
  const { showBottomSheet } = useBottomSheetVisibility();
  const { userId, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false); // For animation control
  const searchBarOpacity = useRef(new Animated.Value(0)).current;
  const searchBarTranslateY = useRef(new Animated.Value(-10)).current;
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
    setLoadingDeckId(deckId);
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
        showToast("This deck doesn't have any cards.", "warning");
      }
    } catch (error) {
      showToast("Could not load cards for this deck.", "error");
    }
    setLoadingDeckId(null);
  };

  const handleCreateEmptyDeck = async () => {
    if (!isAuthenticated || !userId) {
      showToast("Please log in to create a deck.", "warning");
      return;
    }
    
    if (!newDeckName.trim()) {
      showToast("Please enter a name for your deck.", "warning");
      return;
    }

    setIsCreatingDeck(true);
    const successId = await createEmptyDeck(userId, newDeckName.trim());
    setIsCreatingDeck(false);

    if (successId) {
      showToast(`Empty deck "${newDeckName.trim()}" created successfully.`, "success");
      setShowAddDeckModal(false);
      setNewDeckName('');
      fetchDecks(); // Refresh the list
    } else {
      showToast("Could not create the empty deck. Please try again.", "error");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortIcon = () => {
    return sortOrder === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  // Animate search bar in/out
  const animateSearchBar = (show: boolean) => {
    if (show) {
      setIsSearchVisible(true);
      searchBarOpacity.setValue(0);
      searchBarTranslateY.setValue(-10);
      Animated.parallel([
        Animated.timing(searchBarOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(searchBarTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(searchBarOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(searchBarTranslateY, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => setIsSearchVisible(false));
    }
  };

  const handleSearchToggle = () => {
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);
    animateSearchBar(newShowSearch);
  };

  // Ensure search bar is mounted on first open
  useEffect(() => {
    if (showSearch) animateSearchBar(true);
    // eslint-disable-next-line
  }, []);

  const renderDeckItem = ({ item }: { item: Deck }) => (
    <TouchableOpacity 
      style={[
        styles.deckCard,
        loadingDeckId !== null && loadingDeckId !== item.id && styles.deckCardDisabled
      ]} 
      onPress={() => handleDeckPress(item.id)}
      disabled={loadingDeckId !== null}
      activeOpacity={loadingDeckId !== null ? 1 : 0.7}
    >
      <View style={styles.deckCardHeader}>
        <View style={styles.deckInfo}>
          <Text style={[
            styles.deckTitle,
            loadingDeckId !== null && loadingDeckId !== item.id && styles.deckTitleDisabled
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.deckSubtitle,
            loadingDeckId !== null && loadingDeckId !== item.id && styles.deckSubtitleDisabled
          ]}>
            {item.cardCount || 0} cards
          </Text>
        </View>
        {loadingDeckId === item.id && (
          <View style={styles.deckLoadingContainer}>
            <View style={styles.deckLoadingSpinner}>
              <Feather name="loader" size={16} color="#374151" />
            </View>
            <Text style={styles.deckLoadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hero Section - matching home.tsx */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Your Decks</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleSearchToggle}
            >
              <Feather name={showSearch ? "x" : "search"} size={20} color="#718096" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => setShowAddDeckModal(true)}
            >
              <Feather name="plus" size={20} color="#718096" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <Animated.View style={[styles.searchContainer, { opacity: searchBarOpacity, transform: [{ translateY: searchBarTranslateY }] }]}> 
          <TextInput
            style={styles.searchInput}
            placeholder="Search decks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={showSearch}
          />
        </Animated.View>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <View style={styles.sortOptions}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'name' && styles.sortOptionSelected]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextSelected]}>Name</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'date' && styles.sortOptionSelected]}
            onPress={() => setSortBy('date')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'date' && styles.sortOptionTextSelected]}>Date</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'cards' && styles.sortOptionSelected]}
            onPress={() => setSortBy('cards')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'cards' && styles.sortOptionTextSelected]}>Cards</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.sortOrderButton}
          onPress={toggleSortOrder}
        >
          <Feather name={getSortIcon()} size={16} color="#718096" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoadingDecks && !refreshing ? (
        <View style={styles.loadingContainer}>
          <View style={styles.fullLoadingSpinner}>
            <Feather name="loader" size={32} color="#374151" />
          </View>
          <Text style={styles.fullLoadingText}>Loading your decks...</Text>
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
                  <View style={styles.modalLoadingContainer}>
                    <Feather name="loader" size={16} color="#FFFFFF" />
                    <Text style={styles.modalLoadingText}>Creating...</Text>
                  </View>
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
    paddingBottom: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Petrona-Regular',
    lineHeight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
  },
  // Search Container
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  searchInput: {
    fontSize: 16,
    fontFamily: 'Petrona-Regular',
    color: '#1A202C',
  },
  // Sort Container
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  sortOptions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 8,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sortOptionSelected: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  sortOptionText: {
    fontSize: 14,
    fontFamily: 'Petrona-Regular',
    color: '#718096',
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Petrona-Bold',
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
    paddingBottom: 60,
  },
  // Deck Cards
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
  // Deck Loading Styles
  deckLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  deckLoadingSpinner: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckLoadingText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Petrona-Regular',
  },
  // Full Loading Styles
  fullLoadingSpinner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fullLoadingText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
  },
  // Modal Loading Styles
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalLoadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Petrona-Regular',
  },
  // Disabled States
  deckCardDisabled: {
    opacity: 0.5,
  },
  deckTitleDisabled: {
    color: '#CBD5E0',
  },
  deckSubtitleDisabled: {
    color: '#CBD5E0',
  },
}); 