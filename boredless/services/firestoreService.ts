import { collection, addDoc, serverTimestamp, doc, writeBatch, Timestamp, query, where, getDocs, orderBy, runTransaction, increment, setDoc, limit, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { Card } from '../types/card';
import { FilterParams } from '../utils/cardUtils';
// Simple EventEmitter implementation for React Native compatibility
class SimpleEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  // Aliases for compatibility with standard EventEmitter API
  addListener(event: string, listener: Function) {
    return this.on(event, listener);
  }

  removeListener(event: string, listener: Function) {
    return this.off(event, listener);
  }
}

const USER_PROMPT_HISTORY_COLLECTION = 'user_prompt_history';
const DECKS_COLLECTION = 'decks';
const CARDS_SUBCOLLECTION = 'cards';

/**
 * Utility function to clean card data by removing undefined values
 * Firestore doesn't allow undefined values, so we need to filter them out
 */
const cleanCardData = (card: Card): Record<string, any> => {
  const cleanedCard = { ...card } as Record<string, any>;
  
  // Remove undefined values recursively
  Object.keys(cleanedCard).forEach(key => {
    if (cleanedCard[key] === undefined) {
      delete cleanedCard[key];
    }
  });
  
  return cleanedCard;
};

export interface HistoryEntryData {
  id?: string; // Optional ID, can be added when fetching
  userId: string;
  createdAt: Timestamp; // Firestore Timestamp for server-side time
  filters: FilterParams;
  generated_cards_data: Card[]; // The array of card objects
  currentCardIndex?: number; // Track the current position in the deck
}

// Create a global event emitter for deck data changes
export const deckDataEvents = new SimpleEventEmitter();

// Event names
export const DECK_DATA_CHANGED = 'deckDataChanged';

/**
 * Adds a set of generated cards to the user's prompt history.
 * @param userId The ID of the authenticated user.
 * @param generatedCardsData The array of card objects that were generated.
 * @param filters The filter parameters used for generation.
 */
