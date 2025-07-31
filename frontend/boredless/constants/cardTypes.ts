/**
 * Constants for card type mappings and definitions
 */

/**
 * Card type definition and recommended filter mappings
 */
export const CARD_TYPES = {
  "Deep Conversations": {
    id: "deep_conversations",
    structure: {
      front: "Open-ended personal question",
      back: "Reflection: [prompt to go deeper]"
    },
    topics: ["Relationships & Dating", "Personality & Self-discovery", "Family & Home", "Philosophy & Big Questions"],
    tones: ["Thoughtful", "Reflective", "Romantic", "Calm", "Serious"],
    participants: ["Solo", "2", "3-5"],
    relationships: ["Self", "Close Friends", "Romantic Partners", "Friends", "Family"]
  },
  "Fun Challenges": {
    id: "fun_challenges",
    structure: {
      front: "Daring or playful question",
      back: "Twist: [game mechanic or rule]"
    },
    topics: ["Pop Culture & Entertainment", "Casual Chat", "Creativity & Imagination"],
    tones: ["Playful", "Humourous", "Energetic"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Friends", "Aquaintances", "Mixed Group"]
  },
  "Creative Prompts": {
    id: "creative_prompts",
    structure: {
      front: "Imaginative scenario",
      back: "Bonus: [creative extension]"
    },
    topics: ["Creativity & Imagination", "Personality & Self-discovery", "Pop Culture & Entertainment", "Casual Chat"],
    tones: ["Playful", "Friendly"],
    participants: ["Solo", "2", "3-5"],
    relationships: ["Self", "Friends", "Aquaintances", "Mixed Group"]
  },
  "Light Conversation": {
    id: "light_conversation",
    structure: {
      front: "Casual or small-talk prompt",
      back: "Bonus: [light follow-up]"
    },
    topics: ["Casual Chat", "Pop Culture & Entertainment", "Career & Goals", "Learning & Education"],
    tones: ["Friendly", "Calm", "Humourous", "Thoughtful"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Strangers", "Aquaintances", "Coworkers", "Friends"]
  },
  "Hot Takes": {
    id: "hot_takes",
    structure: {
      front: "Debatable prompt",
      back: "Perspective 1 / Perspective 2 / Debate twist"
    },
    topics: ["Pop Culture & Entertainment", "Philosophy & Big Questions", "Debates & Opinions", "Learning & Education"],
    tones: ["Serious", "Humourous"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Friends", "Aquaintances", "Mixed Group"]
  },
  "Personality Quizzes": {
    id: "personality_quizzes",
    structure: {
      front: "Group guessing prompt",
      back: "Group vote / Reveal"
    },
    topics: ["Personality & Self-discovery", "Pop Culture & Entertainment", "Creativity & Imagination"],
    tones: ["Playful", "Friendly"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Friends", "Aquaintances", "Close Friends"]
  },
  "Table for Two": {
    id: "deep_conversations",
    structure: {
      front: "Meaningful, romantic, or playful question for couples",
      back: "Follow-up: A deeper or more specific prompt to extend the moment"
    },
    topics: ["Relationships & Dating"],
    tones: ["Romantic", "Thoughtful"],
    participants: ["2"],
    relationships: ["Romantic Partners"]
  },
  "Real Talk": {
    id: "deep_conversations",
    structure: {
      front: "A heartfelt or revealing question between friends",
      back: "Reflection: A prompt to unpack or explain the response"
    },
    topics: ["Personality & Self-discovery", "Relationships & Dating"],
    tones: ["Reflective", "Serious"],
    participants: ["2"],
    relationships: ["Close Friends", "Friends"]
  },
  "Last Call": {
    id: "light_conversation",
    structure: {
      front: "A bold, revealing, or hilarious challenge",
      back: "Twist: A rule or action that escalates the tension"
    },
    topics: ["Pop Culture & Entertainment", "Casual Chat"],
    tones: ["Energetic", "Playful", "Humourous"],
    participants: ["6+", "3-5"],
    relationships: ["Friends", "Mixed Group"]
  },
  "Icebreakers": {
    id: "light_conversation",
    structure: {
      front: "A light, fun, or quirky question anyone can answer",
      back: "Bonus: A second, humorous or surprising follow-up"
    },
    topics: ["Casual Chat"],
    tones: ["Friendly", "Playful", "Humourous"],
    participants: ["3-5", "6+", "2"],
    relationships: ["Aquaintances", "Strangers", "Mixed Group"]
  },
  "True Self": {
    id: "personality_quizzes",
    structure: {
      front: "A playful personality-style question",
      back: "Group vote: Ask others to decide / Reveal: The person explains"
    },
    topics: ["Personality & Self-discovery", "Pop Culture & Entertainment"],
    tones: ["Playful", "Friendly", "Humourous"],
    participants: ["3-5", "6+"],
    relationships: ["Mixed Group", "Friends", "Close Friends"]
  },
  "Hot Seat": {
    id: "deep_conversations",
    structure: {
      front: "A revealing question aimed at one person",
      back: "Push further: A second question that goes even deeper"
    },
    topics: ["Personality & Self-discovery", "Relationships & Dating"],
    tones: ["Serious", "Thoughtful", "Reflective"],
    participants: ["3-5"],
    relationships: ["Close Friends", "Friends"]
  },
  "Face-Off": {
    id: "hot_takes",
    structure: {
      front: "A polarizing question with two clear sides",
      back: "Perspective 1 / Perspective 2 / Debate twist"
    },
    topics: ["Debates & Opinions", "Pop Culture & Entertainment", "Philosophy & Big Questions"],
    tones: ["Thoughtful", "Serious", "Playful"],
    participants: ["3-5", "6+", "2"],
    relationships: ["Mixed Group", "Friends", "Aquaintances"]
  },
  "Deep Cuts": {
    id: "deep_conversations",
    structure: {
      front: "A deep or abstract emotional prompt",
      back: "Follow-up: A related question that cuts even deeper"
    },
    topics: ["Philosophy & Big Questions", "Personality & Self-discovery"],
    tones: ["Reflective", "Serious", "Thoughtful", "Calm"],
    participants: ["2", "Solo"],
    relationships: ["Close Friends", "Self", "Romantic Partners"]
  }
} as const;

// Define types based on the mappings
export type CardTypeName = keyof typeof CARD_TYPES;
export type CardTypeId = typeof CARD_TYPES[CardTypeName]['id'];

/**
 * Filter options for generating conversation prompts
 */
export const FILTER_OPTIONS = {
  topics: [
    "Casual Chat",
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

  cardTypes: [
    "Deep Conversations",
    "Fun Challenges",
    "Creative Prompts",
    "Light Conversation",
    "Hot Takes",
    "Personality Quizzes"
  ] as const,

  tones: [
    "Romantic",
    "Playful",
    "Friendly",
    "Thoughtful", 
    "Reflective",
    "Energetic",
    "Serious",
    "Calm",
    "Humourous"
  ] as const,

  participants: [
    "Solo",
    "2",
    "3-5",
    "6+"
  ] as const,

  relationships: [
    "Self",
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
export type Topic = typeof FILTER_OPTIONS.topics[number];
export type Tone = typeof FILTER_OPTIONS.tones[number];
export type Participants = typeof FILTER_OPTIONS.participants[number];
export type Relationship = typeof FILTER_OPTIONS.relationships[number];

/**
 * Maps card type name to card type ID
 */
export const mapCardTypeToId = (cardType: CardTypeName | null): string => {
  if (!cardType) return "light_conversation"; // Default
  
  // Check if the cardType exists in CARD_TYPES
  if (CARD_TYPES[cardType]) {
    return CARD_TYPES[cardType].id;
  }
  
  // Fallback to default if cardType isn't recognized
  console.warn(`Unknown card type: ${cardType}, using default.`);
  return "light_conversation"; 
};

/**
 * Gets recommended filter values for a specific card type
 */
export const getRecommendedFilters = (cardType: CardTypeName | null) => {
  if (!cardType) return {
    topics: FILTER_OPTIONS.topics,
    tones: FILTER_OPTIONS.tones,
    participants: FILTER_OPTIONS.participants,
    relationships: FILTER_OPTIONS.relationships
  };

  return {
    topics: CARD_TYPES[cardType].topics,
    tones: CARD_TYPES[cardType].tones,
    participants: CARD_TYPES[cardType].participants,
    relationships: CARD_TYPES[cardType].relationships
  };
};

/**
 * Gets the card structure for a specific card type
 */
export const getCardStructure = (cardType: CardTypeName | null) => {
  if (!cardType) return CARD_TYPES["Light Conversation"].structure;
  return CARD_TYPES[cardType].structure;
}; 