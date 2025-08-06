import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import BottomSheet from "@gorhom/bottom-sheet";
import { Card, CardResponse } from '../types/card';
import { FilterParams } from '../utils/cardUtils';
import { addGeneratedSetToHistory } from '../services/firestoreService';
import { generateCardsAPI } from '../services/apiService';
import { useAuth } from './AuthContext';

// --- Current Tab Context ---
type CurrentTabContextType = {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
};

const CurrentTabContext = createContext<CurrentTabContextType | null>(null);

export const useCurrentTab = () => {
  const context = useContext(CurrentTabContext);
  if (!context) {
    throw new Error('useCurrentTab must be used within a CurrentTabProvider');
  }
  return context;
};

export const CurrentTabProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTab, setCurrentTab] = useState('home');

  return (
    <CurrentTabContext.Provider value={{ currentTab, setCurrentTab }}>
      {children}
    </CurrentTabContext.Provider>
  );
};

// --- New CurrentGenerationContext ---
interface CurrentGenerationState {
  currentFilters: FilterParams | null;
  generatedCards: Card[] | null;
  isGeneratingCards: boolean;
  error: string | null;
}

type CurrentGenerationContextType = {
  generationState: CurrentGenerationState;
  triggerCardGeneration: (filters: FilterParams) => Promise<void>;
  showOverlayLoading: () => void;
  hideOverlayLoading: () => void;
  isOverlayLoading: boolean;
};

const initialGenerationState: CurrentGenerationState = {
  currentFilters: null,
  generatedCards: null,
  isGeneratingCards: false,
  error: null,
};

export const CurrentGenerationContext = createContext<CurrentGenerationContextType>({
  generationState: initialGenerationState,
  triggerCardGeneration: async () => {},
  showOverlayLoading: () => {},
  hideOverlayLoading: () => {},
  isOverlayLoading: false,
});

export const useCurrentGeneration = () => useContext(CurrentGenerationContext);

export const CurrentGenerationProvider = ({ children }: { children: React.ReactNode }) => {
  const [generationState, setGenerationState] = useState<CurrentGenerationState>(initialGenerationState);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);
  const { userId } = useAuth();

  const showOverlayLoading = useCallback(() => {
    setIsOverlayLoading(true);
  }, []);

  const hideOverlayLoading = useCallback(() => {
    setIsOverlayLoading(false);
  }, []);

  const triggerCardGeneration = useCallback(async (filters: FilterParams) => {
    if (!userId) {
      console.error("User not authenticated, cannot generate or save history.");
      setGenerationState(prev => ({ ...prev, error: "User not authenticated.", isGeneratingCards: false }));
      return;
    }

    // Show overlay loading instead of bottom sheet loading
    setIsOverlayLoading(true);
    setGenerationState({
      currentFilters: filters,
      generatedCards: null,
      isGeneratingCards: true,
      error: null,
    });

    try {
      const response = await generateCardsAPI({
        topic: filters.topic,
        card_type: filters.card_type,
        tone: filters.tone,
        participants: filters.participants,
        relationship: filters.relationship,
        userId: userId, // Pass userId for history tracking
      });

      const cardsFromApi: Card[] = response.cards || [];

      if (cardsFromApi.length > 0) {
        const historyId = await addGeneratedSetToHistory(userId, cardsFromApi, filters);
        if (historyId) {
          console.log('Successfully added to history, ID:', historyId);
        } else {
          console.error('Failed to add to history');
        }

        setGenerationState(prev => ({
          ...prev,
          generatedCards: cardsFromApi,
          isGeneratingCards: false,
        }));
        setIsOverlayLoading(false);
      } else {
        console.log('No cards returned from API.');
        setGenerationState(prev => ({ ...prev, isGeneratingCards: false, error: 'No cards generated.' }));
        setIsOverlayLoading(false);
      }
    } catch (err: any) {
      console.error('Error during card generation or saving history:', err);
      setGenerationState(prev => ({
        ...prev,
        isGeneratingCards: false,
        error: err.message || 'Failed to generate cards.',
      }));
      setIsOverlayLoading(false);
    }
  }, [userId]);

  return (
    <CurrentGenerationContext.Provider value={{ 
      generationState, 
      triggerCardGeneration, 
      showOverlayLoading, 
      hideOverlayLoading, 
      isOverlayLoading 
    }}>
      {children}
    </CurrentGenerationContext.Provider>
  );
};

// --- BottomSheetVisibilityContext (can remain largely the same or be simplified if isGeneratingCards is used from CurrentGenerationContext) ---
// For now, keeping it separate as it also controls the ref and visibility methods not tied to generation state
type BottomSheetVisibilityContextType = {
  showBottomSheet: (cards?: Card[], initialIndex?: number) => void;
  hideBottomSheet: () => void;
  bottomSheetRef: React.RefObject<BottomSheet>;
  isVisible: boolean;
  setIsGeneratingSheetState: (isGenerating: boolean) => void;
  isSheetGenerating: boolean;
  cardsInSheet: Card[] | null;
  initialCardIndexInSheet: number;
};

const BottomSheetVisibilityContext = createContext<BottomSheetVisibilityContextType | null>(null);

export const useBottomSheetVisibility = () => {
  const context = useContext(BottomSheetVisibilityContext);
  if (!context) {
    throw new Error('useBottomSheetVisibility must be used within a BottomSheetVisibilityProvider');
  }
  return context;
};

export const BottomSheetVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSheetGenerating, setIsSheetGenerating] = useState(false);
  const [cardsInSheet, setCardsInSheet] = useState<Card[] | null>(null);
  const [initialCardIndexInSheet, setInitialCardIndexInSheet] = useState<number>(0);

  const showBottomSheet = useCallback((cardsToDisplay?: Card[], initialIndex?: number) => {
    console.log('showBottomSheet called with initialIndex:', initialIndex);
    
    if (cardsToDisplay && cardsToDisplay.length > 0) {
      setCardsInSheet(cardsToDisplay);
      // Ensure initialIndex is within bounds
      const safeInitialIndex = initialIndex !== undefined && initialIndex >= 0 && initialIndex < cardsToDisplay.length 
        ? initialIndex 
        : 0;
      
      console.log('Setting initialCardIndexInSheet to:', safeInitialIndex);
      setInitialCardIndexInSheet(safeInitialIndex);
    } else {
      setCardsInSheet(null);
      setInitialCardIndexInSheet(0);
    }
    setIsVisible(true);
  }, []);

  const hideBottomSheet = useCallback(() => {
    console.log('hideBottomSheet called - completely hiding the sheet');
    
    // First close the bottom sheet
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
    
    // Force state update with slight delay to ensure bottom sheet animation has started
    setTimeout(() => {
      console.log('Clearing bottom sheet state after close');
      setIsVisible(false);
      setCardsInSheet(null);
      setInitialCardIndexInSheet(0);
    }, 100);
  }, []);

  const setIsGeneratingSheetState = useCallback((isGenerating: boolean) => {
    setIsSheetGenerating(isGenerating);
  }, []);

  return (
    <BottomSheetVisibilityContext.Provider
      value={{
        showBottomSheet,
        hideBottomSheet,
        bottomSheetRef,
        isVisible,
        setIsGeneratingSheetState,
        isSheetGenerating,
        cardsInSheet,
        initialCardIndexInSheet,
      }}
    >
      {children}
    </BottomSheetVisibilityContext.Provider>
  );
}; 