export const addGeneratedSetToHistory = async (
  userId: string,
  generatedCardsData: Card[],
  filters: FilterParams
): Promise<string | null> => {
  if (!userId) {
    console.error('User ID is required to add to history.');
    return null;
  }
  try {
    const historyEntry: HistoryEntryData = {
      userId,
      createdAt: serverTimestamp() as Timestamp,
      filters,
      generated_cards_data: generatedCardsData,
      currentCardIndex: 0,
    };
    const docRef = await addDoc(collection(db, USER_PROMPT_HISTORY_COLLECTION), historyEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error adding generated set to history:', error);
    return null;
  }
};

// Placeholder for Deck type (will be expanded)
export interface Deck {
  id: string;
  userId: string;
  name: string;
  createdAt: Timestamp;
  cardCount?: number; // Optional: can be denormalized
  currentCardIndex?: number; // Track the current position in the deck
}

/**
 * Saves an AI-generated set of cards as a new named deck for the user.
 * @param userId The ID of the authenticated user.
 * @param deckName The name for the new deck.
 * @param generatedCardsData The array of card objects to save.
 */
export const saveAiSetAsDeck = async (
  userId: string,
  deckName: string,
  generatedCardsData: Card[]
): Promise<string | null> => {
  if (!userId) {
    console.error('User ID is required to save a deck.');
    return null;
  }
  if (!deckName.trim()) {
    console.error('Deck name is required.');
    return null;
  }
  if (!generatedCardsData || generatedCardsData.length === 0) {
    console.error('Cannot save an empty set of cards as a deck.');
    return null;
  }

  const batch = writeBatch(db);

  try {
    // 1. Create the main deck document
    const deckDocRef = doc(collection(db, DECKS_COLLECTION));
    const newDeckData = {
      userId,
      name: deckName,
      createdAt: serverTimestamp() as Timestamp,
      cardCount: generatedCardsData.length, // Denormalize card count
    };
    batch.set(deckDocRef, newDeckData);

    // 2. Add each card to the 'cards' subcollection of the new deck
    const cardsSubcollectionRef = collection(db, DECKS_COLLECTION, deckDocRef.id, CARDS_SUBCOLLECTION);
    generatedCardsData.forEach((card) => {
      const cardDocRef = doc(cardsSubcollectionRef); // Auto-generate ID for each card
      // Clean the card data to remove any undefined values before saving
      const cleanedCard = cleanCardData(card);
      batch.set(cardDocRef, { ...cleanedCard, deckId: deckDocRef.id }); 
    });

    await batch.commit();
    
    // Emit event to notify that deck data has changed
    deckDataEvents.emit(DECK_DATA_CHANGED, { deckId: deckDocRef.id });
    
    return deckDocRef.id;
  } catch (error) {
    console.error('Error saving AI set as deck:', error);
    return null;
  }
};

/**
 * Fetches all decks created by a specific user.
 * @param userId The ID of the user whose decks to fetch.
 * @returns A promise that resolves to an array of Deck objects.
 */
export const getUserDecks = async (userId: string): Promise<Deck[]> => {
  if (!userId) {
    console.error('User ID is required to fetch decks.');
    return [];
  }
  try {
    const decksRef = collection(db, DECKS_COLLECTION);
    const q = query(
      decksRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc") // Order by most recent first
    );

    const querySnapshot = await getDocs(q);
    const decks: Deck[] = [];
    querySnapshot.forEach((doc) => {
      decks.push({ id: doc.id, ...doc.data() } as Deck);
    });
    return decks;
  } catch (error) {
    console.error("Error fetching user decks:", error);
    return []; // Return empty array on error
  }
};

/**
 * Fetches all cards for a specific deck.
 * @param deckId The ID of the deck whose cards to fetch.
 * @returns A promise that resolves to an array of Card objects.
 */
export const getDeckCards = async (deckId: string): Promise<Card[]> => {
  if (!deckId) {
    console.error('Deck ID is required to fetch cards.');
    return [];
  }
  try {
    const cardsRef = collection(db, DECKS_COLLECTION, deckId, CARDS_SUBCOLLECTION);
    // You might want to add orderBy for cards if they have a specific order field, e.g., an 'order' or 'createdAt' field
    // const q = query(cardsRef, orderBy("createdAt", "asc")); // Example ordering
    const querySnapshot = await getDocs(cardsRef);
    const cards: Card[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Manually construct the Card object to ensure type safety
      cards.push({
        id: doc.id,
        question: data.question,
        title: data.title,
        card_type: data.card_type,
        // Add all other fields from the Card interface, casting or providing defaults as necessary
        reflection: data.reflection,
        followups: data.followups,
        twist: data.twist,
        bonus: data.bonus,
        perspective1: data.perspective1,
        perspective2: data.perspective2,
        debate_twist: data.debate_twist,
        group_vote: data.group_vote,
        reveal: data.reveal,
        deckId: data.deckId, // if you store deckId on cards
        createdAt: data.createdAt // if you store createdAt on cards
        // Ensure all properties of Card are accounted for
      } as Card);
    });
    return cards;
  } catch (error) {
    console.error(`Error fetching cards for deck ${deckId}:`, error);
    return [];
  }
};

/**
 * Creates a new deck with a single card.
 * @param userId The ID of the authenticated user.
 * @param deckName The name for the new deck.
 * @param cardData The card to add to the new deck.
 * @returns A promise that resolves to the new deck's ID, or null on error.
 */
export const createNewDeckWithSingleCard = async (
  userId: string,
  deckName: string,
  cardData: Card
): Promise<string | null> => {
  if (!userId) {
    console.error('User ID is required to create a deck.');
    return null;
  }
  if (!deckName.trim()) {
    console.error('Deck name is required.');
    return null;
  }
  if (!cardData) {
    console.error('Card data is required to create a deck.');
    return null;
  }

  const batch = writeBatch(db);
  try {
    const deckDocRef = doc(collection(db, DECKS_COLLECTION));
    const newDeckData = {
      userId,
      name: deckName.trim(),
      createdAt: serverTimestamp() as Timestamp,
      cardCount: 1,
    };
    batch.set(deckDocRef, newDeckData);

    const cardDocRef = doc(collection(db, DECKS_COLLECTION, deckDocRef.id, CARDS_SUBCOLLECTION));
    batch.set(cardDocRef, { ...cardData, deckId: deckDocRef.id, createdAt: serverTimestamp() as Timestamp });

    await batch.commit();
    
    // Emit event to notify that deck data has changed
    deckDataEvents.emit(DECK_DATA_CHANGED, { deckId: deckDocRef.id });
    
    return deckDocRef.id;
  } catch (error) {
    console.error('Error creating new deck with single card:', error);
    return null;
  }
};

