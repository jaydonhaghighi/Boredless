/**
 * Constants for card type mappings and definitions
 * Aligned with backend CARD_TYPE_MAPPING and CARD_TYPE_STRUCTURES
 */

// Backend card type mapping - matches backend/constants.py
export const BACKEND_CARD_TYPE_MAPPING = {
  // Standard card types
  "Deep Conversations": "deep_conversations",
  "Fun Challenges": "fun_challenges", 
  "Creative Prompts": "creative_prompts",
  "Light Conversation": "light_conversation",
  "Hot Takes": "hot_takes",
  "Personality Quizzes": "personality_quizzes",
  // Quick Start items map to standard card types
  "Table for Two": "deep_conversations",
  "Real Talk": "deep_conversations", 
  "Last Call": "fun_challenges",
  "Icebreakers": "light_conversation",
  "True Self": "personality_quizzes",
  "Hot Seat": "deep_conversations",
  "Face-Off": "hot_takes",
  "Deep Cuts": "deep_conversations"
} as const;

/**
 * Card type definitions with structures that match backend output
 */
export const CARD_TYPES = {
  "Deep Conversations": {
    id: "deep_conversations",
    structure: {
      front: "A sincere, emotionally relevant question that invites reflection",
      back: "A short prompt encouraging the person to explain more deeply"
    },
    fields: ["title", "question", "reflection", "followups"],
    topics: ["Relationships & Dating", "Personality & Self-discovery", "Family & Home", "Philosophy & Big Questions"],
    tones: ["Thoughtful", "Reflective", "Romantic", "Calm", "Serious"],
    participants: ["Solo", "2", "3-5"],
    relationships: ["Self", "Close Friends", "Romantic Partners", "Friends", "Family"]
  },
  "Fun Challenges": {
    id: "fun_challenges", 
    structure: {
      front: "A playful, wild or daring challenge/question",
      back: "A rule that escalates the prompt (e.g. take a sip, switch, reveal more)"
    },
    fields: ["title", "question", "twist"],
    topics: ["Pop Culture & Entertainment", "Casual Chat", "Creativity & Imagination"],
    tones: ["Playful", "Humourous", "Energetic"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Friends", "Aquaintances", "Mixed Group"]
  },
  "Creative Prompts": {
    id: "creative_prompts",
    structure: {
      front: "A creative scenario or question",
      back: "An extra twist that continues the scenario or adds a new creative element"
    },
    fields: ["title", "question", "bonus"],
    topics: ["Creativity & Imagination", "Personality & Self-discovery", "Pop Culture & Entertainment", "Casual Chat"],
    tones: ["Playful", "Friendly"],
    participants: ["Solo", "2", "3-5"],
    relationships: ["Self", "Friends", "Aquaintances", "Mixed Group"]
  },
  "Light Conversation": {
    id: "light_conversation",
    structure: {
      front: "A fun, easygoing, or observational question",
      back: "A light follow-up or activity to extend the moment"
    },
    fields: ["title", "question", "bonus"],
    topics: ["Casual Chat", "Pop Culture & Entertainment", "Career & Goals", "Learning & Education"],
    tones: ["Friendly", "Calm", "Humourous", "Thoughtful"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Strangers", "Aquaintances", "Coworkers", "Friends"]
  },
  "Hot Takes": {
    id: "hot_takes",
    structure: {
      front: "A polarizing or opinion-based question",
      back: "Perspective 1: One common viewpoint / Perspective 2: The opposing view / Debate twist: A rule"
    },
    fields: ["title", "question", "perspective1", "perspective2", "debate_twist"],
    topics: ["Pop Culture & Entertainment", "Philosophy & Big Questions", "Debates & Opinions", "Learning & Education"],
    tones: ["Serious", "Humourous"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Friends", "Aquaintances", "Mixed Group"]
  },
  "Personality Quizzes": {
    id: "personality_quizzes",
    structure: {
      front: "A personality-style label or guessing question",
      back: "Group vote: Instruction for the group to decide / Reveal: Prompt for the person to reveal and react"
    },
    fields: ["title", "question", "group_vote", "reveal"],
    topics: ["Personality & Self-discovery", "Pop Culture & Entertainment", "Creativity & Imagination"],
    tones: ["Playful", "Friendly"],
    participants: ["2", "3-5", "6+"],
    relationships: ["Friends", "Aquaintances", "Close Friends"]
  }
} as const;

/**
 * Quick Start options with their specific configurations
 */
export const QUICK_START_TYPES = {
  "Table for Two": {
    backend_id: "deep_conversations",
    description: "Perfect for dates",
    structure: {
      front: "A meaningful, romantic, or playful question for couples",
      back: "Follow-up: A deeper or more specific prompt to extend the moment"
    },
    recommended_filters: {
      topics: ["Relationships & Dating"],
      tones: ["Romantic", "Thoughtful"],
      participants: ["2"],
      relationships: ["Romantic Partners"]
    }
  },
  "Real Talk": {
    backend_id: "deep_conversations",
    description: "Deep conversations",
    structure: {
      front: "A heartfelt or revealing question between friends",
      back: "Reflection: A prompt to unpack or explain the response"
    },
    recommended_filters: {
      topics: ["Personality & Self-discovery", "Relationships & Dating"],
      tones: ["Reflective", "Serious"],
      participants: ["2"],
      relationships: ["Close Friends", "Friends"]
    }
  },
  "Last Call": {
    backend_id: "fun_challenges",
    description: "Party vibes",
    structure: {
      front: "A bold, revealing, or hilarious challenge",
      back: "Twist: A rule or action that escalates the tension"
    },
    recommended_filters: {
      topics: ["Pop Culture & Entertainment", "Casual Chat"],
      tones: ["Energetic", "Playful", "Humourous"],
      participants: ["6+", "3-5"],
      relationships: ["Friends", "Mixed Group"]
    }
  },
  "Icebreakers": {
    backend_id: "light_conversation",
    description: "Break the ice",
    structure: {
      front: "A light, fun, or quirky question anyone can answer",
      back: "Bonus: A second, humorous or surprising follow-up"
    },
    recommended_filters: {
      topics: ["Casual Chat"],
      tones: ["Friendly", "Playful", "Humourous"],
      participants: ["3-5", "6+", "2"],
      relationships: ["Aquaintances", "Strangers", "Mixed Group"]
    }
  },
  "True Self": {
    backend_id: "personality_quizzes",
    description: "Personality reveals",
    structure: {
      front: "A playful personality-style question",
      back: "Group vote: Ask others to decide / Reveal: The person explains"
    },
    recommended_filters: {
      topics: ["Personality & Self-discovery", "Pop Culture & Entertainment"],
      tones: ["Playful", "Friendly", "Humourous"],
      participants: ["3-5", "6+"],
      relationships: ["Mixed Group", "Friends", "Close Friends"]
    }
  },
  "Hot Seat": {
    backend_id: "deep_conversations",
    description: "Spicy questions",
    structure: {
      front: "A revealing question aimed at one person",
      back: "Push further: A second question that goes even deeper"
    },
    recommended_filters: {
      topics: ["Personality & Self-discovery", "Relationships & Dating"],
      tones: ["Serious", "Thoughtful", "Reflective"],
      participants: ["3-5"],
      relationships: ["Close Friends", "Friends"]
    }
  },
  "Face-Off": {
    backend_id: "hot_takes",
    description: "Friendly debates",
    structure: {
      front: "A polarizing question with two clear sides",
      back: "Perspective 1 / Perspective 2 / Debate twist"
    },
    recommended_filters: {
      topics: ["Debates & Opinions", "Pop Culture & Entertainment", "Philosophy & Big Questions"],
      tones: ["Thoughtful", "Serious", "Playful"],
      participants: ["3-5", "6+", "2"],
      relationships: ["Mixed Group", "Friends", "Aquaintances"]
    }
  },
  "Deep Cuts": {
    backend_id: "deep_conversations",
    description: "Philosophical talks",
    structure: {
      front: "A deep or abstract emotional prompt",
      back: "Follow-up: A related question that cuts even deeper"
    },
    recommended_filters: {
      topics: ["Philosophy & Big Questions", "Personality & Self-discovery"],
      tones: ["Reflective", "Serious", "Thoughtful", "Calm"],
      participants: ["2", "Solo"],
      relationships: ["Close Friends", "Self", "Romantic Partners"]
    }
  }
} as const;

// Define types based on the mappings
export type CardTypeName = keyof typeof CARD_TYPES;
export type QuickStartTypeName = keyof typeof QUICK_START_TYPES;
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

  quickStartTypes: [
    "Table for Two",
    "Real Talk", 
    "Last Call",
    "Icebreakers",
    "True Self",
    "Hot Seat",
    "Face-Off",
    "Deep Cuts"
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
 * Maps card type name to backend card type ID using the new mapping
 */
export const mapCardTypeToBackendId = (cardType: CardTypeName | QuickStartTypeName | null): string => {
  if (!cardType) return "light_conversation"; // Default
  
  // Check if it's in the backend mapping
  if (cardType in BACKEND_CARD_TYPE_MAPPING) {
    return BACKEND_CARD_TYPE_MAPPING[cardType as keyof typeof BACKEND_CARD_TYPE_MAPPING];
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
 * Gets recommended filter values for a Quick Start type
 */
export const getQuickStartFilters = (quickStartType: QuickStartTypeName) => {
  return QUICK_START_TYPES[quickStartType].recommended_filters;
};

/**
 * Gets the card structure for a specific card type
 */
export const getCardStructure = (cardType: CardTypeName | null) => {
  if (!cardType) return CARD_TYPES["Light Conversation"].structure;
  return CARD_TYPES[cardType].structure;
};

/**
 * Gets the Quick Start structure
 */
export const getQuickStartStructure = (quickStartType: QuickStartTypeName) => {
  return QUICK_START_TYPES[quickStartType].structure;
}; 