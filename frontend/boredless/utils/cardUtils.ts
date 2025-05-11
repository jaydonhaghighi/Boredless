/**
 * Utilities for processing and mapping cards
 */
import { Card, CardResponse } from '../types/card';
import { 
  CARD_TYPES, 
  CardTypeName, 
  mapCardTypeToId, 
  Topic, 
  Tone, 
  Participants, 
  Relationship 
} from '../constants/cardTypes';

/**
 * Filter parameters for card generation
 */
export interface FilterParams {
  topic: Topic | null;
  card_type: CardTypeName | null;
  tone: Tone | null;
  participants: Participants | null;
  relationship: Relationship | null;
}

/**
 * Maps API response data to properly formatted cards
 * Handles both the new API format (with cards array) and legacy format
 */
export const mapApiResponseToCards = (
  responseData: any, 
  filters: FilterParams
): CardResponse => {
  // Check if we have a cards array from the new API format
  if (responseData.cards && Array.isArray(responseData.cards) && responseData.cards.length > 0) {
    // Map all cards to our format
    const cards = responseData.cards.map((card: any) => 
      mapSingleCardData(card, filters)
    );
    
    // Return the first card as required by the interface, but include all cards directly
    const result: CardResponse = {
      ...mapSingleCardData(responseData.cards[0], filters),
      cards: cards // Include all cards
    };
    
    return result;
  } 
  
  // Legacy format (single card)
  const card = mapSingleCardData(responseData, filters);
  return {
    ...card,
    cards: [card]
  };
};

/**
 * Maps a single card object from the API to our Card format
 */
export const mapSingleCardData = (
  cardData: any, 
  filters: FilterParams
): Card => {
  // Extract followups array if it exists
  let followups: string[] = [];
  if (cardData.followups && Array.isArray(cardData.followups)) {
    followups = cardData.followups;
  }
  
  // Determine card type using shared utility
  const card_type = cardData.card_type || 
    (filters.card_type ? mapCardTypeToId(filters.card_type) : 'light_conversation');
  
  // Create base card with common fields
  const baseCard: Card = {
    question: cardData.question || '',
    title: cardData.title || filters.card_type || 'Prompt',
    card_type: card_type,
    topic: filters.topic || undefined,
    tone: filters.tone || undefined,
    participants: filters.participants || undefined,
    relationship: filters.relationship || undefined,
  };
  
  // Add card type specific fields based on the card type
  switch (card_type) {
    case 'deep_conversations':
      return {
        ...baseCard,
        followups: followups,
        reflection: cardData.reflection || 'Take a moment to reflect on this question.'
      };
      
    case 'fun_challenges':
      return {
        ...baseCard,
        twist: cardData.twist || 'Add your own twist to make this more fun!'
      };
      
    case 'creative_prompts':
      return {
        ...baseCard,
        bonus: cardData.bonus || 'Take it further by adding your own creative extension.'
      };
      
    case 'light_conversation':
      return {
        ...baseCard,
        bonus: cardData.bonus
      };
      
    case 'hot_takes':
      return {
        ...baseCard,
        perspective1: cardData.perspective1 || 'Perspective 1',
        perspective2: cardData.perspective2 || 'Perspective 2',
        debate_twist: cardData.debate_twist
      };
      
    case 'personality_quizzes':
      return {
        ...baseCard,
        group_vote: cardData.group_vote || 'Have the group vote on this.',
        reveal: cardData.reveal || 'The person should reveal their answer.'
      };
      
    default:
      // Handle legacy or unknown card types
      return {
        ...baseCard,
        followups: followups
      };
  }
}; 

/**
 * Gets recommended filter options for a card type
 * 
 * @param cardType The selected card type
 * @returns An object with arrays of recommended filter options
 */
export const getRecommendedOptions = (cardType: CardTypeName | null) => {
  if (!cardType || !CARD_TYPES[cardType]) {
    return {
      topics: [],
      tones: [],
      participants: [],
      relationships: []
    };
  }

  return {
    topics: CARD_TYPES[cardType].topics,
    tones: CARD_TYPES[cardType].tones,
    participants: CARD_TYPES[cardType].participants,
    relationships: CARD_TYPES[cardType].relationships
  };
}; 