/**
 * Adds a single card to an existing deck.
 * @param userId The ID of the authenticated user (for validation, though not strictly needed if rules are set up).
 * @param deckId The ID of the deck to add the card to.
 * @param cardData The card to add.
 * @returns A promise that resolves to true on success, false on error.
 */
export const addCardToExistingDeck = async (
  userId: string, // Included for consistency and potential validation
  deckId: string,
  cardData: Card
): Promise<boolean> => {
  if (!deckId) {
    console.error('Deck ID is required to add a card.');
    return false;
  }
  if (!cardData) {
    console.error('Card data is required.');
    return false;
  }

  try {
    // Process the card to ensure all required fields are populated based on its type
    const processedCardData = { 
      ...cardData,
      // Ensure base fields
      question: cardData.question || 'What would you like to talk about?',
      title: cardData.title || 'Card',
      // Add extra fields based on card_type to prevent undefined values
      reflection: (cardData as any).reflection || '',
      followups: (cardData as any).followups || [],
      twist: (cardData as any).twist || '',
      bonus: (cardData as any).bonus || '',
      perspective1: (cardData as any).perspective1 || '',
      perspective2: (cardData as any).perspective2 || '',
      debate_twist: (cardData as any).debate_twist || '',
      group_vote: (cardData as any).group_vote || '',
      reveal: (cardData as any).reveal || '',
      // Metadata
      deckId: deckId
    };

    await runTransaction(db, async (transaction) => {
      const deckDocRef = doc(db, DECKS_COLLECTION, deckId);
      
      // Check if deck exists and belongs to user (optional, depends on security rules)
      // For now, we assume the calling code has validated user's right to modify the deck
      // const deckDoc = await transaction.get(deckDocRef);
      // if (!deckDoc.exists() || deckDoc.data().userId !== userId) {
      //   throw new Error("Deck not found or permission denied.");
      // }

      const newCardRef = doc(collection(db, DECKS_COLLECTION, deckId, CARDS_SUBCOLLECTION));
      transaction.set(newCardRef, { ...processedCardData, createdAt: serverTimestamp() as Timestamp });
      transaction.update(deckDocRef, { cardCount: increment(1) });
    });

    // Emit event to notify that deck data has changed
    deckDataEvents.emit(DECK_DATA_CHANGED, { deckId });
    return true;
  } catch (error) {
    console.error(`Error adding card to deck ${deckId}:`, error);
    return false;
  }
};

/**
 * Creates a new, empty deck for the user.
 * @param userId The ID of the authenticated user.
 * @param deckName The name for the new empty deck.
 * @returns A promise that resolves to the new deck's ID, or null on error.
 */
export const createEmptyDeck = async (
  userId: string,
  deckName: string
): Promise<string | null> => {
  if (!userId) {
    console.error('User ID is required to create an empty deck.');
    return null;
  }
  if (!deckName.trim()) {
    console.error('Deck name is required for an empty deck.');
    return null;
  }

  try {
    const deckDocRef = doc(collection(db, DECKS_COLLECTION));
    const newDeckData = {
      userId,
      name: deckName.trim(),
      createdAt: serverTimestamp() as Timestamp,
      cardCount: 0, // Explicitly set card count to 0 for an empty deck
    };
    await setDoc(deckDocRef, newDeckData); // Using setDoc directly as it's a single operation

    // Emit event to notify that deck data has changed
    deckDataEvents.emit(DECK_DATA_CHANGED, { deckId: deckDocRef.id });
    
    return deckDocRef.id;
  } catch (error) {
    console.error('Error creating empty deck:', error);
    return null;
  }
};

