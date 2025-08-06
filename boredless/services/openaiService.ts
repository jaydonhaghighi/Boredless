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
  excludedQuestions?: string[]; // Questions to avoid generating
  categoryBalance?: {           // Question category usage for balancing
    hypothetical: number;
    personal: number;
    comparative: number;
    storytelling: number;
    values: number;
    future: number;
  };
}

// High-quality examples for each card type to guide AI generation
const getQualityExamples = (cardType: string): string => {
  const examples: Record<string, string> = {
    deep_conversations: `
EXAMPLES OF HIGH-QUALITY DEEP CONVERSATION CARDS:

✅ EXCELLENT:
Title: "The Mentor's Shadow"
Question: "Think of someone who shaped who you are today, but you've never properly thanked them. What would you say to them if they were sitting here right now?"
Reflection: "Sometimes the people who change our lives don't even know they did it."
Follow-ups: ["What specific moment with them stands out most?", "How do you carry their influence forward today?"]

✅ EXCELLENT:  
Title: "Future Self Letter"
Question: "If your 80-year-old self could send you one piece of advice about the decision you're facing right now, what would they say?"
Reflection: "Our future selves often have the clarity we're missing in the moment."
Follow-ups: ["What do you think you'll regret not doing?", "What would make your older self proud?"]

❌ AVOID (too generic):
- "What's your biggest fear?"
- "What makes you happy?"
- "Tell me about yourself"`,

    fun_challenges: `
EXAMPLES OF HIGH-QUALITY FUN CHALLENGE CARDS:

✅ EXCELLENT:
Title: "Celebrity Swap Shop"
Question: "You can trade lives with any celebrity for exactly 24 hours, but you have to handle their biggest current drama. Who do you pick?"
Twist: "Everyone else gets to assign you one ridiculous task to complete during those 24 hours!"

✅ EXCELLENT:
Title: "Time Traveler's Dilemma" 
Question: "You're sent back to your first day of high school, but you can only change ONE thing. What is it?"
Twist: "Plot twist: The change creates a butterfly effect. What's the most unexpected consequence?"

❌ AVOID (too simple):
- "Would you rather be rich or famous?"
- "What's your favorite color?"
- "Do something silly"`,

    light_conversation: `
EXAMPLES OF HIGH-QUALITY LIGHT CONVERSATION CARDS:

✅ EXCELLENT:
Title: "Grocery Store Mysteries"
Question: "What's the weirdest thing you've seen someone do in a grocery store that made you think 'There's definitely a story there'?"
Follow-ups: ["What's your own weirdest grocery store moment?", "Which aisle tells the most about someone's life?"]

✅ EXCELLENT:
Title: "Childhood Food Crimes"
Question: "What's the strangest food combination you loved as a kid that would horrify people now?"
Follow-ups: ["Do you still secretly eat it sometimes?", "What's the weirdest thing you've seen someone else eat?"]

❌ AVOID (too boring):
- "What's your favorite food?"
- "How was your day?"
- "What do you do for fun?"`,

    hot_takes: `
EXAMPLES OF HIGH-QUALITY HOT TAKES CARDS:

✅ EXCELLENT:
Title: "Social Media Honesty Hour"
Question: "Hot take: People who post gym selfies are either incredibly insecure or incredibly confident, and there's no in-between. Defend or destroy this theory."
Follow-ups: ["What's the most honest reason you've posted something?", "Which social media behavior secretly annoys you most?"]

✅ EXCELLENT:
Title: "Modern Romance Reality Check"
Question: "Controversial opinion: Dating apps have made us worse at actual relationships because we treat people like they're replaceable. Fight me or join me?"
Follow-ups: ["What's the worst dating app experience that proves this point?", "How would you meet someone if apps didn't exist?"]

❌ AVOID (not spicy enough):
- "Do you like pineapple on pizza?"
- "What's your opinion on..."
- "Some people think..."`,

    creative_prompts: `
EXAMPLES OF HIGH-QUALITY CREATIVE PROMPT CARDS:

✅ EXCELLENT:
Title: "Parallel Universe Job Fair"
Question: "In an alternate reality where your biggest childhood fear became a career, what would your job title be and what would a typical workday look like?"
Follow-ups: ["What would be the best and worst part of this job?", "Who would be your ideal coworker in this universe?"]

✅ EXCELLENT:
Title: "Emotion Color Palette"
Question: "If you had to paint your current mood using only three colors and kitchen utensils as brushes, what would your masterpiece look like?"
Follow-ups: ["What song would be playing while you paint it?", "Where would you hang this emotional artwork?"]

❌ AVOID (not creative enough):
- "Draw something"
- "Make up a story"
- "Use your imagination"`,

    personality_quizzes: `
EXAMPLES OF HIGH-QUALITY PERSONALITY QUIZ CARDS:

✅ EXCELLENT:
Title: "Your Personal Brand Animal"
Question: "If your personality was a animal at a house party, which animal would you be and what would you be doing at 2 AM when things get weird?"
Follow-ups: ["What animal would be your best friend at this party?", "Which animal would you avoid all night?"]

✅ EXCELLENT:
Title: "Superpower Personality Test"
Question: "You can have any superpower, but it only works when you're feeling your most authentic emotion. What power do you choose and when would it be strongest?"
Follow-ups: ["What would be your superhero weakness?", "Who would be your sidekick and what would their power be?"]

❌ AVOID (too predictable):
- "What type of person are you?"
- "Pick your favorite..."
- "Which category describes you?"`
  };

  return examples[cardType] || `
GENERAL QUALITY GUIDELINES:
- Be specific and concrete rather than vague
- Include unexpected twists or angles  
- Create emotional connection points
- Use vivid, memorable language
- Avoid clichéd question formats`;
};

