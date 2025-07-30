import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Dimensions, Alert, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation,
  Easing 
} from 'react-native-reanimated';
import { Card, DeepConversationCard } from '../types/card';
import { CardTitle, CardSection, CardMainContent, CardListItem } from './CardElements';
import { useFontLoader } from '../hooks/useFontLoader';
import AnimatedCardStack from './AnimatedCardStack';
import { useAuth } from '../hooks/useAuth';
import { 
  saveAiSetAsDeck, 
  createNewDeckWithSingleCard, 
  addCardToExistingDeck, 
  getUserDecks,
  Deck, // Import Deck type
  createEmptyDeck // Import createEmptyDeck
} from '../services/firestoreService';
import EngagingLoadingScreen from './EngagingLoadingScreen';

// Screen dimensions for card animations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PromptComponentProps {
  cards: Card[];
  currentCardIndex: number;
  onClose: () => void;
  onChangeCard?: (newIndex: number) => void;
}

export default function PromptComponent({ 
  cards, 
  currentCardIndex, 
  onClose,
  onChangeCard 
}: PromptComponentProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();

  // New state variables
  const [showNameDeckModal, setShowNameDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [showDeckListModal, setShowDeckListModal] = useState(false);
  const [existingDecks, setExistingDecks] = useState<Deck[]>([]);
  const [isProcessingFavoriteAction, setIsProcessingFavoriteAction] = useState(false);
  const [nameDeckModalAction, setNameDeckModalAction] = useState<'createEmpty' | 'saveSet' | null>(null);

  // Get the current card safely, with fallback
  const currentCard = cards[currentCardIndex] || cards[0] || {
    question: 'No question available',
    title: 'Prompt',
    card_type: 'deep_conversations',
    reflection: '',
    followups: []
  } as DeepConversationCard;

  // Function to go to next card
  const goToNextCard = useCallback((newIndex: number) => {
    if (onChangeCard) {
      onChangeCard(newIndex);
    }
  }, [onChangeCard]);

  // Function to toggle card flip
  const toggleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Function to toggle favorite modal
  const showFavoriteModal = useCallback(() => {
    setFavoriteModalVisible(true);
  }, []);

  // Function to toggle favorite status
  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    // Here you would typically save this state to AsyncStorage or your backend
    console.log(`Card ${currentCardIndex} favorite status: ${!isFavorite}`);
    if (!isFavorite) { // If becoming favorite, show modal
        showFavoriteModal();
    }
  }, [isFavorite, currentCardIndex, showFavoriteModal]);
  
  // Function to handle creating a new deck
  const handleCreateDeck = useCallback(() => {
    // Logic for creating a new deck would go here
    console.log('Creating new deck with card:', cards[currentCardIndex]);
    setFavoriteModalVisible(false);
    
    // Navigate to create deck screen (this could be a new route)
    // router.push('/create-deck');
    
    // For now, show confirmation
    Alert.alert('New Deck', 'Started creating a new deck with this card!');
  }, [cards, currentCardIndex]);
  
  // Share functionality (example)
  const onShare = async () => {
    try {
      const cardToShare = cards[currentCardIndex];
      if (!cardToShare) return;
      // Customize this message
      let message = `Check out this prompt: ${cardToShare.title}\nQuestion: ${cardToShare.question}`;
      
      // Safely check for reflection property based on card type
      if (cardToShare.card_type === 'deep_conversations' && 'reflection' in cardToShare) {
        message += `\nReflection: ${cardToShare.reflection}`;
      }
      // ... add other fields as needed

      await Share.share({
        message,
        // url: 'your_app_link', // Optional: link to your app or content
        // title: 'Boredless Prompt' // Optional: for email subject etc.
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  // Font loading
  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Determine what content to show based on card type
  const renderFrontContent = (card: Card) => {
    switch(card.card_type) {
      case 'deep_conversations':
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
      
      case 'fun_challenges':
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
        
      case 'creative_prompts':
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
        
      case 'light_conversation':
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
        
      case 'hot_takes':
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
        
      case 'personality_quizzes':
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
        
      default:
        // Fallback for legacy cards or unknown types
        return (
          <>
            <CardTitle title={card.title} />
            <CardMainContent text={card.question} />
          </>
        );
    }
  };
  
  // Determine what content to show on the back based on card type
  const renderBackContent = (card: Card) => {
    switch(card.card_type) {
      case 'deep_conversations':
        return (
          <>
            <CardTitle title={card.title} />
            <CardSection title="Reflection">
              <Text style={styles.cardSectionText}>{card.reflection}</Text>
            </CardSection>
            
            {card.followups && card.followups.length > 0 && (
              <CardSection title="Follow-up Questions">
                {card.followups.map((followup: string, index: number) => (
                  <CardListItem key={index} text={followup} />
                ))}
              </CardSection>
            )}
          </>
        );
      
      case 'fun_challenges':
        return (
          <>
            <CardTitle title={card.title} />
            <CardSection title="Twist">
              <Text style={styles.cardSectionText}>{card.twist}</Text>
            </CardSection>
          </>
        );
      
      case 'creative_prompts':
        return (
          <>
            <CardTitle title={card.title} />
            <CardSection title="Bonus">
              <Text style={styles.cardSectionText}>{card.bonus}</Text>
            </CardSection>
          </>
        );
      
      case 'light_conversation':
        return (
          <>
            <CardTitle title={card.title} />
            {card.bonus && (
              <CardSection title="Bonus">
                <Text style={styles.cardSectionText}>{card.bonus}</Text>
              </CardSection>
            )}
          </>
        );
      
      case 'hot_takes':
        return (
          <>
            <CardTitle title={card.title} />
            <CardSection title="Perspectives">
              <CardListItem text={card.perspective1 || ''} />
              <CardListItem text={card.perspective2 || ''} />
            </CardSection>
            
            {card.debate_twist && (
              <CardSection title="Debate Twist">
                <Text style={styles.cardSectionText}>{card.debate_twist}</Text>
              </CardSection>
            )}
          </>
        );
      
      case 'personality_quizzes':
        return (
          <>
            <CardTitle title={card.title} />
            <CardSection title="Group Vote">
              <Text style={styles.cardSectionText}>{card.group_vote}</Text>
            </CardSection>
            <CardSection title="Reveal">
              <Text style={styles.cardSectionText}>{card.reveal}</Text>
            </CardSection>
          </>
        );
        
      default:
        // Fallback for legacy cards or unknown types
        return (
          <>
            <CardTitle title={card.title} />
            
            {/* Only show followups if they exist and the card type supports them */}
            {(card as any).followups && (card as any).followups.length > 0 && (
              <CardSection title="Follow-up Questions">
                {(card as any).followups.map((followup: string, index: number) => (
                  <CardListItem key={index} text={followup} />
                ))}
              </CardSection>
            )}
          </>
        );
    }
  };

  // *** NEW HANDLERS FOR FAVORITE MODAL ACTIONS ***

  const handleCreateNewDeckPress = () => {
    if (!isAuthenticated || !userId) {
      Alert.alert("Authentication Required", "Please log in to perform this action.");
      return;
    }
    setFavoriteModalVisible(false);
    setShowNameDeckModal(true);
    setNewDeckName(''); // Clear previous name
  };

  const handleCreateEmptyDeckPress = () => {
    if (!isAuthenticated || !userId) {
      Alert.alert("Authentication Required", "Please log in to perform this action.");
      return;
    }
    setNameDeckModalAction('createEmpty');
    setNewDeckName('');
    setFavoriteModalVisible(false);
    setShowNameDeckModal(true);
  };

  const handleSaveEntireSetPress = () => {
    if (!isAuthenticated || !userId) {
      Alert.alert("Authentication Required", "Please log in to save decks.");
      return;
    }
    if (!cards || cards.length === 0) {
      Alert.alert("No Cards", "There are no cards in the current set to save.");
      return;
    }
    setNameDeckModalAction('saveSet');
    setNewDeckName('');
    setFavoriteModalVisible(false);
    setShowNameDeckModal(true);
  };

  // Renamed and updated to handle multiple actions
  const handleConfirmNameDeckModal = async () => { 
    if (!userId || !nameDeckModalAction) return;
    if (!newDeckName.trim()) {
      Alert.alert("Invalid Name", "Please enter a name for your deck.");
      return;
    }

    setIsProcessingFavoriteAction(true);
    let successId: string | null = null;
    let successMessage = '';
    let errorMessage = '';

    if (nameDeckModalAction === 'createEmpty') {
      successId = await createEmptyDeck(userId, newDeckName.trim());
      successMessage = `Empty deck "${newDeckName.trim()}" created successfully.`;
      errorMessage = "Could not create the empty deck. Please try again.";
    } else if (nameDeckModalAction === 'saveSet') {
      const currentCardsToSave = cards; // Assuming 'cards' is the prop with the full set
      if (!currentCardsToSave || currentCardsToSave.length === 0) {
        Alert.alert("Error", "No cards in the current set to save.");
        setIsProcessingFavoriteAction(false);
        setShowNameDeckModal(false);
        setNameDeckModalAction(null);
        return;
      }
      successId = await saveAiSetAsDeck(userId, newDeckName.trim(), currentCardsToSave);
      successMessage = `Deck "${newDeckName.trim()}" with ${currentCardsToSave.length} cards saved successfully.`;
      errorMessage = "Could not save the entire set as a deck. Please try again.";
    }

    setIsProcessingFavoriteAction(false);

    if (successId) {
      Alert.alert("Success!", successMessage);
      setShowNameDeckModal(false);
      setNameDeckModalAction(null); // Reset action
    } else {
      Alert.alert("Error", errorMessage);
    }
  };

  const handleAddToExistingDeckPress = async () => {
    if (!isAuthenticated || !userId) {
      Alert.alert("Authentication Required", "Please log in to perform this action.");
      return;
    }
    setIsProcessingFavoriteAction(true);
    const fetchedDecks = await getUserDecks(userId);
    setIsProcessingFavoriteAction(false);
    
    if (fetchedDecks.length === 0) {
        Alert.alert("No Decks", "You don't have any decks yet. Try creating one first!", [
            { text: "OK", onPress: () => setFavoriteModalVisible(false) },
            { text: "Create New Deck", onPress: handleCreateNewDeckPress }
        ]);
        return;
    }

    setExistingDecks(fetchedDecks);
    setFavoriteModalVisible(false);
    setShowDeckListModal(true);
  };

  const handleSelectDeckAndAddCard = async (deckId: string) => {
    if (!userId) return;
    const cardToSave = cards[currentCardIndex];
    if (!cardToSave) {
        Alert.alert("Error", "No card selected.");
        return;
    }

    setIsProcessingFavoriteAction(true);
    const success = await addCardToExistingDeck(userId, deckId, cardToSave);
    setIsProcessingFavoriteAction(false);

    if (success) {
      Alert.alert("Card Added", "The current card has been added to the selected deck.");
      setShowDeckListModal(false);
    } else {
      Alert.alert("Error", "Could not add the card to the deck. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <View style={styles.mainContainer}>
        <AnimatedCardStack
          cards={cards}
          currentCardIndex={currentCardIndex}
          onChangeCard={goToNextCard}
          isFlipped={isFlipped}
          toggleFlip={toggleFlip}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          showFavoriteModal={showFavoriteModal}
          renderFrontContent={renderFrontContent}
          renderBackContent={renderBackContent}
        />
      </View>
      
      {/* Redesigned Favorite Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={favoriteModalVisible}
        onRequestClose={() => setFavoriteModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setFavoriteModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Save to Your Collection</Text>
                <Text style={styles.modalSubtitle}>Choose how you'd like to save this card</Text>
              </View>

              {/* Primary Actions */}
              <View style={styles.modalActionsContainer}>
                {/* Save Current Card */}
                <TouchableOpacity 
                  style={styles.modalPrimaryAction} 
                  onPress={handleAddToExistingDeckPress}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>💾</Text>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Save This Card</Text>
                    <Text style={styles.actionDescription}>Add the current card to an existing deck</Text>
                  </View>
                </TouchableOpacity>

                {/* Save Entire Set */}
                <TouchableOpacity 
                  style={styles.modalPrimaryAction} 
                  onPress={handleSaveEntireSetPress}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>📚</Text>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Save Entire Set</Text>
                    <Text style={styles.actionDescription}>Create a new deck with all {cards.length} cards</Text>
                  </View>
                </TouchableOpacity>

                {/* Create Empty Deck */}
                <TouchableOpacity 
                  style={styles.modalSecondaryAction} 
                  onPress={handleCreateEmptyDeckPress}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>✨</Text>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Create Empty Deck</Text>
                    <Text style={styles.actionDescription}>Start a new deck from scratch</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Cancel Button */}
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setFavoriteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Naming New Deck */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showNameDeckModal}
        onRequestClose={() => setShowNameDeckModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNameDeckModal(false)}>
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Name Your Deck</Text>
                <Text style={styles.modalSubtitle}>
                  {nameDeckModalAction === 'createEmpty' 
                    ? 'Give your new deck a memorable name' 
                    : 'Choose a name for your saved card collection'}
                </Text>
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
                style={[styles.modalPrimaryButton, isProcessingFavoriteAction && styles.disabledButton]} 
                onPress={handleConfirmNameDeckModal}
                disabled={isProcessingFavoriteAction}
              >
                {isProcessingFavoriteAction ? (
                  <EngagingLoadingScreen variant="mini" showBackground={false} />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Create Deck</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowNameDeckModal(false)}
                disabled={isProcessingFavoriteAction}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Selecting Existing Deck */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeckListModal}
        onRequestClose={() => setShowDeckListModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDeckListModal(false)}>
          <View style={[styles.modalContainer, { maxHeight: '70%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a Deck</Text>
                <Text style={styles.modalSubtitle}>Select where to save this card</Text>
              </View>
              
              {isProcessingFavoriteAction && (
                <View style={styles.loadingContainer}>
                  <EngagingLoadingScreen variant="mini" showBackground={false} />
                </View>
              )}
              
              {!isProcessingFavoriteAction && existingDecks.length > 0 ? (
                <ScrollView style={styles.deckListContainer} showsVerticalScrollIndicator={false}>
                  {existingDecks.map((deck) => (
                    <TouchableOpacity 
                      key={deck.id}
                      style={styles.deckItem}
                      onPress={() => handleSelectDeckAndAddCard(deck.id)}
                    >
                      <View style={styles.deckItemContent}>
                        <Text style={styles.deckItemTitle}>{deck.name}</Text>
                        <Text style={styles.deckItemCount}>{deck.cardCount || 0} cards</Text>
                      </View>
                      <Text style={styles.deckItemArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : !isProcessingFavoriteAction ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateIcon}>📚</Text>
                  <Text style={styles.emptyStateText}>No decks found</Text>
                  <Text style={styles.emptyStateSubtext}>Create your first deck to get started</Text>
                </View>
              ) : null}
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeckListModal(false)}
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  actionButton: {
    padding: 8,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: 0,
  },
  cardSectionText: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Petrona-Regular',
  },
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
  modalActionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modalPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSecondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
    lineHeight: 18,
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
  footerActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FDFBFA',
  },
  saveDeckButton: {
    backgroundColor: '#A97C63',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#A97C63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  saveDeckButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Nunito_700Bold',
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
    opacity: 0.7,
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
  deckListContainer: {
    width: '100%',
    maxHeight: 300,
  },
  deckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deckItemContent: {
    flex: 1,
  },
  deckItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 2,
  },
  deckItemCount: {
    fontSize: 13,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  deckItemArrow: {
    fontSize: 18,
    color: '#CBD5E0',
    fontFamily: 'Petrona-Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Petrona-Bold',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
  },
  cardTitleContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  cardSection: {
    marginVertical: 10,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Nunito_600SemiBold',
  },
  cardListItem: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    paddingVertical: 3,
  },
  cardMainContent: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 26,
  },
}); 