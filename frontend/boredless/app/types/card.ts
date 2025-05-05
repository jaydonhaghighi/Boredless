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
  card_type?: string;
  
  // Deep Conversations specific fields
  reflection?: string;
  followups?: string[];
  
  // Fun Challenges specific fields
  twist?: string;
  
  // Creative Prompts specific fields
  bonus?: string;
  
  // Hot Takes specific fields
  perspective1?: string;
  perspective2?: string;
  debate_twist?: string;
  
  // Personality Quizzes specific fields
  group_vote?: string;
  reveal?: string;
  
  // Filter metadata
  topic?: string;
  tone?: string;
  participants?: string;
  relationship?: string;
}

/**
 * Response format for the card generation API
 */
export type CardResponse = {
  question: string;
  title: string;
  card_type?: string;
  cards?: Card[];
  
  // Deep Conversations specific fields
  reflection?: string;
  followups?: string[];
  
  // Fun Challenges specific fields
  twist?: string;
  
  // Creative Prompts specific fields
  bonus?: string;
  
  // Hot Takes specific fields
  perspective1?: string;
  perspective2?: string;
  debate_twist?: string;
  
  // Personality Quizzes specific fields
  group_vote?: string;
  reveal?: string;
  
  // Filter metadata
  topic?: string;
  tone?: string;
  participants?: string;
  relationship?: string;
} 