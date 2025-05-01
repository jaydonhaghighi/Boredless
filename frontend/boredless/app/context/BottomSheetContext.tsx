import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';

// Context types
type BottomSheetContextType = {
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  bottomSheetRef: React.RefObject<BottomSheet>;
};

// Create context
const BottomSheetContext = createContext<BottomSheetContextType | null>(null);

// Provider component
export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const openBottomSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return (
    <BottomSheetContext.Provider
      value={{
        openBottomSheet,
        closeBottomSheet,
        bottomSheetRef,
      }}
    >
      {children}
    </BottomSheetContext.Provider>
  );
};

// Custom hook to use the bottom sheet context
export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
}; 

export default BottomSheetContext;