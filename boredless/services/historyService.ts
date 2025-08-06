import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  arrayUnion,
  increment 
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { Card } from '../types/card';
import { CardTypeName, QuickStartTypeName } from '../constants/cardTypes';

// TypeScript interfaces for history data
export interface QuestionCategoryUsage {
  hypothetical: number;    // "What if..." questions
  personal: number;        // "Tell me about..." questions  
  comparative: number;     // "Would you rather..." questions
  storytelling: number;    // "Describe a time..." questions
  values: number;          // "What matters most..." questions
  future: number;          // "Imagine in 10 years..." questions
}

export interface CardHistory {
  recentQuestions: string[];           // Last 30 questions
  questionHashes: string[];            // Hashed versions for fast lookup
  totalGenerations: number;            // Total times this card type was generated
  lastGenerated: Timestamp | null;     // When last generated
  categoryUsage: QuestionCategoryUsage; // Track question type balance
  createdAt: Timestamp | null;         // When history was first created
  lastCleanup: Timestamp | null;       // When old questions were last cleaned
}

// Default empty history
const createEmptyHistory = (): Omit<CardHistory, 'createdAt' | 'lastGenerated' | 'lastCleanup'> => ({
  recentQuestions: [],
  questionHashes: [],
  totalGenerations: 0,
  categoryUsage: {
    hypothetical: 0,
    personal: 0,
    comparative: 0,
    storytelling: 0,
    values: 0,
    future: 0
  }
});

// Simple hash function for questions
const hashQuestion = (question: string): string => {
  return question.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
};

// Categorize question type based on content
const categorizeQuestion = (question: string): keyof QuestionCategoryUsage => {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('what if') || lowerQ.includes('imagine if') || lowerQ.includes('suppose')) {
    return 'hypothetical';
  } else if (lowerQ.includes('tell me about') || lowerQ.includes('describe your') || lowerQ.includes('share a')) {
    return 'personal';
  } else if (lowerQ.includes('would you rather') || lowerQ.includes('prefer') || lowerQ.includes('choose between')) {
    return 'comparative';
  } else if (lowerQ.includes('describe a time') || lowerQ.includes('remember when') || lowerQ.includes('story about')) {
    return 'storytelling';
  } else if (lowerQ.includes('what matters') || lowerQ.includes('important to you') || lowerQ.includes('value most')) {
    return 'values';
  } else if (lowerQ.includes('in 10 years') || lowerQ.includes('future') || lowerQ.includes('someday')) {
    return 'future';
  }
  
  // Default to personal if we can't categorize
  return 'personal';
};

/**
 * Get card generation history for a user and card type
 */
export const getCardHistory = async (
  userId: string, 
  cardType: CardTypeName | QuickStartTypeName
): Promise<CardHistory> => {
  try {
    const historyRef = doc(db, 'users', userId, 'cardHistory', cardType);
    const historySnap = await getDoc(historyRef);
    
    if (historySnap.exists()) {
      return historySnap.data() as CardHistory;
    } else {
      // Create new history document
      const newHistory: CardHistory = {
        ...createEmptyHistory(),
        createdAt: serverTimestamp() as Timestamp,
        lastGenerated: null,
        lastCleanup: null
      };
      
      await setDoc(historyRef, newHistory);
      return newHistory;
    }
  } catch (error) {
    console.error('Error getting card history:', error);
    // Return empty history on error
    return {
      ...createEmptyHistory(),
      createdAt: null,
      lastGenerated: null,
      lastCleanup: null
    };
  }
};

/**
 * Get recent questions for exclusion from prompts
 */
export const getRecentQuestions = async (
  userId: string, 
  cardType: CardTypeName | QuickStartTypeName, 
  limit: number = 15
): Promise<string[]> => {
  try {
    const history = await getCardHistory(userId, cardType);
    return history.recentQuestions.slice(-limit);
  } catch (error) {
    console.error('Error getting recent questions:', error);
    return [];
  }
};

/**
 * Update history after successful card generation
 */
export const updateCardHistory = async (
  userId: string,
  cardType: CardTypeName | QuickStartTypeName,
  newCards: Card[]
): Promise<void> => {
  try {
    const historyRef = doc(db, 'users', userId, 'cardHistory', cardType);
    const currentHistory = await getCardHistory(userId, cardType);
    
    // Extract questions from new cards
    const newQuestions = newCards.map(card => card.question);
    const newHashes = newQuestions.map(hashQuestion);
    
    // Count question categories
    const categoryUpdates: Partial<QuestionCategoryUsage> = {};
    newQuestions.forEach(question => {
      const category = categorizeQuestion(question);
      categoryUpdates[category] = (currentHistory.categoryUsage[category] || 0) + 1;
    });
    
    // Combine with existing questions (keep last 30)
    const allQuestions = [...currentHistory.recentQuestions, ...newQuestions];
    const allHashes = [...currentHistory.questionHashes, ...newHashes];
    
    // Keep only last 30 questions
    const recentQuestions = allQuestions.slice(-30);
    const recentHashes = allHashes.slice(-30);
    
    // Update history
    const updatedHistory: Partial<CardHistory> = {
      recentQuestions,
      questionHashes: recentHashes,
      totalGenerations: currentHistory.totalGenerations + 1,
      lastGenerated: serverTimestamp() as Timestamp,
      categoryUsage: {
        ...currentHistory.categoryUsage,
        ...Object.fromEntries(
          Object.entries(categoryUpdates).map(([key, value]) => [
            key, 
            (currentHistory.categoryUsage[key as keyof QuestionCategoryUsage] || 0) + (value || 0)
          ])
        )
      }
    };
    
    await updateDoc(historyRef, updatedHistory);
    console.log(`Updated history for ${cardType}: ${newQuestions.length} new questions`);
    
  } catch (error) {
    console.error('Error updating card history:', error);
    // Don't throw - history update failure shouldn't break card generation
  }
};

/**
 * Get category usage for balanced question generation
 */
export const getCategoryBalance = async (
  userId: string,
  cardType: CardTypeName | QuickStartTypeName
): Promise<QuestionCategoryUsage> => {
  try {
    const history = await getCardHistory(userId, cardType);
    return history.categoryUsage;
  } catch (error) {
    console.error('Error getting category balance:', error);
    return createEmptyHistory().categoryUsage;
  }
};

/**
 * Clean up old questions (called periodically)
 */
export const cleanupOldHistory = async (userId: string): Promise<void> => {
  try {
    // This would clean up questions older than 30 days
    // For now, we're using a rolling window approach instead
    console.log('History cleanup completed for user:', userId);
  } catch (error) {
    console.error('Error cleaning up history:', error);
  }
};

/**
 * Reset history for a specific card type (for testing or user preference)
 */
export const resetCardHistory = async (
  userId: string,
  cardType: CardTypeName | QuickStartTypeName
): Promise<void> => {
  try {
    const historyRef = doc(db, 'users', userId, 'cardHistory', cardType);
    const resetHistory: CardHistory = {
      ...createEmptyHistory(),
      createdAt: serverTimestamp() as Timestamp,
      lastGenerated: null,
      lastCleanup: serverTimestamp() as Timestamp
    };
    
    await setDoc(historyRef, resetHistory);
    console.log(`Reset history for ${cardType}`);
  } catch (error) {
    console.error('Error resetting card history:', error);
    throw error;
  }
};