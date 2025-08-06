import { Card } from '../types/card';
import { CardTypeName, QuickStartTypeName } from '../constants/cardTypes';
import { generateCardsWithOpenAI } from './openaiService'; 

export interface GenerateCardsRequest {
  topic?: string | null;
  card_type: CardTypeName | QuickStartTypeName; // Frontend card type name
  tone?: string | null;
  participants?: string | null;
  relationship?: string | null;
}

export interface PromptResponseData {
  cards: Card[];
}

export const generateCardsAPI = async (data: GenerateCardsRequest): Promise<PromptResponseData> => {
  try {
    console.log('Generating cards with OpenAI structured output:', data);

    // Generate cards using OpenAI with structured output
    const cards = await generateCardsWithOpenAI({
      cardType: data.card_type,
      topic: data.topic,
      tone: data.tone,
      participants: data.participants,
      relationship: data.relationship,
    });

    console.log('Successfully generated cards with OpenAI:', cards);
    
    return { cards };
  } catch (error) {
    console.error("Error generating cards with OpenAI:", error);
    throw error; 
  }
}; 