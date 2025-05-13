/**
 * Card type definitions
 * 
 * This file contains shared type definitions for conversation cards throughout the app
 */

/**
 * Base Card interface with common properties
 */
interface BaseCard {
  question: string;
  title: string;
  card_type: string;
  
  // Filter metadata
  topic?: string;
  tone?: string;
  participants?: string;
  relationship?: string;
  
  // Storage metadata
  id?: string;
  deckId?: string; // ID of the history entry or deck
  createdAt?: any; // Timestamp of creation
}

/**
 * Deep Conversations card type
 */
export interface DeepConversationCard extends BaseCard {
  card_type: 'deep_conversations';
  reflection: string;
  followups: string[];
}

/**
 * Fun Challenges card type
 */
export interface FunChallengeCard extends BaseCard {
  card_type: 'fun_challenges';
  twist: string;
}

/**
 * Creative Prompts card type
 */
export interface CreativePromptCard extends BaseCard {
  card_type: 'creative_prompts';
  bonus: string;
}

/**
 * Light Conversation card type
 */
export interface LightConversationCard extends BaseCard {
  card_type: 'light_conversation';
  bonus: string;
}

/**
 * Hot Takes card type
 */
export interface HotTakeCard extends BaseCard {
  card_type: 'hot_takes';
  perspective1: string;
  perspective2: string;
  debate_twist: string;
}

/**
 * Personality Quizzes card type
 */
export interface PersonalityQuizCard extends BaseCard {
  card_type: 'personality_quizzes';
  group_vote: string;
  reveal: string;
}

/**
 * Union type for all card types
 */
export type Card = DeepConversationCard | FunChallengeCard | CreativePromptCard | 
  LightConversationCard | HotTakeCard | PersonalityQuizCard;

/**
 * Response type that includes all cards plus the main/featured card
 */
export interface CardResponse extends Card {
  cards: Card[];
} 