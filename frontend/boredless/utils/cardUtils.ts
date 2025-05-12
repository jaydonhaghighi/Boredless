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
  let followups: string[] = cardData.followups && Array.isArray(cardData.followups) 
    ? cardData.followups 
    : ["What's your experience with this?", "How does this make you feel?", "Can you share a related story?"];
  
  // Determine card type using shared utility
  const card_type = cardData.card_type || 
    (filters.card_type ? mapCardTypeToId(filters.card_type) : 'light_conversation');
  
  // Create base card with common fields
  const baseCard = {
    question: cardData.question || 'What would you like to talk about?',
    title: cardData.title || filters.card_type || 'Prompt',
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
        card_type: 'deep_conversations',
        followups,
        reflection: cardData.reflection || 'Take a moment to reflect on this question and consider how it relates to your own experiences.'
      };
      
    case 'fun_challenges':
      return {
        ...baseCard,
        card_type: 'fun_challenges',
        twist: cardData.twist || 'Add your own creative twist to make this challenge more exciting and personalized!'
      };
      
    case 'creative_prompts':
      return {
        ...baseCard,
        card_type: 'creative_prompts',
        bonus: cardData.bonus || 'For an extra challenge, try incorporating your personal experiences or an unexpected element.'
      };
      
    case 'light_conversation':
      return {
        ...baseCard,
        card_type: 'light_conversation',
        bonus: cardData.bonus || 'Keep the conversation flowing by sharing your own story after others have responded.'
      };
      
    case 'hot_takes':
      return {
        ...baseCard,
        card_type: 'hot_takes',
        perspective1: cardData.perspective1 || 'Consider the position that supports this view.',
        perspective2: cardData.perspective2 || 'Consider the position that challenges this view.',
        debate_twist: cardData.debate_twist || 'Try arguing for the opposite of your actual opinion to understand different perspectives.'
      };
      
    case 'personality_quizzes':
      return {
        ...baseCard,
        card_type: 'personality_quizzes',
        group_vote: cardData.group_vote || 'Have the group predict how the person will answer before they reveal.',
        reveal: cardData.reveal || 'The person should share their answer and explain their reasoning.'
      };
      
    default:
      // For unknown card types, treat as light conversation
      return {
        ...baseCard,
        card_type: 'light_conversation',
        bonus: cardData.bonus || 'Feel free to build on this question with your own experiences.'
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