/**
 * Fetches the prompt generation history for a specific user.
 * @param userId The ID of the user whose prompt history to fetch.
 * @param limitCount The maximum number of history entries to return (default: 5).
 * @returns A promise that resolves to an array of HistoryEntryData objects.
 */
export const getUserPromptHistory = async (userId: string, limitCount: number = 5): Promise<HistoryEntryData[]> => {
  if (!userId) {
    console.error('User ID is required to fetch prompt history.');
    return [];
  }
  try {
    const historyRef = collection(db, USER_PROMPT_HISTORY_COLLECTION);
    const q = query(
      historyRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"), 
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const historyEntries: HistoryEntryData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<HistoryEntryData, 'id'>; 
      historyEntries.push({
        id: doc.id,
        ...data
      });
    });
    
    return historyEntries;
  } catch (error) {
    console.error("Error fetching user prompt history:", error);
    return [];
  }
};

/**
 * Updates the current card index for a history entry.
 * @param historyId The ID of the history entry.
 * @param newIndex The new card index to save.
 * @returns A promise that resolves to true on success, false on error.
 */
export const updateHistoryCardIndex = async (
  historyId: string,
  newIndex: number
): Promise<boolean> => {
  if (!historyId) {
    console.error('History ID is required to update card index.');
    return false;
  }
  
  try {
    const historyRef = doc(db, USER_PROMPT_HISTORY_COLLECTION, historyId);
    
    // First, try to get the document to see if it exists
    const docSnap = await getDoc(historyRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    await updateDoc(historyRef, {
      currentCardIndex: newIndex
    });
    
    // Emit event to notify that deck data has changed
    deckDataEvents.emit(DECK_DATA_CHANGED, { deckId: historyId, currentCardIndex: newIndex });
    
    return true;
  } catch (error) {
    console.error('Error updating history card index:', error);
    return false;
  }
};

/**
 * Checks if a history entry exists in Firestore.
 * @param historyId The ID of the history entry to check.
 * @returns A promise that resolves to true if the document exists, false otherwise.
 */
export const doesHistoryEntryExist = async (historyId: string): Promise<boolean> => {
  if (!historyId) {
    console.error('History ID is required to check if entry exists.');
    return false;
  }
  
  try {
    const historyRef = doc(db, USER_PROMPT_HISTORY_COLLECTION, historyId);
    const docSnap = await getDoc(historyRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking if history entry exists:', error);
    return false;
  }
};

/**
 * Updates the current card index for a saved deck.
 * @param deckId The ID of the deck.
 * @param newIndex The new card index to save.
 * @returns A promise that resolves to true on success, false on error.
 */
export const updateDeckCardIndex = async (
  deckId: string,
  newIndex: number
): Promise<boolean> => {
  if (!deckId) {
    console.error('Deck ID is required to update card index.');
    return false;
  }
  
  try {
    const deckRef = doc(db, DECKS_COLLECTION, deckId);
    
    // First, try to get the document to see if it exists
    const docSnap = await getDoc(deckRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    await updateDoc(deckRef, {
      currentCardIndex: newIndex
    });
    
    // Emit event to notify that deck data has changed
    deckDataEvents.emit(DECK_DATA_CHANGED, { deckId, currentCardIndex: newIndex });
    
    return true;
  } catch (error) {
    console.error('Error updating deck card index:', error);
    return false;
  }
};

/**
 * Checks if a deck exists in Firestore.
 * @param deckId The ID of the deck to check.
 * @returns A promise that resolves to true if the document exists, false otherwise.
 */
export const doesDeckExist = async (deckId: string): Promise<boolean> => {
  if (!deckId) {
    console.error('Deck ID is required to check if deck exists.');
    return false;
  }
  
  try {
    const deckRef = doc(db, DECKS_COLLECTION, deckId);
    const docSnap = await getDoc(deckRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking if deck exists:', error);
    return false;
  }
};

// We will add getDeckCards functions later. 