// Quality validation and improvement function
const validateAndImproveCards = async (cards: Card[], cardType: string, retryCount = 0): Promise<Card[]> => {
  const maxRetries = 1; // Limit retries to avoid excessive API calls
  const qualityIssues: string[] = [];
  const improvedCards: Card[] = [];
  const lowQualityCards: Card[] = [];

  for (const card of cards) {
    const issues = checkCardQuality(card);
    
    if (issues.length === 0) {
      // Card passes quality check
      improvedCards.push(card);
    } else {
      // Log quality issues for monitoring
      qualityIssues.push(`Card "${card.title}": ${issues.join(', ')}`);
      lowQualityCards.push(card);
    }
  }

  // If we have quality issues and haven't exceeded retry limit
  if (lowQualityCards.length > 0 && retryCount < maxRetries) {
    console.warn(`Quality issues detected in ${lowQualityCards.length} cards, attempting refinement...`);
    
    try {
      // Attempt to refine the low-quality cards
      const refinedCards = await refineCards(lowQualityCards, cardType, qualityIssues);
      
      // Recursively validate the refined cards (with incremented retry count)
      const finalRefinedCards = await validateAndImproveCards(refinedCards, cardType, retryCount + 1);
      
      // Combine good cards with refined cards
      improvedCards.push(...finalRefinedCards);
      
    } catch (error) {
      console.error('Failed to refine cards:', error);
      // Fall back to original cards if refinement fails
      improvedCards.push(...lowQualityCards);
    }
  } else {
    // Either no quality issues, or we've exceeded retry limit
    if (lowQualityCards.length > 0) {
      console.warn(`${lowQualityCards.length} cards still have quality issues after ${retryCount} retries`);
      // Include them anyway - some conversation is better than none
      improvedCards.push(...lowQualityCards);
    }
  }

  if (qualityIssues.length > 0) {
    console.warn('Final quality report:', qualityIssues);
    // Could trigger analytics/monitoring here
  }

  return improvedCards;
};

