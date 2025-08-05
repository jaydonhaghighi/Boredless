import { Card } from '../types/card';

// TODO: Make this configurable, e.g., via environment variables
const API_BASE_URL = 'http://localhost:8000'; 

export interface PromptRequestData {
  topic?: string | null;
  card_type?: string | null; // This will be the friendly name like "Table for Two"
  tone?: string | null;
  participants?: string | null;
  relationship?: string | null;
}

export interface PromptResponseData {
  cards: Card[];
}

export const generateCardsAPI = async (data: PromptRequestData): Promise<PromptResponseData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generator/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Could not parse error JSON, use default error
      }
      throw new Error(errorDetail);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating cards from API:", error);
    // It's good practice to throw a custom error or the original error
    // to be handled by the calling function.
    throw error; 
  }
}; 