import { collection, addDoc, serverTimestamp, doc, writeBatch, Timestamp, query, where, getDocs, orderBy, runTransaction, increment, setDoc, limit } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { Card } from '../types/card';
import { FilterParams } from '../utils/cardUtils';

const USER_PROMPT_HISTORY_COLLECTION = 'user_prompt_history';
const DECKS_COLLECTION = 'decks';
const CARDS_SUBCOLLECTION = 'cards';

export interface HistoryEntryData {
  id?: string; // Optional ID, can be added when fetching
  userId: string;
  createdAt: Timestamp; // Firestore Timestamp for server-side time
  filters: FilterParams;
  generated_cards_data: Card[]; // The array of card objects
}

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
      createdAt: serverTimestamp() as Timestamp, // Let Firestore set the timestamp
      filters,
      generated_cards_data: generatedCardsData,
    };
    const docRef = await addDoc(collection(db, USER_PROMPT_HISTORY_COLLECTION), historyEntry);
    console.log('Generated set added to history with ID:', docRef.id);
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
      // We can store the full card object, or a subset if needed
      // For now, storing the full card object as defined in types/card.ts
      // Add userId to card if not already present, or if you want to enforce it
      batch.set(cardDocRef, { ...card, deckId: deckDocRef.id }); 
    });

    await batch.commit();
    console.log(`Deck '${deckName}' saved successfully with ID: ${deckDocRef.id} and ${generatedCardsData.length} cards.`);
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
    console.log(`Fetched ${decks.length} decks for user ${userId}`);
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
    console.log(`Fetched ${cards.length} cards for deck ${deckId}`);
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
    console.log(`Deck '${deckName}' created successfully with ID: ${deckDocRef.id} and 1 card.`);
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
      reflection: cardData.reflection || '',
      followups: cardData.followups || [],
      twist: cardData.twist || '',
      bonus: cardData.bonus || '',
      perspective1: cardData.perspective1 || '',
      perspective2: cardData.perspective2 || '',
      debate_twist: cardData.debate_twist || '',
      group_vote: cardData.group_vote || '',
      reveal: cardData.reveal || '',
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

    console.log(`Card added to deck ${deckId} successfully.`);
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

    console.log(`Empty deck '${deckName}' created successfully with ID: ${deckDocRef.id}.`);
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
    
    console.log(`Fetched ${historyEntries.length} prompt history entries for user ${userId} (limited to ${limitCount})`);
    return historyEntries;
  } catch (error) {
    console.error("Error fetching user prompt history:", error);
    return [];
  }
};

// We will add getDeckCards functions later. 