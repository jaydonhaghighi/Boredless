/**
 * Constants for card type mappings and definitions
 */

/**
 * Maps friendly interaction type names to their corresponding card types
 */
export const INTERACTION_TYPE_MAPPING = {
  "Conversation Starters": "conversation_starter",
  "Interactive Games": "interactive_game",
  "Quizzes": "quiz",
  "Friendly Debates": "debate",
  "Icebreakers": "icebreaker",
  "Thought-provoking Questions": "thought_provoking"
} as const;

// Define types based on the mappings
export type InteractionType = keyof typeof INTERACTION_TYPE_MAPPING;
export type CardType = typeof INTERACTION_TYPE_MAPPING[InteractionType];

/**
 * Filter options for generating conversation prompts
 */
export const FILTER_OPTIONS = {
  themes: [
    "Casual Chat",
    "Fun & Games",
    "Career & Goals",
    "Relationships & Dating",
    "Family & Home",
    "Personality & Self-discovery",
    "Debates & Opinions",
    "Learning & Education",
    "Pop Culture & Entertainment",
    "Philosophy & Big Questions",
    "Creativity & Imagination"
  ] as const,

  interactionTypes: [
    "Conversation Starters",
    "Interactive Games",
    "Quizzes",
    "Friendly Debates",
    "Icebreakers",
    "Thought-provoking Questions"
  ] as const,

  moods: [
    "Romantic",
    "Playful",
    "Friendly",
    "Thoughtful",
    "Reflective",
    "Energetic",
    "Serious",
    "Calm",
    "Humourous",
    "Adventurous"
  ] as const,

  participants: [
    "Solo",
    "2",
    "3-5",
    "6+"
  ] as const,

  relationships: [
    "Strangers",
    "Aquaintances",
    "Friends",
    "Close Friends",
    "Family",
    "Romantic Partners",
    "Coworkers",
    "Mixed Group"
  ] as const
};

// Define types based on the filter options
export type ConversationTheme = typeof FILTER_OPTIONS.themes[number];
export type Mood = typeof FILTER_OPTIONS.moods[number];
export type Participants = typeof FILTER_OPTIONS.participants[number];
export type Relationship = typeof FILTER_OPTIONS.relationships[number];

/**
 * Maps interaction type to card type 
 */
export const mapInteractionToCardType = (interactionType: InteractionType | null): string => {
  if (!interactionType) return "conversation_starter";
  return INTERACTION_TYPE_MAPPING[interactionType] || "conversation_starter";
}; 