import OpenAI from 'openai';
import { Card } from '../types/card';
import { CardTypeName, QuickStartTypeName, CARD_TYPES, QUICK_START_TYPES } from '../constants/cardTypes';

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  console.log('OpenAI API Key check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    starts_with_sk: apiKey?.startsWith('sk-') || false
  });
  
  if (!apiKey || apiKey === 'your-api-key-here') {
    console.error('OpenAI API key is missing or invalid');
    throw new Error('OpenAI API key is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

// JSON Schemas for structured output based on card types
const CARD_SCHEMAS = {
  deep_conversations: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "A compelling title for the conversation card" },
            card_type: { type: "string", enum: ["deep_conversations"] },
            question: { type: "string", description: "The main question to spark deep conversation" },
            reflection: { type: "string", description: "A thoughtful prompt encouraging deeper reflection" },
            followups: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4,
              description: "Follow-up questions to deepen the conversation"
            }
          },
          required: ["title", "card_type", "question", "reflection", "followups"],
          additionalProperties: false
        },
        minItems: 8,
        maxItems: 8
      }
    },
    required: ["cards"],
    additionalProperties: false
  },

  fun_challenges: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "A fun, energetic title for the challenge" },
            card_type: { type: "string", enum: ["fun_challenges"] },
            question: { type: "string", description: "The main challenge or daring question" },
            twist: { type: "string", description: "A rule or action that escalates the challenge" }
          },
          required: ["title", "card_type", "question", "twist"],
          additionalProperties: false
        },
        minItems: 8,
        maxItems: 8
      }
    },
    required: ["cards"],
    additionalProperties: false
  },

  creative_prompts: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "An imaginative title for the creative prompt" },
            card_type: { type: "string", enum: ["creative_prompts"] },
            question: { type: "string", description: "A creative scenario or imaginative question" },
            bonus: { type: "string", description: "An extra creative twist or extension to the scenario" }
          },
          required: ["title", "card_type", "question", "bonus"],
          additionalProperties: false
        },
        minItems: 8,
        maxItems: 8
      }
    },
    required: ["cards"],
    additionalProperties: false
  },

  light_conversation: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "A friendly, approachable title" },
            card_type: { type: "string", enum: ["light_conversation"] },
            question: { type: "string", description: "A casual, easy-going question anyone can answer" },
            bonus: { type: "string", description: "A light follow-up to extend the conversation" }
          },
          required: ["title", "card_type", "question", "bonus"],
          additionalProperties: false
        },
        minItems: 8,
        maxItems: 8
      }
    },
    required: ["cards"],
    additionalProperties: false
  },

  hot_takes: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "A provocative title that hints at the debate" },
            card_type: { type: "string", enum: ["hot_takes"] },
            question: { type: "string", description: "A polarizing question with clear opposing sides" },
            perspective1: { type: "string", description: "One common viewpoint or stance" },
            perspective2: { type: "string", description: "The opposing viewpoint or stance" },
            debate_twist: { type: "string", description: "A rule or mechanic to make the debate more engaging" }
          },
          required: ["title", "card_type", "question", "perspective1", "perspective2", "debate_twist"],
          additionalProperties: false
        },
        minItems: 8,
        maxItems: 8
      }
    },
    required: ["cards"],
    additionalProperties: false
  },

  personality_quizzes: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "A playful title for the personality assessment" },
            card_type: { type: "string", enum: ["personality_quizzes"] },
            question: { type: "string", description: "A personality-style question about someone in the group" },
            group_vote: { type: "string", description: "Instructions for the group to make predictions or vote" },
            reveal: { type: "string", description: "Instructions for the person to reveal and react" }
          },
          required: ["title", "card_type", "question", "group_vote", "reveal"],
          additionalProperties: false
        },
        minItems: 8,
        maxItems: 8
      }
    },
    required: ["cards"],
    additionalProperties: false
  }
};

interface GenerateCardsParams {
  cardType: CardTypeName | QuickStartTypeName;
  topic?: string | null;
  tone?: string | null;
  participants?: string | null;
  relationship?: string | null;
}

export const generateCardsWithOpenAI = async (params: GenerateCardsParams): Promise<Card[]> => {
  const { cardType, topic, tone, participants, relationship } = params;

  // Map card type to backend ID for schema lookup
  let backendCardType: string;
  let cardTypeInfo: any;

  if (cardType in CARD_TYPES) {
    backendCardType = CARD_TYPES[cardType as CardTypeName].id;
    cardTypeInfo = CARD_TYPES[cardType as CardTypeName];
  } else if (cardType in QUICK_START_TYPES) {
    backendCardType = QUICK_START_TYPES[cardType as QuickStartTypeName].backend_id;
    cardTypeInfo = QUICK_START_TYPES[cardType as QuickStartTypeName];
  } else {
    throw new Error(`Unknown card type: ${cardType}`);
  }

  // Get the appropriate schema
  const schema = CARD_SCHEMAS[backendCardType as keyof typeof CARD_SCHEMAS];
  if (!schema) {
    throw new Error(`No schema found for card type: ${backendCardType}`);
  }

  // Build the prompt based on card type and user preferences
  const systemPrompt = `You are a creative assistant that generates engaging conversation cards for social interactions. 

Card Type: ${cardType}
${cardTypeInfo.structure ? `Structure: ${JSON.stringify(cardTypeInfo.structure)}` : ''}
${cardTypeInfo.description ? `Purpose: ${cardTypeInfo.description}` : ''}

User Preferences:
${topic ? `- Topic: ${topic}` : ''}
${tone ? `- Tone: ${tone}` : ''}
${participants ? `- Participants: ${participants}` : ''}
${relationship ? `- Relationship: ${relationship}` : ''}

Generate exactly 8 unique, creative cards that match the specified card type structure. Make them:
- Engaging and thought-provoking
- Appropriate for the specified tone and relationship
- Varied in depth and approach (mix light and deep questions)
- Fun and memorable
- Diverse in topics and scenarios
- Progressive in complexity (start easier, build to more challenging)

Each card must follow the exact structure for ${backendCardType} cards.`;

  const userPrompt = `Generate exactly 8 ${cardType} cards focusing on ${topic || 'general conversation'} with a ${tone || 'balanced'} tone for ${participants || 'any number of'} participants in a ${relationship || 'mixed'} relationship context. Create a diverse set that ranges from lighter conversation starters to deeper, more meaningful questions.`;

  try {
    console.log('Generating cards with OpenAI structured output...');
    
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "conversation_cards",
          strict: true,
          schema: schema
        }
      },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = JSON.parse(response);
    const cards = parsedResponse.cards;

    // Add additional metadata to each card
    const enhancedCards = cards.map((card: any) => ({
      ...card,
      topic,
      tone,
      participants,
      relationship,
    }));

    console.log(`Generated ${enhancedCards.length} cards with OpenAI structured output (requested 8)`);
    return enhancedCards;

  } catch (error) {
    console.error('Error generating cards with OpenAI:', error);
    throw new Error(`Failed to generate cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};