// Refine low-quality cards using OpenAI
const refineCards = async (cards: Card[], cardType: string, issues: string[]): Promise<Card[]> => {
  const openai = getOpenAIClient();
  
  const refinementPrompt = `You are a conversation card quality expert. The following cards have quality issues and need improvement:

QUALITY ISSUES DETECTED:
${issues.join('\n')}

CARDS TO REFINE:
${cards.map((card, i) => `
${i + 1}. Title: "${card.title}"
   Question: "${card.question}"
   ${card.reflection ? `Reflection: "${card.reflection}"` : ''}
   ${card.followups ? `Follow-ups: ${JSON.stringify(card.followups)}` : ''}
`).join('')}

IMPROVEMENT REQUIREMENTS:
- Make questions more specific and concrete
- Add emotional hooks and relatable scenarios
- Avoid generic patterns like "What's your favorite..."
- Ensure questions are at least 50 characters
- Include engaging words like "imagine", "describe", "remember"
- Create memorable, creative titles
- Ensure proper question formatting

Please rewrite these cards to fix the quality issues while maintaining their core intent and the ${cardType} card structure.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert at improving conversation card quality." },
        { role: "user", content: refinementPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "refined_cards",
          strict: true,
          schema: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: CARD_SCHEMAS[cardType as keyof typeof CARD_SCHEMAS].properties.cards.items,
                minItems: cards.length,
                maxItems: cards.length
              }
            },
            required: ["cards"],
            additionalProperties: false
          }
        }
      },
      max_tokens: 2000,
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    console.log(`Successfully refined ${result.cards?.length || 0} cards`);
    
    return result.cards || cards; // Fall back to original if parsing fails
    
  } catch (error) {
    console.error('Error refining cards:', error);
    return cards; // Return original cards if refinement fails
  }
};

// Check individual card quality
const checkCardQuality = (card: Card): string[] => {
  const issues: string[] = [];

  // Check for generic/cliché patterns
  const genericPatterns = [
    /what.?s your favorite/i,
    /tell me about yourself/i,
    /what makes you happy/i,
    /what.?s your biggest/i,
    /if you could have any/i,
    /what would you do if/i
  ];

  const question = card.question.toLowerCase();
  
  genericPatterns.forEach(pattern => {
    if (pattern.test(question)) {
      issues.push('uses generic question pattern');
    }
  });

  // Check for specificity
  if (card.question.length < 50) {
    issues.push('question too short/vague');
  }

  // Check for emotional engagement
  const engagementWords = ['feel', 'remember', 'imagine', 'describe', 'picture', 'think about'];
  const hasEngagement = engagementWords.some(word => question.includes(word));
  
  if (!hasEngagement) {
    issues.push('lacks emotional engagement words');
  }

  // Check title quality
  if (!card.title || card.title.length < 10) {
    issues.push('title too short or missing');
  }

  // Check for question marks (should have them for questions)
  if (!card.question.includes('?')) {
    issues.push('missing question mark');
  }

  return issues;
};

export const generateCardsWithOpenAI = async (params: GenerateCardsParams): Promise<Card[]> => {
  const { cardType, topic, tone, participants, relationship, excludedQuestions = [], categoryBalance } = params;

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

  // Build exclusion prompt if we have previous questions
  const exclusionPrompt = excludedQuestions.length > 0 ? `

CRITICAL: Avoid generating questions similar to these recent ones:
${excludedQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Requirements for uniqueness:
- Use completely different question structures and phrasings
- Approach the topic from fresh angles and perspectives
- Vary conversation starters (What if/How would/Imagine/Tell me/Describe/etc.)
- Create scenarios the user hasn't explored recently
- Ensure each question feels genuinely new and different from the above list` : '';

  // Build category balance guidance
  const categoryGuidance = categoryBalance ? `

Question Type Balance Guidance:
Recent usage: Hypothetical(${categoryBalance.hypothetical}), Personal(${categoryBalance.personal}), Comparative(${categoryBalance.comparative}), Storytelling(${categoryBalance.storytelling}), Values(${categoryBalance.values}), Future(${categoryBalance.future})

To create variety, emphasize these question types:
${categoryBalance.hypothetical <= 2 ? '- Hypothetical questions ("What if...", "Imagine if...", "Suppose...")' : ''}
${categoryBalance.personal <= 2 ? '- Personal questions ("Tell me about...", "Describe your...", "Share a...")' : ''}
${categoryBalance.comparative <= 2 ? '- Comparative questions ("Would you rather...", "Do you prefer...", "Choose between...")' : ''}
${categoryBalance.storytelling <= 2 ? '- Storytelling questions ("Describe a time...", "Remember when...", "Tell a story about...")' : ''}
${categoryBalance.values <= 2 ? '- Values questions ("What matters most...", "What\'s important to you...", "What do you value...")' : ''}
${categoryBalance.future <= 2 ? '- Future questions ("In 10 years...", "Someday...", "Your future...")' : ''}` : '';

  // Build quality examples for this card type
  const qualityExamples = getQualityExamples(backendCardType);
  
  // Build the prompt based on card type and user preferences
  const systemPrompt = `You are an expert conversation designer who creates meaningful, engaging dialogue prompts based on psychology and human connection principles.

Card Type: ${cardType}
${cardTypeInfo.structure ? `Structure: ${JSON.stringify(cardTypeInfo.structure)}` : ''}
${cardTypeInfo.description ? `Purpose: ${cardTypeInfo.description}` : ''}

User Context:
${topic ? `- Topic Focus: ${topic}` : ''}
${tone ? `- Desired Tone: ${tone}` : ''}
${participants ? `- Group Size: ${participants}` : ''}
${relationship ? `- Relationship Dynamic: ${relationship}` : ''}${exclusionPrompt}${categoryGuidance}

QUALITY STANDARDS - Each question must meet ALL criteria:

🎯 ENGAGEMENT PRINCIPLES:
- Use specific, concrete scenarios rather than abstract concepts
- Include emotional hooks that create genuine curiosity
- Reference relatable life experiences and situations
- Avoid cliché or overused question formats

🧠 PSYCHOLOGICAL DEPTH:
- Tap into core human motivations (belonging, growth, meaning, fun)
- Create safe vulnerability - personal but not invasive
- Use progressive disclosure (start accessible, build depth)
- Include elements of surprise or unexpected angles

🗣️ CONVERSATION FLOW:
- Questions should naturally lead to follow-up dialogue
- Include built-in conversation bridges ("What about you?")
- Balance sharing vs. asking dynamics
- Create opportunities for storytelling, not just yes/no answers

✨ CREATIVITY & SPECIFICITY:
- Use vivid, memorable language and imagery
- Include specific details, names, scenarios, or contexts
- Avoid generic templates ("What's your favorite...")
- Create unique angles on familiar topics

${qualityExamples}

Generate exactly 8 cards that exemplify these quality standards. Each card should feel like it was crafted by a professional conversation facilitator who understands human psychology and social dynamics.

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

    // Validate and potentially improve card quality
    const validatedCards = await validateAndImproveCards(enhancedCards, backendCardType);
    
    console.log(`Generated ${validatedCards.length} high-quality cards with OpenAI structured output`);
    return validatedCards;

  } catch (error) {
    console.error('Error generating cards with OpenAI:', error);
    throw new Error(`Failed to generate cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};