import { Card } from '../types/card';
import { CardTypeName, QuickStartTypeName } from '../constants/cardTypes';
import { generateCardsWithOpenAI } from './openaiService';
import { getRecentQuestions, getCategoryBalance, updateCardHistory } from './historyService'; 

export interface GenerateCardsRequest {
  topic?: string | null;
  card_type: CardTypeName | QuickStartTypeName; // Frontend card type name
  tone?: string | null;
  participants?: string | null;
  relationship?: string | null;
  userId?: string; // Required for history tracking
}

export interface PromptResponseData {
  cards: Card[];
}

export const generateCardsAPI = async (data: GenerateCardsRequest): Promise<PromptResponseData> => {
  try {
    console.log('Generating cards with OpenAI structured output and history tracking:', data);

    // If userId is provided, get history for duplicate prevention
    let excludedQuestions: string[] = [];
    let categoryBalance;
    
    if (data.userId) {
      console.log('Fetching user history for duplicate prevention...');
      
      // Get recent questions to avoid
      excludedQuestions = await getRecentQuestions(data.userId, data.card_type, 15);
      
      // Get category balance for variety
      categoryBalance = await getCategoryBalance(data.userId, data.card_type);
      
      console.log(`Found ${excludedQuestions.length} recent questions to avoid`);
      console.log('Category balance:', categoryBalance);
    }

    // Generate cards using OpenAI with structured output and history
    const cards = await generateCardsWithOpenAI({
      cardType: data.card_type,
      topic: data.topic,
      tone: data.tone,
      participants: data.participants,
      relationship: data.relationship,
      excludedQuestions,
      categoryBalance,
    });

    // Update history after successful generation
    if (data.userId && cards.length > 0) {
      console.log('Updating user history with new questions...');
      await updateCardHistory(data.userId, data.card_type, cards);
    }

    console.log(`Successfully generated ${cards.length} cards with OpenAI (${excludedQuestions.length} excluded)`);
    
    return { cards };
  } catch (error) {
    console.error("Error generating cards with OpenAI:", error);
    throw error; 
  }
}; 