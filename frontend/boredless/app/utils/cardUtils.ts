/**
 * Utilities for processing and mapping cards
 */
import { Card, CardResponse } from '../types/card';
import { mapInteractionToCardType, InteractionType, ConversationTheme, Mood, Participants, Relationship } from '../constants/cardTypes';

/**
 * Filter parameters for card generation
 */
export interface FilterParams {
  theme: ConversationTheme | null;
  interaction_type: InteractionType | null;
  mood: Mood | null;
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
    (filters.interaction_type ? mapInteractionToCardType(filters.interaction_type) : 'conversation_starter');
  
  return {
    question: cardData.question || '',
    title: cardData.title || filters.interaction_type || 'Prompt',
    followups: followups,
    theme: filters.theme || undefined,
    interaction_type: filters.interaction_type || undefined,
    mood: filters.mood || undefined,
    participants: filters.participants || undefined,
    relationship: filters.relationship || undefined,
    card_type: card_type,
    instructions: cardData.instructions || undefined,
    options: cardData.options || undefined,
    stances: cardData.stances || undefined,
    action_prompt: cardData.action_prompt || undefined,
    correct_answer_index: cardData.correct_answer_index || undefined
  };
}; 