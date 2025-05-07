import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Dimensions, Alert, Image, Modal } from 'react-native';
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
import { Card } from '../types/card';
import { CardTitle, CardSection, CardMainContent, CardListItem } from './CardElements';
import { useFontLoader } from '../hooks/useFontLoader';
import AnimatedCardStack from './AnimatedCardStack';

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

  // Get the current card safely, with fallback
  const currentCard = cards[currentCardIndex] || {
    question: 'No question available',
    title: 'Prompt',
    followups: []
  };

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

  // Function to toggle favorite status
  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    // Here you would typically save this state to AsyncStorage or your backend
    console.log(`Card ${currentCardIndex} favorite status: ${!isFavorite}`);
  }, [isFavorite, currentCardIndex]);

  // Function to toggle favorite modal
  const showFavoriteModal = useCallback(() => {
    setFavoriteModalVisible(true);
  }, []);
  
  // Function to handle adding to existing deck
  const handleAddToExistingDeck = useCallback(() => {
    // Logic for adding to existing deck would go here
    console.log('Adding card to existing deck:', cards[currentCardIndex]);
    setFavoriteModalVisible(false);
    
    // Show confirmation
    Alert.alert('Added', 'Card has been added to existing deck!');
  }, [cards, currentCardIndex]);
  
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

  // Font loading
  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Determine what content to show based on card type
  const renderFrontContent = () => {
    switch(currentCard.card_type) {
      case 'deep_conversations':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
      
      case 'fun_challenges':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
        
      case 'creative_prompts':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
        
      case 'light_conversation':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
        
      case 'hot_takes':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
        
      case 'personality_quizzes':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
        
      default:
        // Fallback for legacy cards or unknown types
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardMainContent text={currentCard.question} />
          </>
        );
    }
  };
  
  // Determine what content to show on the back based on card type
  const renderBackContent = () => {
    switch(currentCard.card_type) {
      case 'deep_conversations':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardSection title="Reflection">
              <Text style={styles.cardSectionText}>{currentCard.reflection}</Text>
            </CardSection>
            
            {currentCard.followups && currentCard.followups.length > 0 && (
              <CardSection title="Follow-up Questions">
                {currentCard.followups.map((followup, index) => (
                  <CardListItem key={index} text={followup} />
                ))}
              </CardSection>
            )}
          </>
        );
      
      case 'fun_challenges':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardSection title="Twist">
              <Text style={styles.cardSectionText}>{currentCard.twist}</Text>
            </CardSection>
          </>
        );
      
      case 'creative_prompts':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardSection title="Bonus">
              <Text style={styles.cardSectionText}>{currentCard.bonus}</Text>
            </CardSection>
          </>
        );
      
      case 'light_conversation':
        return (
          <>
            <CardTitle title={currentCard.title} />
            {currentCard.bonus && (
              <CardSection title="Bonus">
                <Text style={styles.cardSectionText}>{currentCard.bonus}</Text>
              </CardSection>
            )}
          </>
        );
      
      case 'hot_takes':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardSection title="Perspectives">
              <CardListItem text={currentCard.perspective1 || ''} />
              <CardListItem text={currentCard.perspective2 || ''} />
            </CardSection>
            
            {currentCard.debate_twist && (
              <CardSection title="Debate Twist">
                <Text style={styles.cardSectionText}>{currentCard.debate_twist}</Text>
              </CardSection>
            )}
          </>
        );
      
      case 'personality_quizzes':
        return (
          <>
            <CardTitle title={currentCard.title} />
            <CardSection title="Group Vote">
              <Text style={styles.cardSectionText}>{currentCard.group_vote}</Text>
            </CardSection>
            <CardSection title="Reveal">
              <Text style={styles.cardSectionText}>{currentCard.reveal}</Text>
            </CardSection>
          </>
        );
        
      default:
        // Fallback for legacy cards or unknown types
        return (
          <>
            <CardTitle title={currentCard.title} />
            
            {currentCard.followups && currentCard.followups.length > 0 && (
              <CardSection title="Follow-up Questions">
                {currentCard.followups.map((followup, index) => (
                  <CardListItem key={index} text={followup} />
                ))}
              </CardSection>
            )}
          </>
        );
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
      
      {/* Favorite Modal */}
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
              <Text style={styles.modalTitle}>Save Card</Text>
              
              <TouchableOpacity 
                style={styles.modalOption} 
                onPress={handleAddToExistingDeck}
              >
                <Text style={styles.modalOptionText}>Add to existing deck</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleCreateDeck}
              >
                <Text style={styles.modalOptionText}>Create new deck</Text>
              </TouchableOpacity>
              
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '80%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
    fontFamily: 'Petrona-Bold',
  },
  modalOption: {
    backgroundColor: '#5D5FEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Petrona-Regular',
  },
  modalCancelButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Petrona-Regular',
  },
}); 