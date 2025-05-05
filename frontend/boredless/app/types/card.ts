/**
 * Card type definitions
 * 
 * This file contains shared type definitions for conversation cards throughout the app
 */

/**
 * Main Card interface representing a conversation prompt card
 */
export interface Card {
  question: string;
  title: string;
  followups: string[];
  theme?: string;
  interaction_type?: string;
  mood?: string;
  participants?: string;
  relationship?: string;
  card_type?: string;
  instructions?: string;
  options?: string[];
  stances?: string[];
  action_prompt?: string;
  correct_answer_index?: number;
}

/**
 * Response format for the card generation API
 */
export type CardResponse = {
  question: string;
  title: string;
  followups: string[];
  cards?: Card[];
  theme?: string;
  interaction_type?: string;
  mood?: string;
  participants?: string;
  relationship?: string;
  card_type?: string;
  instructions?: string;
  options?: string[];
  stances?: string[];
  action_prompt?: string;
  correct_answer_index?: number;
} 